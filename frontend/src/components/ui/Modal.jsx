// =====================================================
// Modal.jsx
// Modal/dialog reusable dengan backdrop & ESC to close.
//
// Cara pakai:
//   const [open, setOpen] = useState(false)
//
//   <Modal open={open} onClose={() => setOpen(false)} title="Edit Produk">
//     <p>Konten modal di sini</p>
//   </Modal>
//
//   // Dengan footer custom:
//   <Modal
//     open={open}
//     onClose={...}
//     title="Konfirmasi"
//     footer={<Button onClick={handleSave}>Simpan</Button>}
//     size="lg"
//   >
//     ...
//   </Modal>
// =====================================================

import { useEffect } from 'react'
import { X } from 'lucide-react'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  showCloseButton = true,
}) {
  // ESC to close
  useEffect(() => {
    if (!open) return

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleEsc)

    // Prevent body scroll saat modal open
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizeClass = SIZES[size] || SIZES.md

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => closeOnBackdrop && onClose?.()}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal content - stop propagation supaya click di dalam tidak close */}
      <div
        className={`relative w-full ${sizeClass} bg-white rounded-xl shadow-2xl max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            {title ? (
              <h3 className="text-lg font-semibold text-[#a47352]">{title}</h3>
            ) : (
              <div />
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
