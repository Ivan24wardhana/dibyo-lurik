// =====================================================
// /api/rekap-gulungan
// GET - rekap stok gulungan, biasanya difilter by lebar (70 atau 110)
//
// Pakai VIEW v_rekap_gulungan dari schema (sudah agregasi).
// Kalau view tidak ada, fallback ke query manual.
//
// Query params:
//   ?lebar=70|110  → filter lebar
//   ?status=tersedia|sold  → filter status
//   ?page=1&limit=20  → pagination
// =====================================================

import { withAuth } from '@/lib/api-helper'
import { successResponse, errorResponse } from '@/lib/response-helper'
import {
  parsePagination,
  parseQueryParam,
  buildPaginatedData,
} from '@/lib/crud-helper'
import supabaseAdmin from '@/lib/supabase-admin'

export const GET = withAuth(async ({ request }) => {
  const pagination = parsePagination(request)
  const filterLebar = parseQueryParam(request, 'lebar')
  const filterStatus = parseQueryParam(request, 'status')

  // Coba pakai view dulu
  let query = supabaseAdmin
    .from('v_rekap_gulungan')
    .select('*', { count: 'exact' })

  if (filterLebar) query = query.eq('lebar', parseInt(filterLebar))
  if (filterStatus) query = query.eq('status', filterStatus)

  const { data, count, error } = await query
    .order('kode_gulungan', { ascending: true })
    .range(pagination.offset, pagination.offset + pagination.limit - 1)

  // Kalau view tidak ada / error, fallback ke query gulungan langsung
  if (error) {
    console.warn('[rekap-gulungan] view error, fallback to manual query:', error.message)

    let fallbackQuery = supabaseAdmin
      .from('gulungan')
      .select(
        `
          id,
          kode_gulungan,
          lebar,
          panjang_awal,
          panjang_sisa,
          status,
          produk:produk_id(kode_produk, motif:motif_id(nama_motif), kategori:kategori_id(nama_kategori)),
          rak:rak_id(nama_rak)
        `,
        { count: 'exact' }
      )

    if (filterLebar) fallbackQuery = fallbackQuery.eq('lebar', parseInt(filterLebar))
    if (filterStatus) fallbackQuery = fallbackQuery.eq('status', filterStatus)

    const fallbackResult = await fallbackQuery
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1)

    if (fallbackResult.error) {
      return errorResponse('Gagal memuat rekap: ' + fallbackResult.error.message, 500)
    }

    return successResponse(
      buildPaginatedData(
        fallbackResult.data || [],
        fallbackResult.count || 0,
        pagination
      )
    )
  }

  return successResponse(buildPaginatedData(data || [], count || 0, pagination))
})