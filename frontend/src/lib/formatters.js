// =====================================================
// formatters.js
// Helper untuk format data ke string yang user-friendly.
// Semua format pakai locale Indonesia (id-ID).
//
// KONVENSI NAMING:
//   - Nama BARU (recommended): formatTanggalID, formatRupiah, dll
//   - Nama LAMA (alias backward-compat): formatTanggal, formatHarga, dll
//
// Untuk kode baru, pakai nama BARU. Nama LAMA tetap di-export
// supaya file existing tidak break.
// =====================================================

import {
  STATUS_ORDER_LABEL,
  STATUS_PEMBAYARAN_LABEL,
  METODE_PEMBAYARAN_LABEL,
  JENIS_PEWARNA_LABEL,
  STATUS_PRODUK_LABEL,
} from './constants'

// =====================================================
// CURRENCY (Rupiah)
// =====================================================

/**
 * Format angka ke Rupiah lengkap dengan "Rp" dan 2 desimal.
 * Contoh: 50000 → "Rp 50.000,00"
 */
export function formatRupiah(value) {
  if (value == null || isNaN(value)) return 'Rp 0,00'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
  }).format(Number(value))
}

/**
 * Format angka ke Rupiah TANPA desimal (untuk display ringkas).
 * Contoh: 50000 → "Rp 50.000"
 */
export function formatRupiahShort(value) {
  if (value == null || isNaN(value)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value))
}

/**
 * Format angka tanpa "Rp" (untuk Y-axis chart, dll)
 * Contoh: 10000000 → "10.000.000,00"
 */
export function formatNumberID(value) {
  if (value == null || isNaN(value)) return '0,00'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
  }).format(Number(value))
}

/**
 * Format meter (untuk panjang kain).
 * 30 → "30 m" | 30.5 → "30,5 m"
 */
export function formatMeter(value) {
  if (value == null || value === '-') return '-'
  const num = Number(value)
  if (isNaN(num)) return '-'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num) + ' m'
}

// =====================================================
// DATE / TIME
// =====================================================

/**
 * Format tanggal ke "DD-MM-YYYY"
 * Contoh: "2026-04-28" → "28-04-2026"
 */
export function formatTanggalID(value) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return '-'

  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

/**
 * Format tanggal panjang: "28 April 2026"
 */
export function formatTanggalLong(value) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return '-'

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Format tanggal + jam: "28-04-2026, 14:30"
 */
export function formatDateTimeID(value) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return '-'

  const tgl = formatTanggalID(date)
  const hh = String(date.getHours()).padStart(2, '0')
  const mn = String(date.getMinutes()).padStart(2, '0')
  return `${tgl}, ${hh}:${mn}`
}

/**
 * Format relative time: "5 menit yang lalu", "2 jam yang lalu", dll
 */
export function formatRelativeTime(value) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return '-'

  const now = Date.now()
  const diff = now - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit yang lalu`
  if (hours < 24) return `${hours} jam yang lalu`
  if (days < 7) return `${days} hari yang lalu`
  return formatTanggalID(date)
}

/**
 * Format jam saja: "14:30"
 */
export function formatJam(value) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return '-'

  const hh = String(date.getHours()).padStart(2, '0')
  const mn = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mn}`
}

// =====================================================
// STATUS / ENUM LABELS
// =====================================================

/**
 * Konversi status order DB ke label tampilan
 * "belum_diproses" → "Belum diproses"
 */
export function formatStatusOrder(value) {
  return STATUS_ORDER_LABEL[value] || value || '-'
}

/**
 * "dp" → "DP", "lunas" → "Lunas"
 */
export function formatStatusPembayaran(value) {
  return STATUS_PEMBAYARAN_LABEL[value] || value || '-'
}

/**
 * "cash" → "Cash", "transfer" → "Transfer"
 */
export function formatMetodePembayaran(value) {
  return METODE_PEMBAYARAN_LABEL[value] || value || '-'
}

/**
 * "sintetis" → "Sintetis"
 */
export function formatJenisPewarna(value) {
  return JENIS_PEWARNA_LABEL[value] || value || '-'
}

/**
 * "ready" → "Tersedia", "sold" → "Habis"
 */
export function formatStatusProduk(value) {
  return STATUS_PRODUK_LABEL[value] || value || '-'
}

// =====================================================
// MISC
// =====================================================

/**
 * Format lebar (number → string dengan "cm")
 * 110 → "110 cm"
 */
export function formatLebar(value) {
  if (value == null) return '-'
  return `${value} cm`
}

/**
 * Truncate text dengan ellipsis kalau melebihi maxLength
 * "Hello World" → "Hello..."
 */
export function truncate(text, maxLength = 50) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Capitalize first letter setiap kata
 * "blok lurik" → "Blok Lurik"
 */
export function capitalize(text) {
  if (!text) return ''
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Format persen: 10 → "10%" | 0 → "0%"
 */
export function formatPersen(value) {
  if (value == null || isNaN(value)) return '0%'
  return `${Number(value)}%`
}

// =====================================================
// BACKWARD COMPATIBILITY ALIASES
// =====================================================
// Untuk file existing yang import nama lama.
// Alias ini sengaja didefinisikan terakhir setelah function utama.
//
// Untuk kode BARU, pakai nama lengkap (formatTanggalID, formatRupiah).
// Aliases di bawah cuma supaya file lama tidak break.
// =====================================================

// Date aliases
export const formatTanggal = formatTanggalID
export const formatTanggalLengkap = formatTanggalLong
export const formatTanggalWaktu = formatDateTimeID
export const formatDate = formatTanggalID
export const formatDateLong = formatTanggalLong
export const formatDateTime = formatDateTimeID

// Currency aliases
export const formatHarga = formatRupiah
export const formatHargaShort = formatRupiahShort
export const formatCurrency = formatRupiah
export const formatNumber = formatNumberID

// Status aliases
export const formatStatus = formatStatusOrder
export const formatPembayaran = formatStatusPembayaran
export const formatMetode = formatMetodePembayaran
export const formatPewarna = formatJenisPewarna