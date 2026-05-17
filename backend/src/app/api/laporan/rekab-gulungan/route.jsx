// =====================================================
// /api/laporan/rekap-gulungan
// GET - generate PDF laporan rekap gulungan per lebar.
//
// Query params:
//   ?lebar=70|110 (REQUIRED)
//
// Response: file PDF (Content-Type: application/pdf)
//
// Akses: semua role (lihat-only document)
// =====================================================

import { withAuth } from '@/lib/api-helper'
import { errorResponse } from '@/lib/response-helper'
import { parseQueryParam } from '@/lib/crud-helper'
import { generateLaporanRekapGulungan } from '@/lib/pdf-helper'
import supabaseAdmin from '@/lib/supabase-admin'

export const GET = withAuth(async ({ request }) => {
  const filterLebar = parseQueryParam(request, 'lebar')

  // Validasi
  if (!filterLebar) {
    return errorResponse('Parameter lebar wajib diisi (70 atau 110)', 400)
  }
  if (!['70', '110'].includes(filterLebar)) {
    return errorResponse('Lebar harus 70 atau 110', 400)
  }

  const lebar = parseInt(filterLebar)

  // Fetch gulungan aktif dengan join ke produk, motif, kategori, rak
  const { data, error } = await supabaseAdmin
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
        rak_id,
        produk:produk_id(
          id,
          kode_produk,
          jenis_pewarna,
          motif:motif_id(id, nama),
          kategori:kategori_id(id, nama)
        ),
        rak:rak_id(id, nama)
      `
    )
    .eq('is_active', true)
    .eq('lebar', lebar)
    .order('rak_id', { ascending: true })
    .order('nomor_gulungan', { ascending: true })

  if (error) {
    console.error('[laporan/rekap-gulungan] error:', error)
    return errorResponse('Gagal memuat data: ' + error.message, 500)
  }

  // Group by rak di backend (sama logic dengan frontend hook)
  const grouped = {}
  let totalAll = 0

  ;(data || []).forEach((g) => {
    const rakId = g.rak?.id || g.rak_id || 'no-rak'
    const rakNama = g.rak?.nama || 'Tanpa Rak'

    if (!grouped[rakId]) {
      grouped[rakId] = {
        rak_id: rakId,
        rak_nama: rakNama,
        items: [],
        total: 0,
      }
    }

    grouped[rakId].items.push(g)
    const sisa = Number(g.panjang_sisa || 0)
    grouped[rakId].total += sisa
    totalAll += sisa
  })

  const groups = Object.values(grouped).sort((a, b) =>
    a.rak_nama.localeCompare(b.rak_nama)
  )

  // Generate PDF
  try {
    const pdfBuffer = await generateLaporanRekapGulungan({
      lebar,
      groups,
      totalAll,
      generatedAt: new Date(),
    })

    const filename = `laporan-rekap-gulungan-${lebar}cm-${Date.now()}.pdf`

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[laporan/rekap-gulungan] PDF error:', err)
    return errorResponse('Gagal generate PDF: ' + err.message, 500)
  }
})