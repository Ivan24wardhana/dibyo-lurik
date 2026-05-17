// =====================================================
// /api/orders/[id]/struk
// GET - data order lengkap untuk render struk di frontend
//
// Frontend (StrukPage.jsx) handle render + window.print().
// Backend hanya return JSON data lengkap order + items + produk.
//
// Toko thermal printer = lebih cepat & murah pakai print
// browser native daripada generate PDF di backend.
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
  // Next.js 16 - params must be awaited
  const { id } = await params
  if (!isValidUUID(id)) return errorResponse('ID order tidak valid', 400)

  // Fetch order lengkap dengan items + gulungan + produk + master
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      nomor_order,
      tanggal_order,
      metode_pembayaran,
      diskon,
      total_harga,
      created_at,
      kasir:user_id(id, username, nama),
      items:item_order(
        id,
        jumlah_order,
        harga_per_meter,
        subtotal,
        gulungan:gulungan_id(
          id,
          nomor_gulungan,
          lebar,
          produk:produk_id(
            id,
            kode_produk,
            jenis_pewarna,
            motif:motif_id(nama),
            kategori:kategori_id(nama)
          )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return notFoundResponse('Order tidak ditemukan')
  }

  return successResponse(data)
})