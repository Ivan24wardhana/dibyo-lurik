// /api/daftar-harga/[id]  — PATCH + DELETE

import { withAuthAndRole } from '@/lib/api-helper'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/response-helper'
import { safeParseBody } from '@/lib/validation'
import { PRODUCTION_ROLES } from '@/lib/role-helper'
import supabaseAdmin from '@/lib/supabase-admin'

export const PATCH = withAuthAndRole(PRODUCTION_ROLES, async ({ request, params }) => {
  const { id } = await params
  if (!id) return errorResponse('ID wajib diisi', 400)

  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body harus JSON valid', 400)

  const harga = parseFloat(body.harga_per_meter)
  if (body.harga_per_meter === undefined || isNaN(harga) || harga < 0) {
    return errorResponse('Harga per meter tidak valid', 400)
  }

  const { data, error } = await supabaseAdmin
    .from('daftar_harga')
    .update({ harga_per_meter: harga })
    .eq('id', id)
    .select('id, jenis_pewarna, lebar, harga_per_meter, motif:motif_id(id, nama)')
    .single()

  if (error) return errorResponse('Gagal update: ' + error.message, 500)
  if (!data) return notFoundResponse('Harga tidak ditemukan')

  return successResponse(data, 'Harga berhasil diupdate')
})

export const DELETE = withAuthAndRole(PRODUCTION_ROLES, async ({ params }) => {
  const { id } = await params
  if (!id) return errorResponse('ID wajib diisi', 400)

  const { error } = await supabaseAdmin.from('daftar_harga').delete().eq('id', id)
  if (error) return errorResponse('Gagal hapus: ' + error.message, 500)

  return successResponse(null, 'Harga berhasil dihapus')
})