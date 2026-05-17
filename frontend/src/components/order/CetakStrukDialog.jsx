// =====================================================
// CetakStrukDialog.jsx
// Popup "Pesanan Berhasil di Buat - Apakah Anda ingin mencetak struk?"
// Match Figma 1310:18489.
//
// Layout:
//   - Icon thumbs up (hijau) di atas
//   - Title "Pesanan Berhasil di Buat"
//   - Box coklat muda: "Apakah Anda ingin mencetak struk?"
//   - 2 button: [Tidak] [Ya, Cetak Struk]
//
// Props:
//   - open
//   - onClose - klik Tidak (skip cetak)
//   - onCetak - klik Ya (proceed cetak)
// =====================================================

import { createPortal } from 'react-dom'
import { ThumbsUp, Receipt } from 'lucide-react'

export default function CetakStrukDialog({ open, onClose, onCetak }) {
  if (typeof window === 'undefined' || !open) return null

  return createPortal(
    <>
      {/* Backdrop coklat blur */}
      <div
        className="fixed inset-0 z-[9998] bg-[rgba(174,131,78,0.53)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]
          bg-white rounded-[20px]
          shadow-[0_4px_4px_rgba(0,0,0,0.25)]
          w-[90vw] max-w-[566px]
          p-8
          animate-[scale-in_0.2s_ease-out]
        "
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes scale-in {
            from { transform: translate(-50%, -50%) scale(0.85); opacity: 0; }
            to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          }
        `}</style>

        {/* Icon thumbs up - hijau */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-[#91b960]/15 flex items-center justify-center">
            <ThumbsUp className="w-10 h-10 text-[#91b960]" strokeWidth={2} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-[#a47352] text-2xl font-medium text-center mb-4">
          Pesanan Berhasil di Buat
        </h2>

        {/* Question box */}
        <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] py-5 px-4 mb-6">
          <p className="text-[#a47352] text-base font-medium text-center">
            Apakah Anda ingin mencetak struk?
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="
              flex-1 bg-[#a47352] hover:bg-[#8d6044]
              text-white text-lg font-medium
              rounded-[10px] py-3
              active:scale-[0.97] transition-all
            "
          >
            Tidak
          </button>
          <button
            type="button"
            onClick={onCetak}
            className="
              flex-1 bg-[#a47352] hover:bg-[#8d6044]
              text-white text-lg font-medium
              rounded-[10px] py-3
              inline-flex items-center justify-center gap-2
              active:scale-[0.97] transition-all
            "
          >
            <Receipt className="w-5 h-5" />
            Ya, Cetak Struk
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}