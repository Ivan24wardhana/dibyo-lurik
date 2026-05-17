// =====================================================
// Formatcurrency.js (DEPRECATED — typo capital F)
// File ini cuma re-export ke formatters.js untuk
// backwards compatibility dengan import yang sudah ada.
//
// JANGAN tambah function baru di sini.
// Untuk kode baru, import langsung dari './formatters':
//   import { formatRupiah, formatTanggalID } from '@/lib/formatters'
// =====================================================

// Re-export everything dari formatters (termasuk aliases)
export {
  // Currency
  formatRupiah,
  formatRupiahShort,
  formatNumberID,
  formatMeter,

  // Date / Time
  formatTanggalID,
  formatTanggalLong,
  formatDateTimeID,
  formatRelativeTime,
  formatJam,

  // Status / Enum
  formatStatusOrder,
  formatStatusPembayaran,
  formatMetodePembayaran,
  formatJenisPewarna,
  formatStatusProduk,

  // Misc
  formatLebar,
  formatPersen,
  truncate,
  capitalize,

  // Backward-compat aliases
  formatTanggal,
  formatTanggalLengkap,
  formatTanggalWaktu,
  formatDate,
  formatDateLong,
  formatDateTime,
  formatHarga,
  formatHargaShort,
  formatCurrency,
  formatNumber,
  formatStatus,
  formatPembayaran,
  formatMetode,
  formatPewarna,
} from './formatters'