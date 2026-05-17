// =====================================================
// ConfirmHapusGambarModal.jsx
// Popup konfirmasi hapus gambar match Figma 951:1158.
//
// Layout:
//   ┌─────────────────────────┐
//   │       [Trash Icon]      │
//   │                         │
//   │  Apakah Anda Yakin      │
//   │  Ingin Menghapus        │
//   │  gambar ini             │
//   │                         │
//   │  [Batal]   [Ya, Hapus]  │
//   └─────────────────────────┘
//
// Props:
//   - open: boolean
//   - onClose: fn - klik Batal / backdrop / ESC
//   - onConfirm: fn - klik Ya, Hapus
// =====================================================

import { useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function ConfirmHapusGambarModal({ open, onClose, onConfirm }) {
  // ESC key listener
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (typeof window === 'undefined') return null
  if (!open) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="
          fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm
          animate-fadeIn
        "
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]
          bg-white rounded-[20px]
          shadow-[0px_4px_20px_0px_rgba(0,0,0,0.25)]
          px-6 py-5
          flex flex-col items-center gap-3
          w-[260px]
          animate-modalPop
        "
      >
        {/* Icon Trash */}
        <Trash2 className="w-7 h-7 text-[#a47352]" strokeWidth={2} />

        {/* Pesan */}
        <p className="text-[#a47352] text-sm font-medium text-center leading-snug">
          Apakah Anda Yakin Ingin
          <br />
          Menghapus gambar ini
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="
              bg-[#a47352] hover:bg-[#8d6044] active:bg-[#5b2400]
              text-white text-xs font-medium
              rounded-[5px] px-4 py-1.5
              active:scale-[0.97]
              transition-all duration-150
            "
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="
              bg-[#a47352] hover:bg-[#8d6044] active:bg-[#5b2400]
              text-white text-xs font-medium
              rounded-[5px] px-4 py-1.5
              active:scale-[0.97]
              transition-all duration-150
            "
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}