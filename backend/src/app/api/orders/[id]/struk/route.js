// =====================================================
// /api/orders/[id]/struk
// GET - generate & return PDF struk untuk 1 order
//
// Response: file PDF (binary) dengan Content-Type: application/pdf
// Content-Disposition: inline supaya browser preview di tab baru
// (atau download kalau frontend handle).
//
// Cara pakai dari frontend:
//   const url = `/api/orders/${id}/struk`
//   window.open(url, '_blank')  // buka di tab baru
//   // atau:
//   const blob = await api.get(url, { responseType: 'blob' })
//   downloadBlob(blob, `struk-${nomorOrder}.pdf`)
// =====================================================

import { withAuth } from '@/lib/api-helper'
import {
  errorResponse,
  notFoundResponse,
} from '@/lib/response-helper'
import { isValidUUID } from '@/lib/validation'
import { generateStrukPDF } from '@/lib/pdf-helper'
import supabaseAdmin from '@/lib/supabase-admin'

export const GET = withAuth(async ({ params }) => {
  const { id } = params
  if (!isValidUUID(id)) return errorResponse('ID tidak valid', 400)

  // Ambil data order lengkap
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      kasir:user_id(id, username, nama),
      items:item_order(
        id, jumlah_order, harga_per_meter, subtotal,
        gulungan:gulungan_id(
          id, lebar,
          produk:produk_id(
            kode_produk,
            motif:motif_id(nama_motif)
          )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !order) return notFoundResponse('Order tidak ditemukan')

  try {
    // Generate PDF buffer
    const pdfBuffer = await generateStrukPDF(order)

    // Return sebagai PDF response
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="struk-${order.nomor_order}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[Struk PDF] error:', err)
    return errorResponse('Gagal generate struk PDF: ' + err.message, 500)
  }
})