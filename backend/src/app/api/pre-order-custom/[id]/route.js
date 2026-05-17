// /api/pre-order-custom/[id]
// GET   — detail POC lengkap (semua role)
// PATCH — update field umum (CS only)
// DELETE — hapus POC (CS only)
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
// GET - detail POC dengan items custom specs
// =====================================================
export const GET = withAuth(async ({ params }) => {
  const { id } = await params
  if (!id) return errorResponse('ID wajib diisi', 400)

  const { data, error } = await supabaseAdmin
    .from('pre_order_custom')
    .select(`
      id, nama_customer, no_telpon, alamat,
      tanggal_po, tanggal_estimasi,
      status_produksi, status_pembayaran,
      nominal_dp, diskon, total_harga, metode_pembayaran,
      created_at, updated_at,
      item_pre_order_custom(
        id, motif, lebar, warna, jumlah,
        panjang_kain, harga_per_meter, keterangan
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return notFoundResponse('Pre-order custom tidak ditemukan')

  return successResponse(data)
})

// =====================================================
// PATCH - update field umum POC (CS only)
// =====================================================
export const PATCH = withAuth(async ({ request, params, profile }) => {
  const { id } = await params
  if (!id) return errorResponse('ID wajib diisi', 400)

  if (profile?.role !== 'customer_service') {
    return forbiddenResponse('Hanya Customer Service yang bisa edit pre-order')
  }

  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body harus JSON valid', 400)

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
    .from('pre_order_custom')
    .update(updateData)
    .eq('id', id)
    .select('id, nama_customer, status_produksi, status_pembayaran')
    .single()

  if (error) return errorResponse('Gagal update: ' + error.message, 500)
  if (!data) return notFoundResponse('Pre-order custom tidak ditemukan')

  return successResponse(data, 'Pre-order custom berhasil diupdate')
})

// =====================================================
// DELETE - hapus POC (CS only)
// =====================================================
export const DELETE = withAuth(async ({ params, profile }) => {
  const { id } = await params
  if (!id) return errorResponse('ID wajib diisi', 400)

  if (profile?.role !== 'customer_service') {
    return forbiddenResponse('Hanya Customer Service yang bisa hapus pre-order')
  }

  const { error } = await supabaseAdmin
    .from('pre_order_custom')
    .delete()
    .eq('id', id)

  if (error) return errorResponse('Gagal hapus: ' + error.message, 500)

  return successResponse(null, 'Pre-order custom berhasil dihapus')
})