// =====================================================
// /api/produk
// GET  - list produk (search by kode, filter status/kategori, pagination)
// POST - tambah produk baru (kepala_produksi/owner)
//
// Schema v6 catatan:
//   - kode_produk auto-generate by trigger (RAK+KAT_INITIAL+DDMMYY+MOTIF_INITIAL+SS)
//   - stok auto-update by trigger berdasarkan jumlah gulungan aktif
//   - status auto-update (ready kalau stok > 0, sold kalau stok = 0)
//   - terjual auto-update by trigger setelah ada item_order
//   - jenis_pewarna ada di tabel produk (gulungan inherit, tidak duplikasi)
//
// Query params GET:
//   ?q=keyword       → search di kode_produk
//   ?status=ready    → filter status (ready/sold)
//   ?kategori=<uuid> → filter kategori
//   ?motif=<uuid>    → filter motif
//   ?rak=<uuid>      → filter rak
//   ?page=1&limit=20 → pagination
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  conflictResponse,
} from '@/lib/response-helper'
import { PRODUCTION_ROLES } from '@/lib/role-helper'
import { validate, safeParseBody } from '@/lib/validation'
import {
  parsePagination,
  parseSearch,
  parseQueryParam,
  buildPaginatedData,
} from '@/lib/crud-helper'
import supabaseAdmin from '@/lib/supabase-admin'

// =====================================================
// GET - list produk dengan search & filter
// =====================================================
export const GET = withAuth(async ({ request }) => {
  const pagination = parsePagination(request)
  const search = parseSearch(request)
  const filterStatus = parseQueryParam(request, 'status')
  const filterKategori = parseQueryParam(request, 'kategori')
  const filterMotif = parseQueryParam(request, 'motif')
  const filterRak = parseQueryParam(request, 'rak')

  const buildQuery = (forCount = false) => {
    const selectFields = forCount
      ? '*'
      : `
        id,
        gambar_url,
        kode_produk,
        jenis_pewarna,
        stok,
        status,
        terjual,
        tanggal_ditambahkan,
        created_at,
        kategori:kategori_id(id, nama_kategori),
        motif:motif_id(id, nama_motif),
        rak:rak_id(id, nama_rak)
      `

    let query = supabaseAdmin
      .from('produk')
      .select(selectFields, forCount ? { count: 'exact', head: true } : undefined)

    if (filterStatus) query = query.eq('status', filterStatus)
    if (filterKategori) query = query.eq('kategori_id', filterKategori)
    if (filterMotif) query = query.eq('motif_id', filterMotif)
    if (filterRak) query = query.eq('rak_id', filterRak)

    // Search di kode_produk
    if (search) {
      query = query.ilike('kode_produk', `%${search}%`)
    }

    return query
  }

  const [countResult, dataResult] = await Promise.all([
    buildQuery(true),
    buildQuery(false)
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1),
  ])

  if (dataResult.error) {
    return errorResponse('Gagal memuat produk: ' + dataResult.error.message, 500)
  }

  return successResponse(
    buildPaginatedData(dataResult.data || [], countResult.count || 0, pagination)
  )
})

// =====================================================
// POST - tambah produk baru
// =====================================================
export const POST = withAuthAndRole(PRODUCTION_ROLES, async ({ request }) => {
  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body request tidak valid', 400)

  const errors = validate(body, {
    kategori_id: { type: 'uuid', required: true, label: 'Kategori' },
    motif_id: { type: 'uuid', required: true, label: 'Motif' },
    rak_id: { type: 'uuid', required: true, label: 'Rak' },
    jenis_pewarna: {
      type: 'enum',
      required: true,
      values: ['sintetis', 'alami'],
      label: 'Jenis pewarna',
    },
    // gambar_url optional - bisa diisi setelah upload ke Supabase Storage
    gambar_url: { type: 'string', maxLength: 500, label: 'Gambar URL' },
  })
  if (errors.length) return errorResponse(errors[0], 400, { errors })

  // Verifikasi semua FK exists
  const [kategoriCheck, motifCheck, rakCheck] = await Promise.all([
    supabaseAdmin.from('kategori').select('id').eq('id', body.kategori_id).maybeSingle(),
    supabaseAdmin.from('motif').select('id').eq('id', body.motif_id).maybeSingle(),
    supabaseAdmin.from('rak').select('id').eq('id', body.rak_id).maybeSingle(),
  ])

  if (!kategoriCheck.data) return notFoundResponse('Kategori tidak ditemukan')
  if (!motifCheck.data) return notFoundResponse('Motif tidak ditemukan')
  if (!rakCheck.data) return notFoundResponse('Rak tidak ditemukan')

  // Insert (kode_produk, stok, status, terjual auto-handled by triggers)
  const { data, error } = await supabaseAdmin
    .from('produk')
    .insert({
      gambar_url: body.gambar_url || null,
      kategori_id: body.kategori_id,
      motif_id: body.motif_id,
      rak_id: body.rak_id,
      jenis_pewarna: body.jenis_pewarna,
      // stok = 0 default (akan jadi non-zero begitu gulungan ditambahkan)
    })
    .select(`
      id, gambar_url, kode_produk, jenis_pewarna, stok, status, terjual,
      kategori:kategori_id(nama_kategori),
      motif:motif_id(nama_motif),
      rak:rak_id(nama_rak)
    `)
    .single()

  if (error) {
    if (error.code === '23505') return conflictResponse('Kombinasi produk sudah ada')
    return errorResponse('Gagal menyimpan produk: ' + error.message, 500)
  }

  return successResponse(data, 'Produk berhasil ditambahkan', 201)
})