// =====================================================
// /api/gulungan/[id]
// GET    - detail gulungan
// PATCH  - update gulungan (Kepala Produksi only)
// DELETE - hapus gulungan (cek FK ke item_order)
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
// GET - Detail gulungan
// =====================================================
export const GET = withAuth(async ({ params }) => {
  const { id } = await params

  if (!id) {
    return errorResponse('ID gulungan wajib diisi', 400)
  }

  const { data, error } = await supabaseAdmin
    .from('gulungan')
    .select(
      `
        id,
        produk_id,
        nomor_gulungan,
        lebar,
        panjang_total,
        panjang_sisa,
        harga_per_meter,
        is_active,
        created_at,
        updated_at,
        produk:produk_id(
          id,
          kode_produk,
          jenis_pewarna,
          kategori:kategori_id(id, nama),
          motif:motif_id(id, nama),
          rak:rak_id(id, nama)
        )
      `
    )
    .eq('id', id)
    .single()

  if (error || !data) {
    return notFoundResponse('Gulungan tidak ditemukan')
  }

  return successResponse(data)
})

// =====================================================
// PATCH - Update gulungan
// Field yang bisa diupdate:
//   - lebar (70/110)
//   - panjang_total (CAUTION: harus >= panjang_sisa kalau gulungan udah dipotong order)
//   - harga_per_meter
//   - is_active (manual deactivate)
// =====================================================
export const PATCH = withAuthAndRole(
  PRODUCTION_ROLES,
  async ({ request, params }) => {
    const { id } = await params

    if (!id) {
      return errorResponse('ID gulungan wajib diisi', 400)
    }

    const body = await safeParseBody(request)
    if (!body) {
      return errorResponse('Body request harus JSON valid', 400)
    }

    // Schema dynamic
    const schemaFields = {}
    if (body.lebar !== undefined) {
      schemaFields.lebar = {
        type: 'enum',
        required: true,
        values: [70, 110],
        label: 'Lebar',
      }
    }
    if (body.panjang_total !== undefined) {
      schemaFields.panjang_total = {
        type: 'number',
        required: true,
        min: 0.01,
        label: 'Panjang total',
      }
    }
    if (body.harga_per_meter !== undefined) {
      schemaFields.harga_per_meter = {
        type: 'number',
        required: true,
        min: 0,
        label: 'Harga per meter',
      }
    }

    const errors = validate(body, schemaFields)
    if (errors.length > 0) {
      return errorResponse('Data tidak valid', 400, { errors })
    }

    // Cek gulungan exists & ambil panjang_sisa untuk validasi panjang_total
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('gulungan')
      .select('id, panjang_sisa, panjang_total')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return notFoundResponse('Gulungan tidak ditemukan')
    }

    // Build update object
    const updateData = {}
    if (body.lebar !== undefined) updateData.lebar = parseInt(body.lebar)
    if (body.harga_per_meter !== undefined) {
      updateData.harga_per_meter = parseFloat(body.harga_per_meter)
    }
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    if (body.panjang_total !== undefined) {
      const newPanjangTotal = parseFloat(body.panjang_total)

      // Hitung selisih dengan panjang_total existing
      const selisih = newPanjangTotal - existing.panjang_total
      const newPanjangSisa = existing.panjang_sisa + selisih

      if (newPanjangSisa < 0) {
        return errorResponse(
          `Panjang total tidak boleh kurang dari panjang yang sudah terjual. Min: ${existing.panjang_total - existing.panjang_sisa} m`,
          400
        )
      }

      updateData.panjang_total = newPanjangTotal
      updateData.panjang_sisa = newPanjangSisa
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse('Tidak ada field yang diupdate', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('gulungan')
      .update(updateData)
      .eq('id', id)
      .select(
        `
          id,
          produk_id,
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
      .single()

    if (error) {
      console.error('[gulungan PATCH] error:', error)
      return errorResponse('Gagal update gulungan: ' + error.message, 500)
    }

    return successResponse(data, 'Gulungan berhasil diupdate')
  }
)

// =====================================================
// DELETE - Hapus gulungan (cek FK ke item_order)
// =====================================================
export const DELETE = withAuthAndRole(
  PRODUCTION_ROLES,
  async ({ params }) => {
    const { id } = await params

    if (!id) {
      return errorResponse('ID gulungan wajib diisi', 400)
    }

    // Cek FK references - gulungan tidak bisa dihapus kalau sudah dipakai di item_order
    const fkResult = await checkFKReferences(id, [
      { table: 'item_order', column: 'gulungan_id', label: 'transaksi order' },
    ])

    if (fkResult.used) {
      return conflictResponse(formatFKErrorMessage(fkResult.usedIn))
    }

    const { error } = await supabaseAdmin.from('gulungan').delete().eq('id', id)

    if (error) {
      console.error('[gulungan DELETE] error:', error)
      return errorResponse('Gagal hapus gulungan: ' + error.message, 500)
    }

    return successResponse(null, 'Gulungan berhasil dihapus')
  }
)