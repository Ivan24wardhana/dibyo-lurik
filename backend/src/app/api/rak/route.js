// =====================================================
// /api/rak
// GET  - list rak (semua role)
// POST - tambah rak (kepala_produksi/owner)
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  conflictResponse,
} from '@/lib/response-helper'
import { PRODUCTION_ROLES } from '@/lib/role-helper'
import { validate, safeParseBody } from '@/lib/validation'
import { parsePagination, buildPaginatedData } from '@/lib/crud-helper'
import supabaseAdmin from '@/lib/supabase-admin'

export const GET = withAuth(async ({ request }) => {
  const pagination = parsePagination(request)

  const [countResult, dataResult] = await Promise.all([
    supabaseAdmin.from('rak').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('rak')
      .select('id, nama_rak, created_at, updated_at')
      .order('nama_rak', { ascending: true })
      .range(pagination.offset, pagination.offset + pagination.limit - 1),
  ])

  if (dataResult.error) return errorResponse('Gagal memuat data rak', 500)

  return successResponse(
    buildPaginatedData(dataResult.data || [], countResult.count || 0, pagination)
  )
})

export const POST = withAuthAndRole(PRODUCTION_ROLES, async ({ request }) => {
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

  const namaRak = body.nama_rak.trim()

  const { data: existing } = await supabaseAdmin
    .from('rak')
    .select('id')
    .ilike('nama_rak', namaRak)
    .maybeSingle()

  if (existing) return conflictResponse('Nama rak sudah ada')

  const { data, error } = await supabaseAdmin
    .from('rak')
    .insert({ nama_rak: namaRak })
    .select()
    .single()

  if (error) return errorResponse('Gagal menyimpan rak: ' + error.message, 500)

  return successResponse(data, 'Rak berhasil ditambahkan', 201)
})