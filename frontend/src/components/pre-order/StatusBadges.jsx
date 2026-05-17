// =====================================================
// StatusBadges.jsx
// 2 badge reusable untuk PO:
//   - StatusProduksiBadge: pill (rounded-20) - merah/kuning/hijau
//   - StatusPembayaranBadge: rounded-10 - orange/orange tua
// =====================================================

import {
  STATUS_PRODUKSI_BADGE_COLOR,
  STATUS_PRODUKSI_LABEL,
  PEMBAYARAN_BADGE_COLOR,
  STATUS_PEMBAYARAN_LABEL,
} from '../../lib/constants'

export function StatusProduksiBadge({ status, className = '' }) {
  const bgColor = STATUS_PRODUKSI_BADGE_COLOR[status] || '#999999'
  const label = STATUS_PRODUKSI_LABEL[status] || status || '-'

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-3 py-1.5 rounded-[20px]
        text-white text-sm font-medium
        whitespace-nowrap
        ${className}
      `}
      style={{ backgroundColor: bgColor }}
    >
      {label}
    </span>
  )
}

export function StatusPembayaranBadge({ status, className = '' }) {
  const bgColor = PEMBAYARAN_BADGE_COLOR[status] || '#999999'
  const label = STATUS_PEMBAYARAN_LABEL[status] || status || '-'

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-4 py-1.5 rounded-[10px]
        text-white text-sm font-medium
        whitespace-nowrap
        ${className}
      `}
      style={{ backgroundColor: bgColor }}
    >
      {label}
    </span>
  )
}