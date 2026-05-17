// =====================================================
// lib/pricelist.js
// Pricelist kain Dibyo Lurik.
// Dipakai di TambahGulunganModal + EditGulunganModal untuk auto-fill harga.
//
// PRICELIST:
//   Sintetis 70cm  : 38.500/m
//   Sintetis 110cm : 57.500/m
//   Alami 70cm     : 46.500/m
//   Alami 110cm    : 67.500/m
//   Blok Lurik Sintetis 110cm : 60.000/m  ← exception
// =====================================================

export const PRICELIST = {
  sintetis: { 70: 38500, 110: 57500 },
  alami:    { 70: 46500, 110: 67500 },
}

/**
 * Dapatkan harga default berdasarkan jenis pewarna, lebar, dan motif.
 * Cek exception Blok Lurik dulu, lalu fallback ke pricelist umum.
 *
 * @param {string} jenisPewarna - 'sintetis' | 'alami'
 * @param {number|string} lebar - 70 | 110
 * @param {string} motifNama - nama motif (untuk cek Blok Lurik)
 * @returns {number} harga per meter (0 kalau tidak ditemukan)
 */
export function getHargaDefault(jenisPewarna, lebar, motifNama = '') {
  const lebarNum = parseInt(lebar)
  const motifLower = (motifNama || '').toLowerCase()

  // Exception: Blok Lurik Sintetis 110cm = 60.000
  if (
    jenisPewarna === 'sintetis' &&
    lebarNum === 110 &&
    motifLower.includes('blok')
  ) {
    return 60000
  }

  return PRICELIST[jenisPewarna]?.[lebarNum] || 0
}