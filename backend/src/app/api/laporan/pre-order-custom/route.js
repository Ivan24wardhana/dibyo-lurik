// =====================================================
// /api/laporan/pre-order-custom
// GET - generate PDF laporan PO custom
// =====================================================

import { withAuth } from '@/lib/api-helper'
import { errorResponse } from '@/lib/response-helper'
import { parseQueryParam } from '@/lib/crud-helper'
import { generateLaporanPOCustom } from '@/lib/pdf-helper'
import supabaseAdmin from '@/lib/supabase-admin'

export const GET = withAuth(async ({ request }) => {
  const startDate = parseQueryParam(request, 'start')
  const endDate = parseQueryParam(request, 'end')
  const filterStatus = parseQueryParam(request, 'status')
  const filterPembayaran = parseQueryParam(request, 'status_pembayaran')

  let query = supabaseAdmin
    .from('pre_order_custom')
    .select('id, nomor_po, nama_customer, status, status_pembayaran, total_harga, created_at')

  if (startDate) query = query.gte('created_at', startDate)
  if (endDate) query = query.lte('created_at', endDate + 'T23:59:59')
  if (filterStatus) query = query.eq('status', filterStatus)
  if (filterPembayaran) query = query.eq('status_pembayaran', filterPembayaran)

  const { data: poList, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return errorResponse('Gagal memuat PO custom: ' + error.message, 500)
  }

  let dateRange = 'Semua periode'
  if (startDate && endDate) dateRange = `${startDate} s/d ${endDate}`
  else if (startDate) dateRange = `Mulai ${startDate}`
  else if (endDate) dateRange = `Sampai ${endDate}`

  try {
    const pdfBuffer = await generateLaporanPOCustom(poList || [], { dateRange })

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="laporan-po-custom-${Date.now()}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[Laporan PO Custom PDF] error:', err)
    return errorResponse('Gagal generate laporan: ' + err.message, 500)
  }
})