// =====================================================
// /api/laporan/orders
// GET - generate PDF laporan orders
//
// Query params (optional):
//   ?start=YYYY-MM-DD  → tanggal mulai
//   ?end=YYYY-MM-DD    → tanggal akhir
//   Kalau tidak diisi: semua order
//
// Response: PDF file (A4)
// Role: semua role bisa lihat (CS untuk riwayat, owner untuk laporan)
// =====================================================

import { withAuth } from '@/lib/api-helper'
import { errorResponse } from '@/lib/response-helper'
import { parseQueryParam } from '@/lib/crud-helper'
import { generateLaporanOrders } from '@/lib/pdf-helper'
import supabaseAdmin from '@/lib/supabase-admin'

export const GET = withAuth(async ({ request }) => {
  const startDate = parseQueryParam(request, 'start')
  const endDate = parseQueryParam(request, 'end')

  // Build query
  let query = supabaseAdmin
    .from('orders')
    .select(`
      id, nomor_order, tanggal_order, metode_pembayaran, diskon, total_harga,
      kasir:user_id(username, nama),
      items:item_order(id)
    `)

  if (startDate) query = query.gte('tanggal_order', startDate)
  if (endDate) query = query.lte('tanggal_order', endDate + 'T23:59:59')

  const { data: orders, error } = await query.order('tanggal_order', { ascending: false })

  if (error) {
    return errorResponse('Gagal memuat orders: ' + error.message, 500)
  }

  // Format date range untuk header PDF
  let dateRange = 'Semua periode'
  if (startDate && endDate) {
    dateRange = `${startDate} s/d ${endDate}`
  } else if (startDate) {
    dateRange = `Mulai ${startDate}`
  } else if (endDate) {
    dateRange = `Sampai ${endDate}`
  }

  try {
    const pdfBuffer = await generateLaporanOrders(orders || [], { dateRange })

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="laporan-orders-${Date.now()}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[Laporan Orders PDF] error:', err)
    return errorResponse('Gagal generate laporan: ' + err.message, 500)
  }
})