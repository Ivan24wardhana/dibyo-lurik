// =====================================================
// preorder-helper.js
// Helper khusus untuk Pre-Order operations.
//
// Tujuan:
// - Lookup harga otomatis (sama logic dengan /api/harga/lookup)
// - Hitung subtotal item (panjang × jumlah × harga)
// - Recalculate total_harga PO setelah items berubah
// - Action handler untuk update status (start_produksi, dll)
// =====================================================

import supabaseAdmin from './supabase-admin'

/**
 * Lookup harga per meter dari daftar_harga
 *
 * Logic:
 *   1. Cari spesifik (jenis_pewarna + motif_id + lebar)
 *   2. Fallback ke umum (motif_id NULL)
 *   3. Return 0 kalau tidak ada
 *
 * @returns {Promise<number>} harga per meter
 */
export async function lookupHargaPerMeter(jenisPewarna, motifId, lebar) {
  // Step 1: harga spesifik motif
  const { data: specific } = await supabaseAdmin
    .from('daftar_harga')
    .select('harga_per_meter')
    .eq('jenis_pewarna', jenisPewarna)
    .eq('motif_id', motifId)
    .eq('lebar', lebar)
    .maybeSingle()

  if (specific) return Number(specific.harga_per_meter)

  // Step 2: harga umum
  const { data: general } = await supabaseAdmin
    .from('daftar_harga')
    .select('harga_per_meter')
    .eq('jenis_pewarna', jenisPewarna)
    .is('motif_id', null)
    .eq('lebar', lebar)
    .maybeSingle()

  if (general) return Number(general.harga_per_meter)

  // Step 3: tidak ada
  return 0
}

/**
 * Hitung subtotal 1 item PO reguler
 * Formula: panjang × jumlah × harga_per_meter
 */
export function calculateItemSubtotal(panjang, jumlah, hargaPerMeter) {
  return Number(panjang) * Number(jumlah) * Number(hargaPerMeter)
}

/**
 * Hitung total_harga PO reguler dari semua items + apply diskon
 *
 * Formula:
 *   subtotal_all = SUM(item.subtotal)
 *   total_harga = subtotal_all × (1 - diskon/100)
 *
 * @param {string} preOrderRegulerId - ID pre-order
 * @returns {Promise<{subtotal: number, total: number}>}
 */
export async function recalculateTotalPOR(preOrderRegulerId) {
  // Ambil semua items
  const { data: items, error: itemsErr } = await supabaseAdmin
    .from('item_pre_order_reguler')
    .select('subtotal')
    .eq('pre_order_reguler_id', preOrderRegulerId)

  if (itemsErr) throw new Error('Gagal hitung subtotal: ' + itemsErr.message)

  const subtotalAll = (items || []).reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  )

  // Ambil diskon dari header PO
  const { data: po } = await supabaseAdmin
    .from('pre_order_reguler')
    .select('diskon')
    .eq('id', preOrderRegulerId)
    .single()

  const diskon = Number(po?.diskon || 0)
  const total = subtotalAll * (1 - diskon / 100)

  // Update total_harga di header
  await supabaseAdmin
    .from('pre_order_reguler')
    .update({
      total_harga: total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', preOrderRegulerId)

  return { subtotal: subtotalAll, total }
}

/**
 * Validasi transisi status PO.
 *
 * Aturan:
 *   belum_diproses → sedang_diproses (start-produksi)
 *   sedang_diproses → selesai (finish-produksi)
 *   selesai → tidak boleh ke status lain (final state)
 *
 * @returns {string|null} pesan error kalau invalid, null kalau OK
 */
export function validateStatusTransition(currentStatus, targetStatus) {
  const validTransitions = {
    belum_diproses: ['sedang_diproses'],
    sedang_diproses: ['selesai'],
    selesai: [], // final state
  }

  const allowed = validTransitions[currentStatus] || []
  if (!allowed.includes(targetStatus)) {
    return `Tidak bisa mengubah status dari "${currentStatus}" ke "${targetStatus}"`
  }

  return null
}

/**
 * Action handler generic: update status PO.
 *
 * @param {object} options
 * @param {string} options.tableName - 'pre_order_reguler' atau 'pre_order_custom'
 * @param {string} options.id - ID PO
 * @param {string} options.targetStatus - status tujuan
 * @returns {Promise<{success: boolean, error?: string, data?: object}>}
 */
export async function updatePOStatus({ tableName, id, targetStatus }) {
  // Ambil status sekarang
  const { data: current, error: fetchErr } = await supabaseAdmin
    .from(tableName)
    .select('id, status')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr) return { success: false, error: fetchErr.message }
  if (!current) return { success: false, error: 'PO tidak ditemukan' }

  // Validasi transition
  const transitionError = validateStatusTransition(current.status, targetStatus)
  if (transitionError) return { success: false, error: transitionError }

  // Update
  const { data, error } = await supabaseAdmin
    .from(tableName)
    .update({
      status: targetStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  return { success: true, data }
}

/**
 * Action handler: tandai pembayaran lunas.
 *
 * Aturan: status_pembayaran 'dp' → 'lunas'.
 * Kalau sudah 'lunas', return error.
 */
export async function markPOPaid({ tableName, id }) {
  const { data: current, error: fetchErr } = await supabaseAdmin
    .from(tableName)
    .select('id, status_pembayaran, total_harga')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr) return { success: false, error: fetchErr.message }
  if (!current) return { success: false, error: 'PO tidak ditemukan' }

  if (current.status_pembayaran === 'lunas') {
    return { success: false, error: 'Pembayaran sudah lunas' }
  }

  // Update: status_pembayaran = lunas, total_dp = total_harga
  const { data, error } = await supabaseAdmin
    .from(tableName)
    .update({
      status_pembayaran: 'lunas',
      total_dp: current.total_harga,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  return { success: true, data }
}