// =====================================================
// /api/pre-order-custom/[id]
// GET    - detail PO custom (semua role)
// PATCH  - update field-field PO custom (kepala_produksi/owner)
// DELETE - hapus PO custom
//
// Catatan: PATCH tidak bisa ubah status & status_pembayaran
// (pakai action endpoint /start-produksi, /finish-produksi, /mark-paid).
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/response-helper'
import { PRE_ORDER_UPDATE_ROLES } from '@/lib/role-helper'
import { validate, safeParseBody, isValidUUID } from '@/lib/validation'
import supabaseAdmin from '@/lib/supabase-admin'

export const GET = withAuth(async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const { data, error } = await supabaseAdmin
    .from('pre_order_custom')
    .select(`
      *,
      created_by_profile:created_by(id, username, nama, role)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return notFoundResponse('Pre-order custom tidak ditemukan')

  return successResponse(data)
})

export const PATCH = withAuthAndRole(
  PRE_ORDER_UPDATE_ROLES,
  async ({ request, params }) => {
    const { id } = params
    if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

    const body = await safeParseBody(request)
    if (!body) return errorResponse('Body request tidak valid', 400)

    const errors = validate(body, {
      nama_customer: { type: 'string', minLength: 2, maxLength: 255, label: 'Nama customer' },
      kontak_customer: { type: 'string', maxLength: 20, label: 'Kontak' },
      alamat_customer: { type: 'string', label: 'Alamat' },
      gambar_custom: { type: 'string', maxLength: 500, label: 'Gambar custom URL' },
      metode_pembayaran: {
        type: 'enum',
        values: ['cash', 'transfer'],
        label: 'Metode pembayaran',
      },
      total_dp: { type: 'number', min: 0, label: 'Total DP' },
      diskon: { type: 'number', min: 0, max: 100, label: 'Diskon' },
      total_harga: { type: 'number', min: 0, label: 'Total harga' },
      catatan: { type: 'string', label: 'Catatan' },
    })
    if (errors.length) return errorResponse(errors[0], 400, { errors })

    const updates = { updated_at: new Date().toISOString() }
    const fields = [
      'nama_customer', 'kontak_customer', 'alamat_customer',
      'gambar_custom', 'tanggal_selesai', 'metode_pembayaran',
      'total_dp', 'diskon', 'total_harga', 'catatan',
    ]
    for (const field of fields) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    if (Object.keys(updates).length === 1) {
      return errorResponse('Tidak ada field yang diupdate', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('pre_order_custom')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return errorResponse('Gagal update: ' + error.message, 500)
    if (!data) return notFoundResponse('Pre-order custom tidak ditemukan')

    return successResponse(data, 'Pre-order custom berhasil diperbarui')
  }
)

export const DELETE = withAuthAndRole(PRE_ORDER_UPDATE_ROLES, async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const { error, count } = await supabaseAdmin
    .from('pre_order_custom')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return errorResponse('Gagal menghapus: ' + error.message, 500)
  if (!count) return notFoundResponse('Pre-order custom tidak ditemukan')

  return successResponse(null, 'Pre-order custom berhasil dihapus')
})