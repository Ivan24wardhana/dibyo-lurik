// =====================================================
// /api/produk/[id]
// GET    - detail produk + list gulungan
// PATCH  - update produk (kepala_produksi/owner)
// DELETE - hapus jika tidak dipakai gulungan/order/PO
//
// Schema v6: nama tabel item-nya:
//   - item_order (bukan order_items)
//   - item_pre_order_reguler
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

const PRODUK_FK_REFERENCES = [
  { table: 'gulungan', column: 'produk_id' },
  { table: 'item_pre_order_reguler', column: 'produk_id' },
]

// =====================================================
// GET - detail produk + gulungan
// =====================================================
export const GET = withAuth(async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const { data, error } = await supabaseAdmin
    .from('produk')
    .select(`
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
      kategori:kategori_id(id, nama_kategori),
      motif:motif_id(id, nama_motif),
      rak:rak_id(id, nama_rak),
      gulungan(id, nomor_gulungan, lebar, panjang_total, panjang_sisa, harga_per_meter, is_active)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return notFoundResponse('Produk tidak ditemukan')

  return successResponse(data)
})

// =====================================================
// PATCH - update produk
// =====================================================
export const PATCH = withAuthAndRole(PRODUCTION_ROLES, async ({ request, params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body request tidak valid', 400)

  const errors = validate(body, {
    kategori_id: { type: 'uuid', label: 'Kategori' },
    motif_id: { type: 'uuid', label: 'Motif' },
    rak_id: { type: 'uuid', label: 'Rak' },
    jenis_pewarna: {
      type: 'enum',
      values: ['sintetis', 'alami'],
      label: 'Jenis pewarna',
    },
    gambar_url: { type: 'string', maxLength: 500, label: 'Gambar URL' },
    // status & stok TIDAK boleh diubah manual - auto via trigger
  })
  if (errors.length) return errorResponse(errors[0], 400, { errors })

  const updates = { updated_at: new Date().toISOString() }
  if (body.kategori_id !== undefined) updates.kategori_id = body.kategori_id
  if (body.motif_id !== undefined) updates.motif_id = body.motif_id
  if (body.rak_id !== undefined) updates.rak_id = body.rak_id
  if (body.jenis_pewarna !== undefined) updates.jenis_pewarna = body.jenis_pewarna
  if (body.gambar_url !== undefined) updates.gambar_url = body.gambar_url

  const { data, error } = await supabaseAdmin
    .from('produk')
    .update(updates)
    .eq('id', id)
    .select(`
      id, gambar_url, kode_produk, jenis_pewarna, stok, status, terjual,
      kategori:kategori_id(nama_kategori),
      motif:motif_id(nama_motif),
      rak:rak_id(nama_rak)
    `)
    .single()

  if (error) return errorResponse('Gagal update: ' + error.message, 500)
  if (!data) return notFoundResponse('Produk tidak ditemukan')

  return successResponse(data, 'Produk berhasil diperbarui')
})

// =====================================================
// DELETE - dengan FK check
// =====================================================
export const DELETE = withAuthAndRole(PRODUCTION_ROLES, async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  const fkCheck = await checkFKReferences(id, PRODUK_FK_REFERENCES)
  if (fkCheck.used) return conflictResponse(formatFKErrorMessage(fkCheck.usedIn))

  const { error, count } = await supabaseAdmin
    .from('produk')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return errorResponse('Gagal menghapus: ' + error.message, 500)
  if (!count) return notFoundResponse('Produk tidak ditemukan')

  return successResponse(null, 'Produk berhasil dihapus')
})