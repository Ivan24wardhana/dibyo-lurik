// =====================================================
// /api/harga/lookup
// GET - lookup harga per meter berdasarkan (jenis_pewarna, motif_id, lebar)
//
// Dipakai oleh frontend saat:
// - CS bikin order → form gulungan auto-fill harga
// - Kepala produksi bikin pre-order reguler → item auto-fill harga
// - Tambah gulungan baru → harga snapshot otomatis
//
// Query params (semua REQUIRED):
//   jenis_pewarna  - 'sintetis' atau 'alami'
//   motif_id       - UUID motif (untuk cek exception per motif)
//   lebar          - 70 atau 110
//
// Logic priority lookup:
//   1. Cari spesifik (jenis_pewarna + motif_id + lebar) → kalau ada, return
//   2. Fallback ke umum (motif_id NULL) → return
//   3. Kalau tidak ada juga → return 0 dengan source: 'not_found'
//
// Response success:
//   {
//     success: true,
//     data: {
//       harga_per_meter: 60000,
//       source: 'motif_specific' | 'general' | 'not_found',
//       jenis_pewarna: 'sintetis',
//       motif_id: '<uuid>',
//       lebar: 110
//     }
//   }
// =====================================================

import { withAuth } from '@/lib/api-helper'
import { successResponse, errorResponse } from '@/lib/response-helper'
import { isValidUUID, isInEnum } from '@/lib/validation'
import { parseQueryParam } from '@/lib/crud-helper'
import supabaseAdmin from '@/lib/supabase-admin'

export const GET = withAuth(async ({ request }) => {
  const jenisPewarna = parseQueryParam(request, 'jenis_pewarna')
  const motifId = parseQueryParam(request, 'motif_id')
  const lebarRaw = parseQueryParam(request, 'lebar')

  // ===== Validasi query params =====
  if (!jenisPewarna || !isInEnum(jenisPewarna, ['sintetis', 'alami'])) {
    return errorResponse(
      'Parameter jenis_pewarna harus sintetis atau alami',
      400
    )
  }
  if (!motifId || !isValidUUID(motifId)) {
    return errorResponse('Parameter motif_id harus UUID yang valid', 400)
  }
  const lebar = parseInt(lebarRaw)
  if (![70, 110].includes(lebar)) {
    return errorResponse('Parameter lebar harus 70 atau 110', 400)
  }

  // ===== Step 1: Cek harga spesifik untuk motif ini =====
  // Misal: Blok Lurik Sintetis 110cm = 60.000 (exception)
  const { data: specific } = await supabaseAdmin
    .from('daftar_harga')
    .select('harga_per_meter')
    .eq('jenis_pewarna', jenisPewarna)
    .eq('motif_id', motifId)
    .eq('lebar', lebar)
    .maybeSingle()

  if (specific) {
    return successResponse({
      harga_per_meter: Number(specific.harga_per_meter),
      source: 'motif_specific',
      jenis_pewarna: jenisPewarna,
      motif_id: motifId,
      lebar,
    })
  }

  // ===== Step 2: Fallback ke harga umum (motif_id NULL) =====
  // Misal: Sintetis 110cm = 57.500 (untuk motif manapun selain Blok Lurik)
  const { data: general } = await supabaseAdmin
    .from('daftar_harga')
    .select('harga_per_meter')
    .eq('jenis_pewarna', jenisPewarna)
    .is('motif_id', null)
    .eq('lebar', lebar)
    .maybeSingle()

  if (general) {
    return successResponse({
      harga_per_meter: Number(general.harga_per_meter),
      source: 'general',
      jenis_pewarna: jenisPewarna,
      motif_id: motifId,
      lebar,
    })
  }

  // ===== Step 3: Tidak ada harga sama sekali =====
  return successResponse({
    harga_per_meter: 0,
    source: 'not_found',
    jenis_pewarna: jenisPewarna,
    motif_id: motifId,
    lebar,
  })
})