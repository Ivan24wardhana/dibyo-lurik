// =====================================================
// /api/daftar-harga/[id]
// GET    - detail (semua role)
// PATCH  - update harga_per_meter saja (kepala_produksi/owner)
// DELETE - hapus harga (kepala_produksi/owner)
//
// Catatan PATCH:
// - Hanya field harga_per_meter yang bisa di-update.
// - Field jenis_pewarna, motif_id, lebar TIDAK BOLEH di-update karena
//   merupakan composite key. Kalau mau ubah, hapus row lama lalu buat
//   row baru. Ini mencegah inkonsistensi data lookup harga.
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/response-helper'
import { PRODUCTION_ROLES } from '@/lib/role-helper'
import { validate, safeParseBody, isValidUUID } from '@/lib/validation'
import supabaseAdmin from '@/lib/supabase-admin'

// =====================================================
// GET - detail
// =====================================================
export const GET = withAuth(async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const { data, error } = await supabaseAdmin
    .from('daftar_harga')
    .select(`
      *,
      motif:motif_id(id, nama_motif)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return notFoundResponse('Daftar harga tidak ditemukan')
  return successResponse(data)
})

// =====================================================
// PATCH - update harga_per_meter
// =====================================================
export const PATCH = withAuthAndRole(
  PRODUCTION_ROLES,
  async ({ request, params }) => {
    const { id } = params
    if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

    const body = await safeParseBody(request)
    if (!body) return errorResponse('Body request tidak valid', 400)

    const errors = validate(body, {
      harga_per_meter: {
        type: 'number',
        min: 0,
        label: 'Harga per meter',
      },
    })
    if (errors.length) return errorResponse(errors[0], 400, { errors })

    if (body.harga_per_meter === undefined) {
      return errorResponse('Tidak ada field yang diupdate', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('daftar_harga')
      .update({
        harga_per_meter: body.harga_per_meter,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`*, motif:motif_id(nama_motif)`)
      .single()

    if (error) return errorResponse('Gagal update: ' + error.message, 500)
    if (!data) return notFoundResponse('Daftar harga tidak ditemukan')

    return successResponse(data, 'Harga berhasil diperbarui')
  }
)

// =====================================================
// DELETE
// =====================================================
export const DELETE = withAuthAndRole(PRODUCTION_ROLES, async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  // Tidak ada FK ke daftar_harga (hanya dipakai sebagai lookup function),
  // jadi langsung delete aman.
  const { error, count } = await supabaseAdmin
    .from('daftar_harga')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return errorResponse('Gagal menghapus: ' + error.message, 500)
  if (!count) return notFoundResponse('Daftar harga tidak ditemukan')

  return successResponse(null, 'Daftar harga berhasil dihapus')
})