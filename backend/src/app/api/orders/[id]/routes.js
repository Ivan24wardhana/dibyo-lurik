// =====================================================
// /api/orders/[id]
// GET - detail order + items lengkap
//
// Order tidak boleh diedit/dihapus setelah dibuat (audit trail).
// Untuk koreksi, buat order baru dengan total negatif (refund pattern).
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
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      kasir:user_id(id, username, nama),
      items:item_order(
        id, jumlah_order, harga_per_meter, subtotal, created_at,
        gulungan:gulungan_id(
          id, nomor_gulungan, lebar, panjang_total, panjang_sisa,
          produk:produk_id(
            id, kode_produk, gambar_url, jenis_pewarna,
            motif:motif_id(nama_motif),
            kategori:kategori_id(nama_kategori),
            rak:rak_id(nama_rak)
          )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return notFoundResponse('Order tidak ditemukan')

  return successResponse(data)
})