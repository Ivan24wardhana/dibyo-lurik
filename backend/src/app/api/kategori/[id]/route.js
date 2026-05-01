// =====================================================
// /api/kategori/[id]
// GET    - detail kategori (semua role)
// PATCH  - update nama_kategori (kepala_produksi/owner)
// DELETE - hapus jika tidak dipakai di produk
//
// Catatan: di schema v6, daftar_harga tidak FK ke kategori lagi
// (struktur baru pakai jenis_pewarna + motif_id + lebar).
// Jadi FK reference cukup ke tabel produk saja.
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

const KATEGORI_FK_REFERENCES = [
  { table: 'produk', column: 'kategori_id' },
]

// =====================================================
// GET - detail
// =====================================================
export const GET = withAuth(async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const { data, error } = await supabaseAdmin
    .from('kategori')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return notFoundResponse('Kategori tidak ditemukan')

  return successResponse(data)
})

// =====================================================
// PATCH - update
// =====================================================
export const PATCH = withAuthAndRole(PRODUCTION_ROLES, async ({ request, params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body request tidak valid', 400)

  const errors = validate(body, {
    nama_kategori: {
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 255,
      label: 'Nama kategori',
    },
  })
  if (errors.length) return errorResponse(errors[0], 400, { errors })

  const namaBaru = body.nama_kategori.trim()

  // Cek duplikat (selain dirinya sendiri)
  const { data: duplicate } = await supabaseAdmin
    .from('kategori')
    .select('id')
    .ilike('nama_kategori', namaBaru)
    .neq('id', id)
    .maybeSingle()

  if (duplicate) return conflictResponse('Nama kategori sudah dipakai')

  const { data, error } = await supabaseAdmin
    .from('kategori')
    .update({
      nama_kategori: namaBaru,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return errorResponse('Gagal update: ' + error.message, 500)
  if (!data) return notFoundResponse('Kategori tidak ditemukan')

  return successResponse(data, 'Kategori berhasil diperbarui')
})

// =====================================================
// DELETE - dengan FK check
// =====================================================
export const DELETE = withAuthAndRole(PRODUCTION_ROLES, async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const fkCheck = await checkFKReferences(id, KATEGORI_FK_REFERENCES)
  if (fkCheck.used) {
    return conflictResponse(formatFKErrorMessage(fkCheck.usedIn))
  }

  const { error, count } = await supabaseAdmin
    .from('kategori')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return errorResponse('Gagal menghapus: ' + error.message, 500)
  if (!count) return notFoundResponse('Kategori tidak ditemukan')

  return successResponse(null, 'Kategori berhasil dihapus')
})