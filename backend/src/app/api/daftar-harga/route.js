// =====================================================
// /api/daftar-harga
// GET  - list semua daftar harga
// POST - create harga baru
//
// Schema:
//   jenis_pewarna: sintetis | alami (required)
//   motif_id: uuid | null (null = berlaku umum)
//   lebar: 70 | 110 (required)
//   harga_per_meter: number (required)
//
// Unique: 1 kombinasi (jenis_pewarna + motif_id + lebar)
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  conflictResponse,
} from '@/lib/response-helper'
import { validate, safeParseBody } from '@/lib/validation'
import { parsePagination, buildPaginatedData } from '@/lib/crud-helper'
import { PRODUCTION_ROLES } from '@/lib/role-helper'
import supabaseAdmin from '@/lib/supabase-admin'

export const GET = withAuth(async ({ request }) => {
  const pagination = parsePagination(request)

  const { data, count, error } = await supabaseAdmin
    .from('daftar_harga')
    .select(
      `
        id,
        jenis_pewarna,
        lebar,
        harga_per_meter,
        created_at,
        updated_at,
        motif:motif_id(id, nama)
      `,
      { count: 'exact' }
    )
    .order('jenis_pewarna', { ascending: true })
    .order('lebar', { ascending: true })
    .range(pagination.offset, pagination.offset + pagination.limit - 1)

  if (error) {
    return errorResponse('Gagal memuat daftar harga: ' + error.message, 500)
  }

  return successResponse(
    buildPaginatedData(data || [], count || 0, pagination)
  )
})

export const POST = withAuthAndRole(PRODUCTION_ROLES, async ({ request }) => {
  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body harus JSON valid', 400)

  const errors = validate(body, {
    jenis_pewarna: {
      type: 'enum',
      required: true,
      values: ['sintetis', 'alami'],
      label: 'Jenis pewarna',
    },
    lebar: {
      type: 'enum',
      required: true,
      values: [70, 110],
      label: 'Lebar',
    },
    harga_per_meter: {
      type: 'number',
      required: true,
      min: 0,
      label: 'Harga per meter',
    },
  })

  if (errors.length > 0) {
    return errorResponse('Data tidak valid', 400, { errors })
  }

  // motif_id boleh null (harga umum) atau UUID (harga exception)
  const motifId = body.motif_id || null

  const { data, error } = await supabaseAdmin
    .from('daftar_harga')
    .insert({
      jenis_pewarna: body.jenis_pewarna,
      motif_id: motifId,
      lebar: parseInt(body.lebar),
      harga_per_meter: parseFloat(body.harga_per_meter),
    })
    .select(
      `
        id,
        jenis_pewarna,
        lebar,
        harga_per_meter,
        motif:motif_id(id, nama)
      `
    )
    .single()

  if (error) {
    if (error.code === '23505') {
      return conflictResponse(
        'Harga untuk kombinasi jenis pewarna, motif, dan lebar ini sudah ada'
      )
    }
    return errorResponse('Gagal membuat harga: ' + error.message, 500)
  }

  return successResponse(data, 'Harga berhasil ditambahkan', 201)
})