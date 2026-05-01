// =====================================================
// Badge.jsx
// Komponen "pill" warna-warni yang dipakai di tabel.
// Bentuknya: kotak rounded dengan background warna + teks putih.
//
// Cara pakai:
//   <Badge color="#798acc">110 cm</Badge>
//   <Badge variant="lebar" value="110 cm" />
//   <Badge variant="jenis" value="Custom" />
// =====================================================

import {
  LEBAR_BADGE_COLOR,
  JENIS_PO_BADGE_COLOR,
  PEMBAYARAN_BADGE_COLOR,
  COLORS,
} from '../../lib/constants'

// Mapping variant → color resolver
const VARIANT_RESOLVER = {
  lebar: (value) => LEBAR_BADGE_COLOR[value] || COLORS.badgeBlue,
  jenis: (value) => JENIS_PO_BADGE_COLOR[value] || COLORS.badgeGray,
  pembayaran: (value) => PEMBAYARAN_BADGE_COLOR[value] || COLORS.badgeOrange,
}

/**
 * Props:
 * - children: teks badge (kalau pakai mode manual)
 * - color: warna background custom (override variant)
 * - variant: 'lebar' | 'jenis' | 'pembayaran' (auto-pilih warna)
 * - value: nilai yang dipakai variant untuk pilih warna
 * - size: 'sm' (kecil, untuk pembayaran) | 'md' (default)
 */
export default function Badge({ children, color, variant, value, size = 'md' }) {
  // Resolve warna: priority = color prop > variant + value > default abu
  let bgColor = color
  if (!bgColor && variant && value !== undefined) {
    const resolver = VARIANT_RESOLVER[variant]
    if (resolver) bgColor = resolver(value)
  }
  if (!bgColor) bgColor = COLORS.badgeGray

  // Konten = children kalau ada, kalau tidak pakai value
  const content = children ?? value

  const sizeClasses = size === 'sm'
    ? 'px-3 py-1 text-[14px] rounded-[10px]' // untuk DP/Lunas (kotak kecil)
    : 'px-4 py-1 text-[15px] rounded-[20px]' // untuk lebar/jenis (pill bulat)

  return (
    <span
      className={`inline-flex items-center justify-center font-medium text-white whitespace-nowrap ${sizeClasses}`}
      style={{ backgroundColor: bgColor }}
    >
      {content}
    </span>
  )
}