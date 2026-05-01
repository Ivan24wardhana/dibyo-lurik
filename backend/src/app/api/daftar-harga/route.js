// =====================================================
// /api/daftar-harga
// GET  - list daftar harga (semua role bisa lihat)
// POST - tambah harga baru (kepala_produksi/owner)
//
// Struktur (jenis_pewarna, motif_id, lebar):
//   - motif_id NULL = harga umum
//   - motif_id terisi = exception per motif (override umum)
//
// Query params GET:
//   ?jenis_pewarna=sintetis|alami
//   ?lebar=70|110
//   ?page=1&limit=20
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  conflictResponse,
  notFoundResponse,
} from '@/lib/response-helper'
import { PRODUCTION_ROLES } from '@/lib/role-helper'
import { validate, safeParseBody } from '@/lib/validation'
import {
  parsePagination,
  parseQueryParam,
  buildPaginatedData,
} from '@/lib/crud-helper'
import supabaseAdmin from '@/lib/supabase-admin'

// =====================================================
// GET - list dengan filter optional
// =====================================================
export const GET = withAuth(async ({ request }) => {
  const pagination = parsePagination(request)
  const filterJenis = parseQueryParam(request, 'jenis_pewarna')
  const filterLebar = parseQueryParam(request, 'lebar')

  const buildQuery = (forCount = false) => {
    let query = supabaseAdmin
      .from('daftar_harga')
      .select(
        forCount
          ? '*'
          : `
            id,
            jenis_pewarna,
            motif_id,
            lebar,
            harga_per_meter,
            created_at,
            updated_at,
            motif:motif_id(id, nama_motif)
          `,
        forCount ? { count: 'exact', head: true } : undefined
      )

    if (filterJenis) query = query.eq('jenis_pewarna', filterJenis)
    if (filterLebar) query = query.eq('lebar', parseInt(filterLebar))

    return query
  }

  const [countResult, dataResult] = await Promise.all([
    buildQuery(true),
    buildQuery(false)
      .order('jenis_pewarna', { ascending: true })
      .order('lebar', { ascending: true })
      .order('motif_id', { nullsFirst: true })
      .range(pagination.offset, pagination.offset + pagination.limit - 1),
  ])

  if (dataResult.error) {
    return errorResponse(
      'Gagal memuat daftar harga: ' + dataResult.error.message,
      500
    )
  }

  return successResponse(
    buildPaginatedData(
      dataResult.data || [],
      countResult.count || 0,
      pagination
    )
  )
})

// =====================================================
// POST - tambah harga baru
// =====================================================
export const POST = withAuthAndRole(PRODUCTION_ROLES, async ({ request }) => {
  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body request tidak valid', 400)

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
    // motif_id OPTIONAL - kalau null = harga umum
    motif_id: { type: 'uuid', label: 'Motif' },
  })
  if (errors.length) return errorResponse(errors[0], 400, { errors })

  const motifId = body.motif_id || null

  // Kalau motif_id ada, cek motif exists
  if (motifId) {
    const { data: motifExists } = await supabaseAdmin
      .from('motif')
      .select('id')
      .eq('id', motifId)
      .maybeSingle()
    if (!motifExists) return notFoundResponse('Motif tidak ditemukan')
  }

  // Cek duplikat: kombinasi (jenis_pewarna, motif_id, lebar) harus unique
  let dupQuery = supabaseAdmin
    .from('daftar_harga')
    .select('id')
    .eq('jenis_pewarna', body.jenis_pewarna)
    .eq('lebar', body.lebar)

  if (motifId) {
    dupQuery = dupQuery.eq('motif_id', motifId)
  } else {
    dupQuery = dupQuery.is('motif_id', null)
  }

  const { data: duplicate } = await dupQuery.maybeSingle()
  if (duplicate) {
    const target = motifId
      ? 'kombinasi jenis pewarna, motif, dan lebar'
      : 'kombinasi jenis pewarna dan lebar (umum)'
    return conflictResponse(`Harga untuk ${target} ini sudah ada`)
  }

  // Insert
  const { data, error } = await supabaseAdmin
    .from('daftar_harga')
    .insert({
      jenis_pewarna: body.jenis_pewarna,
      motif_id: motifId,
      lebar: body.lebar,
      harga_per_meter: body.harga_per_meter,
    })
    .select(`
      *,
      motif:motif_id(id, nama_motif)
    `)
    .single()

  if (error) {
    return errorResponse('Gagal menyimpan: ' + error.message, 500)
  }

  return successResponse(data, 'Daftar harga berhasil ditambahkan', 201)
})