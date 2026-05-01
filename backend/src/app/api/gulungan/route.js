// =====================================================
// /api/gulungan
// GET  - list semua gulungan dengan filter
// POST - tambah gulungan baru (kepala_produksi/owner)
//
// Schema v6 fields:
//   - produk_id (FK)
//   - nomor_gulungan (auto: max+1 per produk, UNIQUE per produk)
//   - lebar (70 atau 110)
//   - panjang_total (panjang awal saat ditambahkan)
//   - panjang_sisa (= panjang_total saat baru, dipotong oleh trigger order)
//   - harga_per_meter (auto-fill dari daftar_harga via lookup)
//   - is_active (TRUE saat baru, FALSE kalau panjang_sisa = 0)
//
// jenis_pewarna TIDAK ada di gulungan - inherit dari produk.
//
// Query params GET:
//   ?lebar=70|110           → filter lebar
//   ?is_active=true|false   → filter aktif/habis (boolean)
//   ?produk_id=<uuid>       → filter produk
//   ?page=1&limit=20        → pagination
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/response-helper'
import { PRODUCTION_ROLES } from '@/lib/role-helper'
import { validate, safeParseBody } from '@/lib/validation'
import {
  parsePagination,
  parseQueryParam,
  buildPaginatedData,
} from '@/lib/crud-helper'
import supabaseAdmin from '@/lib/supabase-admin'

// =====================================================
// GET - list gulungan dengan filter
// =====================================================
export const GET = withAuth(async ({ request }) => {
  const pagination = parsePagination(request)
  const filterLebar = parseQueryParam(request, 'lebar')
  const filterActive = parseQueryParam(request, 'is_active')
  const filterProduk = parseQueryParam(request, 'produk_id')

  const buildQuery = (forCount = false) => {
    let query = supabaseAdmin
      .from('gulungan')
      .select(
        forCount
          ? '*'
          : `
            id,
            nomor_gulungan,
            lebar,
            panjang_total,
            panjang_sisa,
            harga_per_meter,
            is_active,
            created_at,
            produk:produk_id(
              id,
              kode_produk,
              gambar_url,
              jenis_pewarna,
              motif:motif_id(nama_motif),
              kategori:kategori_id(nama_kategori),
              rak:rak_id(nama_rak)
            )
          `,
        forCount ? { count: 'exact', head: true } : undefined
      )

    if (filterLebar) query = query.eq('lebar', parseInt(filterLebar))
    if (filterActive !== null && filterActive !== undefined) {
      // Convert string 'true'/'false' ke boolean
      const boolValue = filterActive === 'true'
      query = query.eq('is_active', boolValue)
    }
    if (filterProduk) query = query.eq('produk_id', filterProduk)

    return query
  }

  const [countResult, dataResult] = await Promise.all([
    buildQuery(true),
    buildQuery(false)
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1),
  ])

  if (dataResult.error) {
    return errorResponse('Gagal memuat gulungan: ' + dataResult.error.message, 500)
  }

  return successResponse(
    buildPaginatedData(dataResult.data || [], countResult.count || 0, pagination)
  )
})

// =====================================================
// POST - tambah gulungan baru
// Field minimum dari frontend: produk_id, lebar, panjang_total
// Auto:
//   - nomor_gulungan: max(nomor_gulungan untuk produk_id) + 1
//   - harga_per_meter: lookup dari daftar_harga via (jenis_pewarna+motif+lebar)
//   - panjang_sisa: = panjang_total
//   - is_active: TRUE
// =====================================================
export const POST = withAuthAndRole(PRODUCTION_ROLES, async ({ request }) => {
  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body request tidak valid', 400)

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
      min: 0.1,
      label: 'Panjang total (m)',
    },
    // harga_per_meter optional - kalau tidak diisi, auto-fill dari daftar_harga
    harga_per_meter: {
      type: 'number',
      min: 0,
      label: 'Harga per meter',
    },
  })
  if (errors.length) return errorResponse(errors[0], 400, { errors })

  // Ambil produk untuk dapat jenis_pewarna & motif_id (untuk lookup harga)
  const { data: produk, error: produkErr } = await supabaseAdmin
    .from('produk')
    .select('id, jenis_pewarna, motif_id')
    .eq('id', body.produk_id)
    .single()

  if (produkErr || !produk) return notFoundResponse('Produk tidak ditemukan')

  // ===== Auto-fill harga_per_meter kalau tidak diisi =====
  let hargaPerMeter = body.harga_per_meter
  if (hargaPerMeter === undefined || hargaPerMeter === null) {
    // Lookup dari daftar_harga: priority motif spesifik > umum
    const { data: hargaSpecific } = await supabaseAdmin
      .from('daftar_harga')
      .select('harga_per_meter')
      .eq('jenis_pewarna', produk.jenis_pewarna)
      .eq('motif_id', produk.motif_id)
      .eq('lebar', body.lebar)
      .maybeSingle()

    if (hargaSpecific) {
      hargaPerMeter = Number(hargaSpecific.harga_per_meter)
    } else {
      // Fallback ke harga umum (motif_id NULL)
      const { data: hargaGeneral } = await supabaseAdmin
        .from('daftar_harga')
        .select('harga_per_meter')
        .eq('jenis_pewarna', produk.jenis_pewarna)
        .is('motif_id', null)
        .eq('lebar', body.lebar)
        .maybeSingle()

      if (hargaGeneral) {
        hargaPerMeter = Number(hargaGeneral.harga_per_meter)
      } else {
        return errorResponse(
          `Harga untuk ${produk.jenis_pewarna} ${body.lebar}cm belum diset di daftar_harga`,
          400
        )
      }
    }
  }

  // ===== Auto-generate nomor_gulungan: max+1 untuk produk ini =====
  const { data: maxRow } = await supabaseAdmin
    .from('gulungan')
    .select('nomor_gulungan')
    .eq('produk_id', body.produk_id)
    .order('nomor_gulungan', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nomorGulungan = (maxRow?.nomor_gulungan || 0) + 1

  // ===== Insert =====
  const { data, error } = await supabaseAdmin
    .from('gulungan')
    .insert({
      produk_id: body.produk_id,
      nomor_gulungan: nomorGulungan,
      lebar: body.lebar,
      panjang_total: body.panjang_total,
      panjang_sisa: body.panjang_total, // sama dengan panjang_total saat baru
      harga_per_meter: hargaPerMeter,
      is_active: true,
    })
    .select(`
      *,
      produk:produk_id(kode_produk, jenis_pewarna)
    `)
    .single()

  if (error) {
    return errorResponse('Gagal menyimpan gulungan: ' + error.message, 500)
  }

  return successResponse(data, 'Gulungan berhasil ditambahkan', 201)
})