// =====================================================
// Loading.jsx
// Komponen loading untuk berbagai situasi.
//
// Variants:
//   - inline   (default): spinner kecil + text inline
//   - centered: spinner di tengah container
//   - fullscreen: overlay seluruh layar
//
// Cara pakai:
//   <Loading />                                   → inline
//   <Loading variant="centered" message="Memuat..." />
//   <Loading variant="fullscreen" />              → overlay
// =====================================================

import { Loader2 } from 'lucide-react'

export default function Loading({
  variant = 'centered',
  message = 'Memuat...',
  size = 'md',
}) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  const iconClass = sizeClasses[size] || sizeClasses.md

  // FULLSCREEN - overlay
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
        <Loader2 className={`${iconClass} text-[#a47352] animate-spin`} />
        {message && (
          <p className="mt-4 text-sm text-[#a47352] font-medium">{message}</p>
        )}
      </div>
    )
  }

  // CENTERED - di tengah container parent
  if (variant === 'centered') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className={`${iconClass} text-[#a47352] animate-spin`} />
        {message && (
          <p className="mt-3 text-sm text-[#a47352] font-medium">{message}</p>
        )}
      </div>
    )
  }

  // INLINE - default, kecil, sebelah text
  return (
    <span className="inline-flex items-center gap-2 text-[#a47352]">
      <Loader2 className={`${iconClass} animate-spin`} />
      {message && <span className="text-sm font-medium">{message}</span>}
    </span>
  )
}
