// =====================================================
// /api/motif
// GET  - list motif (semua role)
// POST - tambah motif (kepala_produksi/owner)
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
    supabaseAdmin.from('motif').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('motif')
      .select('id, nama_motif, created_at, updated_at')
      .order('nama_motif', { ascending: true })
      .range(pagination.offset, pagination.offset + pagination.limit - 1),
  ])

  if (dataResult.error) return errorResponse('Gagal memuat data motif', 500)

  return successResponse(
    buildPaginatedData(dataResult.data || [], countResult.count || 0, pagination)
  )
})

export const POST = withAuthAndRole(PRODUCTION_ROLES, async ({ request }) => {
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

  const namaMotif = body.nama_motif.trim()

  const { data: existing } = await supabaseAdmin
    .from('motif')
    .select('id')
    .ilike('nama_motif', namaMotif)
    .maybeSingle()

  if (existing) return conflictResponse('Nama motif sudah ada')

  const { data, error } = await supabaseAdmin
    .from('motif')
    .insert({ nama_motif: namaMotif })
    .select()
    .single()

  if (error) return errorResponse('Gagal menyimpan motif: ' + error.message, 500)

  return successResponse(data, 'Motif berhasil ditambahkan', 201)
})