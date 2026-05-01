// =====================================================
// /api/pre-order-custom
// GET  - list PO custom (semua role)
// POST - create PO custom (CS/kepala_produksi)
//
// PO custom = flat form, TIDAK punya items (single transaction).
// total_harga = input manual (karena desain custom).
// gambar_custom = optional URL ke desain customer (Supabase Storage).
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
} from '@/lib/response-helper'
import { PRE_ORDER_INPUT_ROLES } from '@/lib/role-helper'
import { validate, safeParseBody } from '@/lib/validation'
import {
  parsePagination,
  parseQueryParam,
  buildPaginatedData,
} from '@/lib/crud-helper'
import supabaseAdmin from '@/lib/supabase-admin'

// =====================================================
// GET - list PO custom
// =====================================================
export const GET = withAuth(async ({ request }) => {
  const pagination = parsePagination(request)
  const filterStatus = parseQueryParam(request, 'status')
  const filterPembayaran = parseQueryParam(request, 'status_pembayaran')

  const buildQuery = (forCount = false) => {
    let query = supabaseAdmin
      .from('pre_order_custom')
      .select(
        forCount
          ? '*'
          : `
            id,
            nomor_po,
            gambar_custom,
            nama_customer,
            kontak_customer,
            tanggal_selesai,
            status,
            metode_pembayaran,
            status_pembayaran,
            total_dp,
            diskon,
            total_harga,
            created_at,
            created_by_profile:created_by(id, username, nama)
          `,
        forCount ? { count: 'exact', head: true } : undefined
      )

    if (filterStatus) query = query.eq('status', filterStatus)
    if (filterPembayaran) query = query.eq('status_pembayaran', filterPembayaran)

    return query
  }

  const [countResult, dataResult] = await Promise.all([
    buildQuery(true),
    buildQuery(false)
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1),
  ])

  if (dataResult.error) {
    return errorResponse(
      'Gagal memuat pre-order custom: ' + dataResult.error.message,
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
// POST - create PO custom
// =====================================================
export const POST = withAuthAndRole(
  PRE_ORDER_INPUT_ROLES,
  async ({ request, user }) => {
    const body = await safeParseBody(request)
    if (!body) return errorResponse('Body request tidak valid', 400)

    const errors = validate(body, {
      nama_customer: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 255,
        label: 'Nama customer',
      },
      kontak_customer: { type: 'string', maxLength: 20, label: 'Kontak' },
      alamat_customer: { type: 'string', label: 'Alamat' },
      gambar_custom: { type: 'string', maxLength: 500, label: 'Gambar custom URL' },
      metode_pembayaran: {
        type: 'enum',
        required: true,
        values: ['cash', 'transfer'],
        label: 'Metode pembayaran',
      },
      status_pembayaran: {
        type: 'enum',
        required: true,
        values: ['dp', 'lunas'],
        label: 'Status pembayaran',
      },
      total_dp: { type: 'number', min: 0, label: 'Total DP' },
      diskon: { type: 'number', min: 0, max: 100, label: 'Diskon' },
      total_harga: {
        type: 'number',
        required: true,
        min: 0,
        label: 'Total harga',
      },
      catatan: { type: 'string', label: 'Catatan' },
    })
    if (errors.length) return errorResponse(errors[0], 400, { errors })

    const { data, error } = await supabaseAdmin
      .from('pre_order_custom')
      .insert({
        created_by: user.id,
        gambar_custom: body.gambar_custom || null,
        nama_customer: body.nama_customer.trim(),
        kontak_customer: body.kontak_customer || null,
        alamat_customer: body.alamat_customer || null,
        tanggal_selesai: body.tanggal_selesai || null,
        metode_pembayaran: body.metode_pembayaran,
        status_pembayaran: body.status_pembayaran,
        total_dp: Number(body.total_dp || 0),
        diskon: Number(body.diskon || 0),
        total_harga: Number(body.total_harga),
        catatan: body.catatan || null,
      })
      .select()
      .single()

    if (error) {
      return errorResponse('Gagal menyimpan PO custom: ' + error.message, 500)
    }

    return successResponse(data, 'Pre-order custom berhasil dibuat', 201)
  }
)