// =====================================================
// /api/rekap-gulungan
// GET - rekap stok gulungan untuk halaman Rekap.
//
// Tujuan rekap:
//   Owner / Kepala Produksi mau tahu total gulungan kain per rak,
//   biasanya untuk cocokkan stok fisik dengan sistem (stock-take).
//
// Karakteristik:
//   - HANYA gulungan AKTIF (is_active=true, masih ada panjang_sisa)
//   - TIDAK pakai pagination (frontend butuh semua data untuk hitung total)
//   - Filter optional by lebar (70 atau 110 cm)
//   - Frontend yang lakukan grouping by rak
//
// Query params:
//   ?lebar=70  → filter cuma lebar 70 cm
//   ?lebar=110 → filter cuma lebar 110 cm
//   (tanpa param) → semua lebar
//
// Response:
//   {
//     success: true,
//     data: {
//       items: [
//         {
//           id, nomor_gulungan, lebar, panjang_total, panjang_sisa,
//           harga_per_meter, is_active, rak_id,
//           rak: { id, nama },
//           produk: {
//             id, kode_produk, jenis_pewarna, gambar_url,
//             motif: { id, nama },
//             kategori: { id, nama }
//           }
//         },
//         ...
//       ],
//       total: 42  // jumlah gulungan aktif
//     }
//   }
// =====================================================

import { withAuth } from '@/lib/api-helper'
import { successResponse, errorResponse } from '@/lib/response-helper'
import { parseQueryParam } from '@/lib/crud-helper'
import supabaseAdmin from '@/lib/supabase-admin'

export const GET = withAuth(async ({ request }) => {
  const filterLebar = parseQueryParam(request, 'lebar')

  // Validasi lebar - hanya 70 atau 110 yang valid
  if (filterLebar && !['70', '110'].includes(filterLebar)) {
    return errorResponse('Lebar harus 70 atau 110', 400)
  }

  // Query gulungan dengan nested join.
  // Format Supabase: relation_name(field1, field2, nested_relation(...))
  let query = supabaseAdmin
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
        produk_id,
        rak:rak_id(id, nama),
        produk:produk_id(
          id,
          kode_produk,
          jenis_pewarna,
          gambar_url,
          motif:motif_id(id, nama),
          kategori:kategori_id(id, nama)
        )
      `
    )
    // Hanya gulungan aktif (is_active=true) - sudah include filter panjang_sisa>0
    // karena trigger DB otomatis set is_active=false saat panjang_sisa habis
    .eq('is_active', true)

  // Filter optional by lebar
  if (filterLebar) {
    query = query.eq('lebar', parseInt(filterLebar))
  }

  // Sort: rak dulu (supaya group by rak teratur), lalu nomor_gulungan
  const { data, error } = await query
    .order('rak_id', { ascending: true })
    .order('nomor_gulungan', { ascending: true })

  if (error) {
    console.error('[rekap-gulungan] error:', error)
    return errorResponse('Gagal memuat rekap: ' + error.message, 500)
  }

  return successResponse({
    items: data || [],
    total: (data || []).length,
  })
})