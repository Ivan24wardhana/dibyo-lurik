// /api/rak/[id]  — PATCH + DELETE
// Nama rak selalu disimpan UPPERCASE

import { withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  conflictResponse,
} from '@/lib/response-helper'
import { safeParseBody } from '@/lib/validation'
import { checkFKReferences, formatFKErrorMessage } from '@/lib/crud-helper'
import { PRODUCTION_ROLES } from '@/lib/role-helper'
import supabaseAdmin from '@/lib/supabase-admin'

export const PATCH = withAuthAndRole(PRODUCTION_ROLES, async ({ request, params }) => {
  const { id } = await params
  if (!id) return errorResponse('ID wajib diisi', 400)

  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body harus JSON valid', 400)

  const nama = body.nama?.toString().trim().toUpperCase()  // ← selalu UPPERCASE
  if (!nama) return errorResponse('Nama rak wajib diisi', 400)
  if (nama.length > 100) return errorResponse('Nama terlalu panjang', 400)

  const { data, error } = await supabaseAdmin
    .from('rak')
    .update({ nama })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return conflictResponse('Nama rak sudah ada')
    return errorResponse('Gagal update: ' + error.message, 500)
  }
  if (!data) return notFoundResponse('Rak tidak ditemukan')

  return successResponse(data, 'Rak berhasil diupdate')
})

export const DELETE = withAuthAndRole(PRODUCTION_ROLES, async ({ params }) => {
  const { id } = await params
  if (!id) return errorResponse('ID wajib diisi', 400)

  const fkResult = await checkFKReferences(id, [
    { table: 'produk', column: 'rak_id', label: 'produk' },
  ])
  if (fkResult.used) return conflictResponse(formatFKErrorMessage(fkResult.usedIn))

  const { error } = await supabaseAdmin.from('rak').delete().eq('id', id)
  if (error) return errorResponse('Gagal hapus: ' + error.message, 500)

  return successResponse(null, 'Rak berhasil dihapus')
})