// /api/pre-order-reguler/[id]
// GET   — detail POR lengkap (semua role)
// PATCH — update field umum seperti nama, alamat, estimasi (CS only)
// DELETE — hapus POR (CS only)
//
// Note: update STATUS pakai dedicated endpoints:
//   POST /[id]/start-produksi   → sedang_diproses
//   POST /[id]/finish-produksi  → selesai_diproses
//   POST /[id]/mark-paid        → status_pembayaran lunas

import { withAuth } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
} from '@/lib/response-helper'
import { safeParseBody } from '@/lib/validation'
import supabaseAdmin from '@/lib/supabase-admin'

// =====================================================
// GET - detail POR dengan items + produk info
// =====================================================
export const GET = withAuth(async ({ params }) => {
  const { id } = await params
  if (!id) return errorResponse('ID wajib diisi', 400)

  const { data, error } = await supabaseAdmin
    .from('pre_order_reguler')
    .select(`
      id, nama_customer, no_telpon, alamat,
      tanggal_po, tanggal_estimasi,
      status_produksi, status_pembayaran,
      nominal_dp, diskon, total_harga, metode_pembayaran,
      created_at, updated_at,
      item_pre_order_reguler(
        id, lebar, jumlah, panjang_kain, harga_per_meter,
        produk:produk_id(
          id, kode_produk, gambar_url,
          kategori:kategori_id(nama),
          motif:motif_id(nama)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return notFoundResponse('Pre-order tidak ditemukan')

  return successResponse(data)
})

// =====================================================
// PATCH - update field umum POR (CS only)
// Field yang bisa diubah: nama_customer, no_telpon, alamat,
//   tanggal_estimasi, nominal_dp, diskon, metode_pembayaran
// =====================================================
export const PATCH = withAuth(async ({ request, params, profile }) => {
  const { id } = await params
  if (!id) return errorResponse('ID wajib diisi', 400)

  if (profile?.role !== 'customer_service') {
    return forbiddenResponse('Hanya Customer Service yang bisa edit pre-order')
  }

  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body harus JSON valid', 400)

  // Whitelist field yang boleh diupdate
  const allowed = [
    'nama_customer', 'no_telpon', 'alamat',
    'tanggal_estimasi', 'nominal_dp', 'diskon',
    'metode_pembayaran', 'total_harga',
  ]

  const updateData = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updateData[key] = body[key]
  }

  if (Object.keys(updateData).length === 0) {
    return errorResponse('Tidak ada field yang diupdate', 400)
  }

  const { data, error } = await supabaseAdmin
    .from('pre_order_reguler')
    .update(updateData)
    .eq('id', id)
    .select('id, nama_customer, status_produksi, status_pembayaran')
    .single()

  if (error) return errorResponse('Gagal update: ' + error.message, 500)
  if (!data) return notFoundResponse('Pre-order tidak ditemukan')

  return successResponse(data, 'Pre-order berhasil diupdate')
})

// =====================================================
// DELETE - hapus POR (CS only)
// =====================================================
export const DELETE = withAuth(async ({ params, profile }) => {
  const { id } = await params
  if (!id) return errorResponse('ID wajib diisi', 400)

  if (profile?.role !== 'customer_service') {
    return forbiddenResponse('Hanya Customer Service yang bisa hapus pre-order')
  }

  const { error } = await supabaseAdmin
    .from('pre_order_reguler')
    .delete()
    .eq('id', id)

  if (error) return errorResponse('Gagal hapus: ' + error.message, 500)

  return successResponse(null, 'Pre-order berhasil dihapus')
})