// =====================================================
// Formatcurrency.js (DEPRECATED — typo capital F)
// File ini cuma re-export ke formatters.js untuk
// backwards compatibility dengan import yang sudah ada.
//
// JANGAN tambah function baru di sini.
// Untuk kode baru, import langsung dari './formatters':
//   import { formatRupiah, formatTanggalID } from '@/lib/formatters'
// =====================================================

export {
  formatRupiah,
  formatRupiahShort,
  formatNumberID,
  formatMeter,
  formatTanggalID,
  formatTanggalLong,
  formatDateTimeID,
  formatRelativeTime,
  formatStatusOrder,
  formatStatusPembayaran,
  formatMetodePembayaran,
  formatJenisPewarna,
  formatStatusProduk,
  formatLebar,
  formatPersen,
  truncate,
  capitalize,
} from './formatters'