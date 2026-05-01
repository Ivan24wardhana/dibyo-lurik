// =====================================================
// /api/pre-order-reguler/[id]
// GET    - detail PO + items (semua role)
// PATCH  - update header (kepala_produksi/owner)
//   Field yang bisa diupdate: nama_customer, kontak, alamat, tanggal_selesai,
//   metode_pembayaran, total_dp, diskon, catatan
//   TIDAK bisa via PATCH: status, status_pembayaran (pakai action endpoint)
// DELETE - hapus PO + cascade items (kepala_produksi/owner)
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/response-helper'
import { PRE_ORDER_UPDATE_ROLES } from '@/lib/role-helper'
import { validate, safeParseBody, isValidUUID } from '@/lib/validation'
import { recalculateTotalPOR } from '@/lib/preorder-helper'
import supabaseAdmin from '@/lib/supabase-admin'

// =====================================================
// GET - detail PO + items
// =====================================================
export const GET = withAuth(async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const { data, error } = await supabaseAdmin
    .from('pre_order_reguler')
    .select(`
      *,
      created_by_profile:created_by(id, username, nama, role),
      items:item_pre_order_reguler(
        id, produk_id, lebar, panjang, jumlah, harga_per_meter, subtotal, created_at,
        produk:produk_id(
          id, kode_produk, gambar_url, jenis_pewarna,
          motif:motif_id(nama_motif),
          kategori:kategori_id(nama_kategori)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return notFoundResponse('Pre-order tidak ditemukan')

  return successResponse(data)
})

// =====================================================
// PATCH - update header
// =====================================================
export const PATCH = withAuthAndRole(
  PRE_ORDER_UPDATE_ROLES,
  async ({ request, params }) => {
    const { id } = params
    if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

    const body = await safeParseBody(request)
    if (!body) return errorResponse('Body request tidak valid', 400)

    // Field yang boleh diupdate (TIDAK termasuk status & status_pembayaran)
    const errors = validate(body, {
      nama_customer: { type: 'string', minLength: 2, maxLength: 255, label: 'Nama customer' },
      kontak_customer: { type: 'string', maxLength: 20, label: 'Kontak' },
      alamat_customer: { type: 'string', label: 'Alamat' },
      metode_pembayaran: {
        type: 'enum',
        values: ['cash', 'transfer'],
        label: 'Metode pembayaran',
      },
      total_dp: { type: 'number', min: 0, label: 'Total DP' },
      diskon: { type: 'number', min: 0, max: 100, label: 'Diskon' },
      catatan: { type: 'string', label: 'Catatan' },
    })
    if (errors.length) return errorResponse(errors[0], 400, { errors })

    const updates = { updated_at: new Date().toISOString() }
    const fields = [
      'nama_customer', 'kontak_customer', 'alamat_customer',
      'tanggal_selesai', 'metode_pembayaran', 'total_dp',
      'diskon', 'catatan',
    ]
    for (const field of fields) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    if (Object.keys(updates).length === 1) {
      return errorResponse('Tidak ada field yang diupdate', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('pre_order_reguler')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return errorResponse('Gagal update: ' + error.message, 500)
    if (!data) return notFoundResponse('Pre-order tidak ditemukan')

    // Kalau diskon berubah, recalculate total
    if (body.diskon !== undefined) {
      await recalculateTotalPOR(id)
    }

    return successResponse(data, 'Pre-order berhasil diperbarui')
  }
)

// =====================================================
// DELETE - cascade ke items (sudah di-handle ON DELETE CASCADE di schema)
// =====================================================
export const DELETE = withAuthAndRole(PRE_ORDER_UPDATE_ROLES, async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const { error, count } = await supabaseAdmin
    .from('pre_order_reguler')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return errorResponse('Gagal menghapus: ' + error.message, 500)
  if (!count) return notFoundResponse('Pre-order tidak ditemukan')

  return successResponse(null, 'Pre-order berhasil dihapus')
})