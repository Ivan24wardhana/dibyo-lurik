// =====================================================
// /api/produk/[id]/gulungan
// GET - list gulungan untuk produk tertentu
//
// Convenience endpoint: alternatif untuk
//   GET /api/gulungan?produk_id=<id>
// =====================================================

import { withAuth } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/response-helper'
import { isValidUUID } from '@/lib/validation'
import supabaseAdmin from '@/lib/supabase-admin'

export const GET = withAuth(async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID produk tidak valid', 400)

  // Cek produk exists
  const { data: produk } = await supabaseAdmin
    .from('produk')
    .select('id, kode_produk, jenis_pewarna')
    .eq('id', id)
    .maybeSingle()

  if (!produk) return notFoundResponse('Produk tidak ditemukan')

  // Ambil semua gulungan untuk produk ini
  const { data, error } = await supabaseAdmin
    .from('gulungan')
    .select(
      'id, nomor_gulungan, lebar, panjang_total, panjang_sisa, harga_per_meter, is_active, created_at'
    )
    .eq('produk_id', id)
    .order('nomor_gulungan', { ascending: true })

  if (error) return errorResponse('Gagal memuat gulungan: ' + error.message, 500)

  return successResponse({
    produk: {
      id: produk.id,
      kode_produk: produk.kode_produk,
      jenis_pewarna: produk.jenis_pewarna,
    },
    items: data || [],
    total: data?.length || 0,
  })
})