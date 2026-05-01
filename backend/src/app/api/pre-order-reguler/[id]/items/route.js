// =====================================================
// /api/pre-order-reguler/[id]/items
// GET  - list items dalam 1 PO (semua role)
// POST - tambah item baru ke PO existing (CS/kepala_produksi)
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/response-helper'
import { PRE_ORDER_INPUT_ROLES } from '@/lib/role-helper'
import { validate, safeParseBody, isValidUUID } from '@/lib/validation'
import {
  lookupHargaPerMeter,
  calculateItemSubtotal,
  recalculateTotalPOR,
} from '@/lib/preorder-helper'
import supabaseAdmin from '@/lib/supabase-admin'

// =====================================================
// GET - list items
// =====================================================
export const GET = withAuth(async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID PO tidak valid', 400)

  // Cek PO exists
  const { data: po } = await supabaseAdmin
    .from('pre_order_reguler')
    .select('id, nomor_po')
    .eq('id', id)
    .maybeSingle()

  if (!po) return notFoundResponse('Pre-order tidak ditemukan')

  const { data, error } = await supabaseAdmin
    .from('item_pre_order_reguler')
    .select(`
      id, produk_id, lebar, panjang, jumlah, harga_per_meter, subtotal, created_at,
      produk:produk_id(
        id, kode_produk, gambar_url, jenis_pewarna,
        motif:motif_id(nama_motif)
      )
    `)
    .eq('pre_order_reguler_id', id)
    .order('created_at', { ascending: true })

  if (error) return errorResponse('Gagal memuat items: ' + error.message, 500)

  return successResponse({
    pre_order: { id: po.id, nomor_po: po.nomor_po },
    items: data || [],
    total: data?.length || 0,
  })
})

// =====================================================
// POST - tambah item ke PO
// =====================================================
export const POST = withAuthAndRole(
  PRE_ORDER_INPUT_ROLES,
  async ({ request, params }) => {
    const { id } = params
    if (!isValidUUID(id)) return errorResponse('ID PO tidak valid', 400)

    const body = await safeParseBody(request)
    if (!body) return errorResponse('Body request tidak valid', 400)

    const errors = validate(body, {
      produk_id: { type: 'uuid', required: true, label: 'Produk' },
      lebar: { type: 'enum', required: true, values: [70, 110], label: 'Lebar' },
      panjang: { type: 'number', required: true, min: 0.1, label: 'Panjang' },
      jumlah: { type: 'integer', required: true, min: 1, label: 'Jumlah' },
    })
    if (errors.length) return errorResponse(errors[0], 400, { errors })

    // Cek PO exists
    const { data: po } = await supabaseAdmin
      .from('pre_order_reguler')
      .select('id, status')
      .eq('id', id)
      .maybeSingle()

    if (!po) return notFoundResponse('Pre-order tidak ditemukan')

    // Tidak boleh tambah item kalau PO sudah selesai
    if (po.status === 'selesai') {
      return errorResponse(
        'Tidak bisa menambah item ke pre-order yang sudah selesai',
        400
      )
    }

    // Ambil produk untuk lookup harga
    const { data: produk } = await supabaseAdmin
      .from('produk')
      .select('id, jenis_pewarna, motif_id')
      .eq('id', body.produk_id)
      .maybeSingle()

    if (!produk) return notFoundResponse('Produk tidak ditemukan')

    // Lookup harga
    const hargaPerMeter = await lookupHargaPerMeter(
      produk.jenis_pewarna,
      produk.motif_id,
      body.lebar
    )

    if (hargaPerMeter === 0) {
      return errorResponse(
        `Harga untuk ${produk.jenis_pewarna} ${body.lebar}cm belum diset`,
        400
      )
    }

    const subtotal = calculateItemSubtotal(body.panjang, body.jumlah, hargaPerMeter)

    // Insert item
    const { data: newItem, error } = await supabaseAdmin
      .from('item_pre_order_reguler')
      .insert({
        pre_order_reguler_id: id,
        produk_id: body.produk_id,
        lebar: body.lebar,
        panjang: Number(body.panjang),
        jumlah: Number(body.jumlah),
        harga_per_meter: hargaPerMeter,
        subtotal: subtotal,
      })
      .select(`
        *,
        produk:produk_id(kode_produk, motif:motif_id(nama_motif))
      `)
      .single()

    if (error) return errorResponse('Gagal menambah item: ' + error.message, 500)

    // Recalculate total PO
    await recalculateTotalPOR(id)

    return successResponse(newItem, 'Item berhasil ditambahkan', 201)
  }
)