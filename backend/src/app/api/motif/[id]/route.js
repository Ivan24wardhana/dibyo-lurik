// =====================================================
// /api/motif/[id]
// GET    - detail motif (semua role)
// PATCH  - update nama_motif (kepala_produksi/owner)
// DELETE - hapus jika tidak dipakai di produk atau daftar_harga
//
// Catatan FK: motif dipakai di 2 tempat:
//   1. produk.motif_id (NOT NULL)
//   2. daftar_harga.motif_id (NULLABLE - untuk exception harga)
// Jadi check ke kedua tabel sebelum hapus.
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

const MOTIF_FK_REFERENCES = [
  { table: 'produk', column: 'motif_id' },
  { table: 'daftar_harga', column: 'motif_id' },
  { table: 'item_pre_order_reguler', column: 'produk_id' }, // tidak langsung tapi via produk
]

// Note: item_pre_order_reguler ke motif itu indirect (via produk), tapi
// karena kita pakai ON DELETE RESTRICT di produk.motif_id, kalau motif
// dipakai produk yang dipakai PO, tetap akan ditolak. Jadi cukup cek
// produk + daftar_harga.
const MOTIF_FK_REFERENCES_DIRECT = [
  { table: 'produk', column: 'motif_id' },
  { table: 'daftar_harga', column: 'motif_id' },
]

export const GET = withAuth(async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const { data, error } = await supabaseAdmin
    .from('motif')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return notFoundResponse('Motif tidak ditemukan')
  return successResponse(data)
})

export const PATCH = withAuthAndRole(PRODUCTION_ROLES, async ({ request, params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body request tidak valid', 400)

  const errors = validate(body, {
    nama_motif: {
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 255,
      label: 'Nama motif',
    },
  })
  if (errors.length) return errorResponse(errors[0], 400, { errors })

  const namaBaru = body.nama_motif.trim()

  const { data: duplicate } = await supabaseAdmin
    .from('motif')
    .select('id')
    .ilike('nama_motif', namaBaru)
    .neq('id', id)
    .maybeSingle()

  if (duplicate) return conflictResponse('Nama motif sudah dipakai')

  const { data, error } = await supabaseAdmin
    .from('motif')
    .update({
      nama_motif: namaBaru,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return errorResponse('Gagal update: ' + error.message, 500)
  if (!data) return notFoundResponse('Motif tidak ditemukan')

  return successResponse(data, 'Motif berhasil diperbarui')
})

export const DELETE = withAuthAndRole(PRODUCTION_ROLES, async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const fkCheck = await checkFKReferences(id, MOTIF_FK_REFERENCES_DIRECT)
  if (fkCheck.used) return conflictResponse(formatFKErrorMessage(fkCheck.usedIn))

  const { error, count } = await supabaseAdmin
    .from('motif')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return errorResponse('Gagal menghapus: ' + error.message, 500)
  if (!count) return notFoundResponse('Motif tidak ditemukan')

  return successResponse(null, 'Motif berhasil dihapus')
})