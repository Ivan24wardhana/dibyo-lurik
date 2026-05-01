// =====================================================
// /api/gulungan/[id]
// GET    - detail gulungan
// PATCH  - update (lebar, panjang_total, panjang_sisa, harga_per_meter, is_active)
// DELETE - hapus jika tidak dipakai item_order
//
// Schema v6: gulungan tidak punya rak_id (rak ada di produk).
// Field is_active boolean (bukan status enum).
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  conflictResponse,
} from '@/lib/response-helper'
import { PRODUCTION_ROLES } from '@/lib/role-helper'
import { validate, safeParseBody, isValidUUID } from '@/lib/validation'
import { checkFKReferences, formatFKErrorMessage } from '@/lib/crud-helper'
import supabaseAdmin from '@/lib/supabase-admin'

const GULUNGAN_FK_REFERENCES = [
  { table: 'item_order', column: 'gulungan_id' },
]

// =====================================================
// GET - detail gulungan
// =====================================================
export const GET = withAuth(async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const { data, error } = await supabaseAdmin
    .from('gulungan')
    .select(`
      *,
      produk:produk_id(
        id,
        kode_produk,
        gambar_url,
        jenis_pewarna,
        motif:motif_id(id, nama_motif),
        kategori:kategori_id(id, nama_kategori),
        rak:rak_id(id, nama_rak)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return notFoundResponse('Gulungan tidak ditemukan')
  return successResponse(data)
})

// =====================================================
// PATCH - update gulungan
// =====================================================
export const PATCH = withAuthAndRole(PRODUCTION_ROLES, async ({ request, params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body request tidak valid', 400)

  const errors = validate(body, {
    lebar: { type: 'enum', values: [70, 110], label: 'Lebar' },
    panjang_total: { type: 'number', min: 0.1, label: 'Panjang total' },
    panjang_sisa: { type: 'number', min: 0, label: 'Panjang sisa' },
    harga_per_meter: { type: 'number', min: 0, label: 'Harga per meter' },
    is_active: { type: 'boolean', label: 'Status aktif' },
  })
  if (errors.length) return errorResponse(errors[0], 400, { errors })

  const updates = { updated_at: new Date().toISOString() }
  if (body.lebar !== undefined) updates.lebar = body.lebar
  if (body.panjang_total !== undefined) updates.panjang_total = body.panjang_total
  if (body.panjang_sisa !== undefined) updates.panjang_sisa = body.panjang_sisa
  if (body.harga_per_meter !== undefined) updates.harga_per_meter = body.harga_per_meter
  if (body.is_active !== undefined) updates.is_active = body.is_active

  // Auto: kalau panjang_sisa = 0, set is_active = false
  if (updates.panjang_sisa === 0 && updates.is_active === undefined) {
    updates.is_active = false
  }

  const { data, error } = await supabaseAdmin
    .from('gulungan')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      produk:produk_id(kode_produk, jenis_pewarna)
    `)
    .single()

  if (error) return errorResponse('Gagal update: ' + error.message, 500)
  if (!data) return notFoundResponse('Gulungan tidak ditemukan')

  return successResponse(data, 'Gulungan berhasil diperbarui')
})

// =====================================================
// DELETE - dengan FK check
// =====================================================
export const DELETE = withAuthAndRole(PRODUCTION_ROLES, async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const fkCheck = await checkFKReferences(id, GULUNGAN_FK_REFERENCES)
  if (fkCheck.used) return conflictResponse(formatFKErrorMessage(fkCheck.usedIn))

  const { error, count } = await supabaseAdmin
    .from('gulungan')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return errorResponse('Gagal menghapus: ' + error.message, 500)
  if (!count) return notFoundResponse('Gulungan tidak ditemukan')

  return successResponse(null, 'Gulungan berhasil dihapus')
})