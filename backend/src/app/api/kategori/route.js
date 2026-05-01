// =====================================================
// /api/kategori
// GET  - list kategori dengan pagination (semua role)
// POST - tambah kategori baru (kepala_produksi/owner)
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

// =====================================================
// GET - list kategori
// =====================================================
export const GET = withAuth(async ({ request }) => {
  const pagination = parsePagination(request)

  const [countResult, dataResult] = await Promise.all([
    supabaseAdmin
      .from('kategori')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('kategori')
      .select('id, nama_kategori, created_at, updated_at')
      .order('nama_kategori', { ascending: true })
      .range(pagination.offset, pagination.offset + pagination.limit - 1),
  ])

  if (dataResult.error) {
    return errorResponse('Gagal memuat data kategori', 500)
  }

  return successResponse(
    buildPaginatedData(dataResult.data || [], countResult.count || 0, pagination)
  )
})

// =====================================================
// POST - tambah kategori
// =====================================================
export const POST = withAuthAndRole(PRODUCTION_ROLES, async ({ request }) => {
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

  const namaKategori = body.nama_kategori.trim()

  // Cek duplikat (case-insensitive)
  const { data: existing } = await supabaseAdmin
    .from('kategori')
    .select('id')
    .ilike('nama_kategori', namaKategori)
    .maybeSingle()

  if (existing) {
    return conflictResponse('Nama kategori sudah ada')
  }

  const { data, error } = await supabaseAdmin
    .from('kategori')
    .insert({ nama_kategori: namaKategori })
    .select()
    .single()

  if (error) {
    return errorResponse('Gagal menyimpan kategori: ' + error.message, 500)
  }

  return successResponse(data, 'Kategori berhasil ditambahkan', 201)
})