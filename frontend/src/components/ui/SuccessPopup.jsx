// =====================================================
// SuccessPopup.jsx
// Popup sukses kecil dengan icon thumbs-up.
// Match Figma node 951:1159 + 1014:625 (pattern serupa).
//
// Pakai sebagai alternatif toast untuk feedback yang lebih
// "deliberate" - user lihat dan tahu action sukses.
//
// Auto-dismiss setelah duration (default 1500ms).
//
// Props:
//   - open: boolean
//   - onClose: fn - dipanggil saat auto-dismiss atau klik backdrop
//   - message: string - text yang ditampilkan
//   - duration: number - berapa ms sebelum auto-close (default 1500)
//   - icon: 'thumbs' | 'check' (default 'thumbs')
// =====================================================

import { useEffect } from 'react'
import { ThumbsUp, Check } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function SuccessPopup({
  open,
  onClose,
  message = 'Berhasil',
  duration = 1500,
  icon = 'thumbs',
}) {
  // Auto-dismiss setelah duration
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      onClose?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [open, duration, onClose])

  if (typeof window === 'undefined') return null
  if (!open) return null

  const Icon = icon === 'check' ? Check : ThumbsUp

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="
          fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm
          animate-fadeIn
        "
        onClick={onClose}
      />

      {/* Popup */}
      <div
        className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]
          bg-white rounded-[20px]
          shadow-[0px_4px_20px_0px_rgba(0,0,0,0.25)]
          px-8 py-6
          flex flex-col items-center gap-3
          min-w-[260px] max-w-[400px]
          animate-modalPop
        "
      >
        <Icon
          className="w-12 h-12 text-[#a47352]"
          strokeWidth={1.8}
        />
        <p className="text-[#a47352] text-base font-medium text-center leading-relaxed">
          {message}
        </p>
      </div>
    </>,
    document.body
  )
}