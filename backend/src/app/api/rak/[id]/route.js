// =====================================================
// /api/rak/[id]
// GET    - detail rak (semua role)
// PATCH  - update nama_rak (kepala_produksi/owner)
// DELETE - hapus jika tidak dipakai produk
//
// Catatan: di schema v6, gulungan TIDAK punya FK rak_id (rak ada di produk).
// Jadi FK reference cukup ke produk saja.
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

const RAK_FK_REFERENCES = [
  { table: 'produk', column: 'rak_id' },
]

export const GET = withAuth(async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const { data, error } = await supabaseAdmin
    .from('rak')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return notFoundResponse('Rak tidak ditemukan')
  return successResponse(data)
})

export const PATCH = withAuthAndRole(PRODUCTION_ROLES, async ({ request, params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body request tidak valid', 400)

  const errors = validate(body, {
    nama_rak: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 100,
      label: 'Nama rak',
    },
  })
  if (errors.length) return errorResponse(errors[0], 400, { errors })

  const namaBaru = body.nama_rak.trim()

  const { data: duplicate } = await supabaseAdmin
    .from('rak')
    .select('id')
    .ilike('nama_rak', namaBaru)
    .neq('id', id)
    .maybeSingle()

  if (duplicate) return conflictResponse('Nama rak sudah dipakai')

  const { data, error } = await supabaseAdmin
    .from('rak')
    .update({
      nama_rak: namaBaru,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return errorResponse('Gagal update: ' + error.message, 500)
  if (!data) return notFoundResponse('Rak tidak ditemukan')

  return successResponse(data, 'Rak berhasil diperbarui')
})

export const DELETE = withAuthAndRole(PRODUCTION_ROLES, async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const fkCheck = await checkFKReferences(id, RAK_FK_REFERENCES)
  if (fkCheck.used) return conflictResponse(formatFKErrorMessage(fkCheck.usedIn))

  const { error, count } = await supabaseAdmin
    .from('rak')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return errorResponse('Gagal menghapus: ' + error.message, 500)
  if (!count) return notFoundResponse('Rak tidak ditemukan')

  return successResponse(null, 'Rak berhasil dihapus')
})