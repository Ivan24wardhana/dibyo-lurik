// =====================================================
// /api/gulungan
// GET  - list gulungan (filter by produk_id, lebar, is_active)
// POST - create gulungan baru
//
// Logic POST:
//   - Auto-increment nomor_gulungan dari existing
//   - Auto-fill harga_per_meter via get_harga_per_meter() function di DB
//     (lookup from daftar_harga: jenis_pewarna + motif + lebar)
//   - Field minimal user input: produk_id, lebar, panjang_total
//   - panjang_sisa = panjang_total saat create
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/response-helper'
import { validate, safeParseBody } from '@/lib/validation'
import {
  parsePagination,
  parseQueryParam,
  buildPaginatedData,
} from '@/lib/crud-helper'
import { PRODUCTION_ROLES } from '@/lib/role-helper'
import supabaseAdmin from '@/lib/supabase-admin'

// =====================================================
// GET - List gulungan
// Query params:
//   ?produk_id=<uuid>      - filter by produk
//   ?lebar=70|110          - filter by lebar
//   ?is_active=true|false  - filter by status aktif
//   ?page=1&limit=20       - pagination
// =====================================================
export const GET = withAuth(async ({ request }) => {
  const pagination = parsePagination(request)
  const filterProduk = parseQueryParam(request, 'produk_id')
  const filterLebar = parseQueryParam(request, 'lebar')
  const filterAktif = parseQueryParam(request, 'is_active')

  let query = supabaseAdmin
    .from('gulungan')
    .select(
      `
        id,
        produk_id,
        nomor_gulungan,
        lebar,
        panjang_total,
        panjang_sisa,
        harga_per_meter,
        is_active,
        created_at,
        updated_at,
        produk:produk_id(
          id,
          kode_produk,
          gambar_url,
          jenis_pewarna,
          kategori:kategori_id(id, nama),
          motif:motif_id(id, nama),
          rak:rak_id(id, nama)
        )
      `,
      { count: 'exact' }
    )

  if (filterProduk) query = query.eq('produk_id', filterProduk)
  if (filterLebar) query = query.eq('lebar', parseInt(filterLebar))
  if (filterAktif === 'true') query = query.eq('is_active', true)
  if (filterAktif === 'false') query = query.eq('is_active', false)

  const { data, count, error } = await query
    .order('produk_id', { ascending: true })
    .order('nomor_gulungan', { ascending: true })
    .range(pagination.offset, pagination.offset + pagination.limit - 1)

  if (error) {
    console.error('[gulungan GET] error:', error)
    return errorResponse('Gagal memuat gulungan: ' + error.message, 500)
  }

  return successResponse(
    buildPaginatedData(data || [], count || 0, pagination)
  )
})

// =====================================================
// POST - Create gulungan
// Body (field minimal):
//   {
//     produk_id: uuid (required),
//     lebar: 70 | 110 (required),
//     panjang_total: number (required, > 0),
//     harga_per_meter?: number (optional - kalau null, auto-lookup dari daftar_harga)
//   }
//
// Flow:
//   1. Fetch produk untuk dapatkan jenis_pewarna & motif_id
//   2. Hitung nomor_gulungan = max + 1 dari existing
//   3. Kalau harga_per_meter null → call get_harga_per_meter() RPC
//   4. Insert dengan panjang_sisa = panjang_total
// =====================================================
export const POST = withAuthAndRole(PRODUCTION_ROLES, async ({ request }) => {
  const body = await safeParseBody(request)
  if (!body) {
    return errorResponse('Body request harus JSON valid', 400)
  }

  // Validasi field wajib
  const errors = validate(body, {
    produk_id: { type: 'uuid', required: true, label: 'Produk' },
    lebar: {
      type: 'enum',
      required: true,
      values: [70, 110],
      label: 'Lebar',
    },
    panjang_total: {
      type: 'number',
      required: true,
      min: 0.01,
      label: 'Panjang total',
    },
  })

  if (errors.length > 0) {
    return errorResponse('Data tidak valid', 400, { errors })
  }

  // Lebar bisa string '70' atau number 70 - normalize
  const lebar = parseInt(body.lebar)
  const panjangTotal = parseFloat(body.panjang_total)

  // Step 1: Fetch produk untuk dapat jenis_pewarna & motif_id
  const { data: produk, error: produkError } = await supabaseAdmin
    .from('produk')
    .select('id, jenis_pewarna, motif_id')
    .eq('id', body.produk_id)
    .single()

  if (produkError || !produk) {
    return notFoundResponse('Produk tidak ditemukan')
  }

  // Step 2: Hitung nomor_gulungan = max(existing) + 1
  const { data: maxGulungan } = await supabaseAdmin
    .from('gulungan')
    .select('nomor_gulungan')
    .eq('produk_id', body.produk_id)
    .order('nomor_gulungan', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nomorGulungan = (maxGulungan?.nomor_gulungan || 0) + 1

  // Step 3: Resolve harga_per_meter
  let hargaPerMeter
  if (body.harga_per_meter !== undefined && body.harga_per_meter !== null) {
    // User input manual
    hargaPerMeter = parseFloat(body.harga_per_meter)
    if (isNaN(hargaPerMeter) || hargaPerMeter < 0) {
      return errorResponse('Harga per meter tidak valid', 400)
    }
  } else {
    // Auto-lookup via DB function
    const { data: hargaResult, error: hargaError } = await supabaseAdmin.rpc(
      'get_harga_per_meter',
      {
        p_jenis_pewarna: produk.jenis_pewarna,
        p_motif_id: produk.motif_id,
        p_lebar: lebar,
      }
    )

    if (hargaError) {
      console.error('[gulungan POST] harga lookup error:', hargaError)
      return errorResponse('Gagal lookup harga: ' + hargaError.message, 500)
    }

    hargaPerMeter = parseFloat(hargaResult) || 0

    if (hargaPerMeter === 0) {
      return errorResponse(
        `Harga belum di-setup untuk pewarna ${produk.jenis_pewarna} lebar ${lebar}cm. Silakan setup di Daftar Harga atau input manual.`,
        400
      )
    }
  }

  // Step 4: Insert gulungan
  const { data, error } = await supabaseAdmin
    .from('gulungan')
    .insert({
      produk_id: body.produk_id,
      nomor_gulungan: nomorGulungan,
      lebar,
      panjang_total: panjangTotal,
      panjang_sisa: panjangTotal,
      harga_per_meter: hargaPerMeter,
      is_active: true,
    })
    .select(
      `
        id,
        produk_id,
        nomor_gulungan,
        lebar,
        panjang_total,
        panjang_sisa,
        harga_per_meter,
        is_active,
        created_at,
        updated_at
      `
    )
    .single()

  if (error) {
    console.error('[gulungan POST] error:', error)
    if (error.code === '23505') {
      return errorResponse(
        'Nomor gulungan sudah ada untuk produk ini',
        409
      )
    }
    return errorResponse('Gagal membuat gulungan: ' + error.message, 500)
  }

  return successResponse(data, 'Gulungan berhasil dibuat', 201)
})