// =====================================================
// /api/produk
// GET  - list produk dengan pagination, search, filter
// POST - create produk baru (Kepala Produksi only)
//
// Helper convention proyek:
//   - validate() return ARRAY error → errors.length > 0
//   - parseSearch() pakai param '?q=' (bukan ?search=)
//   - buildPaginatedData() return shape:
//       { items, pagination: { page, limit, total, total_pages } }
//
// Schema v6: kategori.nama, motif.nama, rak.nama
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  conflictResponse,
} from '@/lib/response-helper'
import { validate, safeParseBody } from '@/lib/validation'
import {
  parsePagination,
  parseSearch,
  parseQueryParam,
  buildPaginatedData,
} from '@/lib/crud-helper'
import { PRODUCTION_ROLES } from '@/lib/role-helper'
import supabaseAdmin from '@/lib/supabase-admin'

// =====================================================
// GET - List produk
// Query params:
//   ?page=1&limit=12         - pagination (default 20, max 100)
//   ?q=AKLBL                 - search by kode_produk
//   ?status=ready|sold       - filter
//   ?kategori_id=<uuid>
//   ?motif_id=<uuid>
//   ?rak_id=<uuid>
//   ?jenis_pewarna=sintetis|alami
// =====================================================
export const GET = withAuth(async ({ request }) => {
  const pagination = parsePagination(request)
  const search = parseSearch(request)
  const filterStatus = parseQueryParam(request, 'status')
  const filterKategori = parseQueryParam(request, 'kategori_id')
  const filterMotif = parseQueryParam(request, 'motif_id')
  const filterRak = parseQueryParam(request, 'rak_id')
  const filterPewarna = parseQueryParam(request, 'jenis_pewarna')

  // Build query dengan join kategori, motif, rak (field v6: nama)
  let query = supabaseAdmin
    .from('produk')
    .select(
      `
        id,
        gambar_url,
        kode_produk,
        jenis_pewarna,
        stok,
        status,
        terjual,
        tanggal_ditambahkan,
        created_at,
        updated_at,
        kategori:kategori_id(id, nama),
        motif:motif_id(id, nama),
        rak:rak_id(id, nama)
      `,
      { count: 'exact' }
    )

  // Search by kode_produk
  if (search) {
    query = query.ilike('kode_produk', `%${search}%`)
  }

  // Filters
  if (filterStatus) query = query.eq('status', filterStatus)
  if (filterKategori) query = query.eq('kategori_id', filterKategori)
  if (filterMotif) query = query.eq('motif_id', filterMotif)
  if (filterRak) query = query.eq('rak_id', filterRak)
  if (filterPewarna) query = query.eq('jenis_pewarna', filterPewarna)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(pagination.offset, pagination.offset + pagination.limit - 1)

  if (error) {
    console.error('[produk GET] error:', error)
    return errorResponse('Gagal memuat produk: ' + error.message, 500)
  }

  return successResponse(
    buildPaginatedData(data || [], count || 0, pagination)
  )
})

// =====================================================
// POST - Create produk baru
// Body:
//   {
//     motif_id: uuid (required),
//     kategori_id: uuid (required),
//     rak_id: uuid (required),
//     jenis_pewarna: 'sintetis'|'alami' (required),
//     gambar_url?: string (optional, URL atau base64)
//   }
// kode_produk auto-generate via trigger DB
// stok, terjual, status di-default 0/'ready'
// =====================================================
export const POST = withAuthAndRole(PRODUCTION_ROLES, async ({ request }) => {
  const body = await safeParseBody(request)
  if (!body) {
    return errorResponse('Body request harus JSON valid', 400)
  }

  // Validasi pakai helper validate() - return ARRAY error
  const errors = validate(body, {
    motif_id: { type: 'uuid', required: true, label: 'Motif' },
    kategori_id: { type: 'uuid', required: true, label: 'Kategori' },
    rak_id: { type: 'uuid', required: true, label: 'Rak' },
    jenis_pewarna: {
      type: 'enum',
      required: true,
      values: ['sintetis', 'alami'],
      label: 'Jenis pewarna',
    },
  })

  if (errors.length > 0) {
    return errorResponse('Data tidak valid', 400, { errors })
  }

  // Insert produk - kode_produk auto-generate via trigger
  const insertData = {
    motif_id: body.motif_id,
    kategori_id: body.kategori_id,
    rak_id: body.rak_id,
    jenis_pewarna: body.jenis_pewarna,
    gambar_url: body.gambar_url || null,
  }

  const { data, error } = await supabaseAdmin
    .from('produk')
    .insert(insertData)
    .select(
      `
        id,
        gambar_url,
        kode_produk,
        jenis_pewarna,
        stok,
        status,
        kategori:kategori_id(id, nama),
        motif:motif_id(id, nama),
        rak:rak_id(id, nama)
      `
    )
    .single()

  if (error) {
    console.error('[produk POST] error:', error)
    // FK constraint - kategori/motif/rak tidak ditemukan
    if (error.code === '23503') {
      return errorResponse(
        'Kategori, motif, atau rak tidak ditemukan. Pastikan data sudah ada.',
        400
      )
    }
    // Unique constraint - kode_produk duplikat (jarang terjadi karena auto)
    if (error.code === '23505') {
      return conflictResponse('Kode produk sudah ada, silakan coba lagi')
    }
    return errorResponse('Gagal membuat produk: ' + error.message, 500)
  }

  return successResponse(data, 'Produk berhasil dibuat', 201)
})