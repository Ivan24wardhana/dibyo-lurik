// =====================================================
// Button.jsx
// Tombol reusable dengan variant & size.
//
// Variants:
//   - primary   (default): bg coklat #a47352
//   - secondary: outline coklat
//   - danger:    bg merah (untuk delete/destructive)
//   - ghost:     no bg, hover bg coklat tipis (untuk back/cancel)
//
// Sizes: sm, md (default), lg
//
// Props:
//   - variant, size, loading, disabled, icon (component lucide), iconPosition
//   - All props button standar (onClick, type, ...rest)
//
// Cara pakai:
//   <Button onClick={...}>Simpan</Button>
//   <Button variant="danger" icon={Trash2}>Hapus</Button>
//   <Button loading>Memuat...</Button>
// =====================================================

import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:
    'bg-[#a47352] text-white hover:bg-[#8d6044] active:bg-[#5b2400] disabled:bg-[#c19478] disabled:cursor-not-allowed',
  secondary:
    'bg-white text-[#a47352] border border-[#a47352] hover:bg-[#a47352]/10 active:bg-[#a47352]/20 disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-[#a47352] hover:bg-[#a47352]/10 active:bg-[#a47352]/20 disabled:opacity-50 disabled:cursor-not-allowed',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-base gap-2',
  lg: 'px-7 py-3 text-lg gap-2.5',
}

const ICON_SIZES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  className = '',
  ...rest
}) {
  const isDisabled = disabled || loading

  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors whitespace-nowrap'
  const variantClasses = VARIANTS[variant] || VARIANTS.primary
  const sizeClasses = SIZES[size] || SIZES.md
  const iconClass = ICON_SIZES[size] || ICON_SIZES.md

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className={`${iconClass} animate-spin`} />}
      {!loading && Icon && iconPosition === 'left' && <Icon className={iconClass} />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className={iconClass} />}
    </button>
  )
}
