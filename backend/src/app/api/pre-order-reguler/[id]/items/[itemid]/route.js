// =====================================================
// /api/pre-order-reguler/[id]/items/[itemId]
// PATCH  - update panjang/jumlah/lebar 1 item (CS/kepala_produksi)
// DELETE - hapus 1 item dari PO (CS/kepala_produksi)
//
// Setiap perubahan otomatis recalculate total_harga PO.
// =====================================================

import { withAuthAndRole } from '@/lib/api-helper'
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
// PATCH - update item
// =====================================================
export const PATCH = withAuthAndRole(
  PRE_ORDER_INPUT_ROLES,
  async ({ request, params }) => {
    const { id, itemId } = params
    if (!isValidUUID(id)) return errorResponse('ID PO tidak valid', 400)
    if (!isValidUUID(itemId)) return errorResponse('ID item tidak valid', 400)

    const body = await safeParseBody(request)
    if (!body) return errorResponse('Body request tidak valid', 400)

    const errors = validate(body, {
      lebar: { type: 'enum', values: [70, 110], label: 'Lebar' },
      panjang: { type: 'number', min: 0.1, label: 'Panjang' },
      jumlah: { type: 'integer', min: 1, label: 'Jumlah' },
    })
    if (errors.length) return errorResponse(errors[0], 400, { errors })

    // Ambil item existing + produk untuk recalculate harga kalau lebar berubah
    const { data: existing } = await supabaseAdmin
      .from('item_pre_order_reguler')
      .select(`
        *,
        produk:produk_id(jenis_pewarna, motif_id)
      `)
      .eq('id', itemId)
      .eq('pre_order_reguler_id', id)
      .maybeSingle()

    if (!existing) return notFoundResponse('Item tidak ditemukan dalam PO ini')

    // Tentukan field final
    const newLebar = body.lebar ?? existing.lebar
    const newPanjang = body.panjang ?? existing.panjang
    const newJumlah = body.jumlah ?? existing.jumlah

    // Re-lookup harga kalau lebar berubah
    let newHarga = Number(existing.harga_per_meter)
    if (body.lebar !== undefined && body.lebar !== existing.lebar) {
      newHarga = await lookupHargaPerMeter(
        existing.produk.jenis_pewarna,
        existing.produk.motif_id,
        newLebar
      )
      if (newHarga === 0) {
        return errorResponse(
          `Harga untuk ${existing.produk.jenis_pewarna} ${newLebar}cm belum diset`,
          400
        )
      }
    }

    const newSubtotal = calculateItemSubtotal(newPanjang, newJumlah, newHarga)

    const { data, error } = await supabaseAdmin
      .from('item_pre_order_reguler')
      .update({
        lebar: newLebar,
        panjang: newPanjang,
        jumlah: newJumlah,
        harga_per_meter: newHarga,
        subtotal: newSubtotal,
      })
      .eq('id', itemId)
      .select()
      .single()

    if (error) return errorResponse('Gagal update item: ' + error.message, 500)

    // Recalculate total PO
    await recalculateTotalPOR(id)

    return successResponse(data, 'Item berhasil diperbarui')
  }
)

// =====================================================
// DELETE - hapus item dari PO
// =====================================================
export const DELETE = withAuthAndRole(
  PRE_ORDER_INPUT_ROLES,
  async ({ params }) => {
    const { id, itemId } = params
    if (!isValidUUID(id)) return errorResponse('ID PO tidak valid', 400)
    if (!isValidUUID(itemId)) return errorResponse('ID item tidak valid', 400)

    // Cek item ada di PO ini
    const { data: existing } = await supabaseAdmin
      .from('item_pre_order_reguler')
      .select('id')
      .eq('id', itemId)
      .eq('pre_order_reguler_id', id)
      .maybeSingle()

    if (!existing) return notFoundResponse('Item tidak ditemukan dalam PO ini')

    // Cek apakah ini item terakhir
    const { count: totalItems } = await supabaseAdmin
      .from('item_pre_order_reguler')
      .select('*', { count: 'exact', head: true })
      .eq('pre_order_reguler_id', id)

    if (totalItems === 1) {
      return errorResponse(
        'Tidak bisa menghapus item terakhir. Hapus seluruh PO jika perlu.',
        400
      )
    }

    const { error } = await supabaseAdmin
      .from('item_pre_order_reguler')
      .delete()
      .eq('id', itemId)

    if (error) return errorResponse('Gagal hapus item: ' + error.message, 500)

    await recalculateTotalPOR(id)

    return successResponse(null, 'Item berhasil dihapus')
  }
)