// =====================================================
// /api/produk/[id]
// GET    - detail produk + list gulungan
// PATCH  - update produk
// DELETE - hapus produk (cek FK ke gulungan & item_pre_order_reguler)
//
// Helper convention:
//   - notFoundResponse(), conflictResponse() (bukan notFound/conflict)
//   - validate() return ARRAY error
//   - checkFKReferences(id, refs) - 2 args, refs: { table, column, label }
//   - formatFKErrorMessage(usedIn) - 1 arg
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  conflictResponse,
} from '@/lib/response-helper'
import { validate, safeParseBody } from '@/lib/validation'
import { checkFKReferences, formatFKErrorMessage } from '@/lib/crud-helper'
import { PRODUCTION_ROLES } from '@/lib/role-helper'
import supabaseAdmin from '@/lib/supabase-admin'

// =====================================================
// GET - Detail produk + list gulungan
// =====================================================
export const GET = withAuth(async ({ params }) => {
  const { id } = await params

  if (!id) {
    return errorResponse('ID produk wajib diisi', 400)
  }

  // Fetch produk dengan join
  const { data: produk, error: produkError } = await supabaseAdmin
    .from('produk')
    .select(
      `
        id,
        gambar_url,
        kode_produk,
        jenis_pewarna,
        stok,
        status,
        terjual,
        tanggal_ditambahkan,
        created_at,
        updated_at,
        kategori:kategori_id(id, nama),
        motif:motif_id(id, nama),
        rak:rak_id(id, nama)
      `
    )
    .eq('id', id)
    .single()

  if (produkError || !produk) {
    return notFoundResponse('Produk tidak ditemukan')
  }

  // Fetch gulungan untuk produk ini
  const { data: gulungan, error: gulunganError } = await supabaseAdmin
    .from('gulungan')
    .select(
      `
        id,
        nomor_gulungan,
        lebar,
        panjang_total,
        panjang_sisa,
        harga_per_meter,
        is_active,
        created_at,
        updated_at
      `
    )
    .eq('produk_id', id)
    .order('nomor_gulungan', { ascending: true })

  if (gulunganError) {
    console.error('[produk/[id] GET] gulungan error:', gulunganError)
  }

  return successResponse({
    ...produk,
    gulungan: gulungan || [],
  })
})

// =====================================================
// PATCH - Update produk
// =====================================================
export const PATCH = withAuthAndRole(
  PRODUCTION_ROLES,
  async ({ request, params }) => {
    const { id } = await params

    if (!id) {
      return errorResponse('ID produk wajib diisi', 400)
    }

    const body = await safeParseBody(request)
    if (!body) {
      return errorResponse('Body request harus JSON valid', 400)
    }

    // Schema dynamic - hanya validate field yang ada di body
    const schemaFields = {}
    if (body.kategori_id !== undefined) {
      schemaFields.kategori_id = { type: 'uuid', required: true, label: 'Kategori' }
    }
    if (body.motif_id !== undefined) {
      schemaFields.motif_id = { type: 'uuid', required: true, label: 'Motif' }
    }
    if (body.rak_id !== undefined) {
      schemaFields.rak_id = { type: 'uuid', required: true, label: 'Rak' }
    }
    if (body.jenis_pewarna !== undefined) {
      schemaFields.jenis_pewarna = {
        type: 'enum',
        required: true,
        values: ['sintetis', 'alami'],
        label: 'Jenis pewarna',
      }
    }

    const errors = validate(body, schemaFields)
    if (errors.length > 0) {
      return errorResponse('Data tidak valid', 400, { errors })
    }

    // Build update object
    const updateData = {}
    if (body.gambar_url !== undefined) updateData.gambar_url = body.gambar_url
    if (body.kategori_id !== undefined) updateData.kategori_id = body.kategori_id
    if (body.motif_id !== undefined) updateData.motif_id = body.motif_id
    if (body.rak_id !== undefined) updateData.rak_id = body.rak_id
    if (body.jenis_pewarna !== undefined) updateData.jenis_pewarna = body.jenis_pewarna

    if (Object.keys(updateData).length === 0) {
      return errorResponse('Tidak ada field yang diupdate', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('produk')
      .update(updateData)
      .eq('id', id)
      .select(
        `
          id,
          gambar_url,
          kode_produk,
          jenis_pewarna,
          stok,
          status,
          kategori:kategori_id(id, nama),
          motif:motif_id(id, nama),
          rak:rak_id(id, nama)
        `
      )
      .single()

    if (error) {
      console.error('[produk PATCH] error:', error)
      if (error.code === '23503') {
        return errorResponse('Kategori, motif, atau rak tidak ditemukan', 400)
      }
      return errorResponse('Gagal update produk: ' + error.message, 500)
    }

    if (!data) {
      return notFoundResponse('Produk tidak ditemukan')
    }

    return successResponse(data, 'Produk berhasil diupdate')
  }
)

// =====================================================
// DELETE - Hapus produk (cek FK)
// =====================================================
export const DELETE = withAuthAndRole(
  PRODUCTION_ROLES,
  async ({ params }) => {
    const { id } = await params

    if (!id) {
      return errorResponse('ID produk wajib diisi', 400)
    }

    // Cek FK references - format yang benar sesuai crud-helper
    const fkResult = await checkFKReferences(id, [
      { table: 'gulungan', column: 'produk_id', label: 'gulungan' },
      {
        table: 'item_pre_order_reguler',
        column: 'produk_id',
        label: 'item pre-order reguler',
      },
    ])

    if (fkResult.used) {
      return conflictResponse(formatFKErrorMessage(fkResult.usedIn))
    }

    const { error } = await supabaseAdmin.from('produk').delete().eq('id', id)

    if (error) {
      console.error('[produk DELETE] error:', error)
      return errorResponse('Gagal hapus produk: ' + error.message, 500)
    }

    return successResponse(null, 'Produk berhasil dihapus')
  }
)