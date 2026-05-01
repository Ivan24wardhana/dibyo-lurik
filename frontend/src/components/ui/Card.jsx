// =====================================================
// Card.jsx
// Wrapper container reusable.
//
// Variants:
//   - default: white bg + gray border
//   - accent:  bg coklat-soft + border coklat (style tabel produk terlaris)
//
// Cara pakai:
//   <Card>
//     <p>Konten dalam card</p>
//   </Card>
//
//   <Card variant="accent" title="Produk Terlaris">
//     ...
//   </Card>
// =====================================================

const VARIANTS = {
  default: 'bg-white border border-gray-200',
  accent:
    'border border-[#5b2400] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]',
  primary:
    'border border-[#a47352]',
}

const ACCENT_BG = '#e3c2ac'
const PRIMARY_BG = 'rgba(227, 194, 172, 0.35)'

export default function Card({
  children,
  variant = 'default',
  title,
  actions,
  className = '',
  bodyClassName = '',
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.default

  // Background style berdasarkan variant
  const bgStyle =
    variant === 'accent'
      ? { backgroundColor: ACCENT_BG }
      : variant === 'primary'
      ? { backgroundColor: PRIMARY_BG }
      : {}

  return (
    <div
      className={`rounded-[10px] overflow-hidden ${variantClass} ${className}`}
      style={bgStyle}
    >
      {/* Header (kalau ada title atau actions) */}
      {(title || actions) && (
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          {title && (
            <h3 className="text-[#a47352] text-[22px] font-medium">{title}</h3>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Body */}
      <div className={`px-6 py-4 ${bodyClassName}`}>{children}</div>
    </div>
  )
}
