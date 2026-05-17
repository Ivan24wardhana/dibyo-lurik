// /api/rak — GET list + POST create
// Nama rak selalu disimpan UPPERCASE (A, B, C, dll)

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  conflictResponse,
} from '@/lib/response-helper'
import { safeParseBody } from '@/lib/validation'
import {
  parsePagination,
  parseSearch,
  buildPaginatedData,
} from '@/lib/crud-helper'
import { PRODUCTION_ROLES } from '@/lib/role-helper'
import supabaseAdmin from '@/lib/supabase-admin'

export const GET = withAuth(async ({ request }) => {
  const pagination = parsePagination(request)
  const search = parseSearch(request)

  let query = supabaseAdmin
    .from('rak')
    .select('id, nama, created_at', { count: 'exact' })
    .order('nama', { ascending: true })

  if (search) query = query.ilike('nama', `%${search}%`)

  const { data, count, error } = await query.range(
    pagination.offset,
    pagination.offset + pagination.limit - 1
  )

  if (error) return errorResponse('Gagal memuat rak: ' + error.message, 500)

  return successResponse(buildPaginatedData(data || [], count || 0, pagination))
})

export const POST = withAuthAndRole(PRODUCTION_ROLES, async ({ request }) => {
  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body harus JSON valid', 400)

  const nama = body.nama?.toString().trim().toUpperCase()  // ← selalu UPPERCASE
  if (!nama) return errorResponse('Nama rak wajib diisi', 400)
  if (nama.length > 100) return errorResponse('Nama terlalu panjang (maks 100 karakter)', 400)

  const { data, error } = await supabaseAdmin
    .from('rak')
    .insert({ nama })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return conflictResponse('Nama rak sudah ada')
    return errorResponse('Gagal membuat rak: ' + error.message, 500)
  }

  return successResponse(data, 'Rak berhasil dibuat', 201)
})