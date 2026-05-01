import { useState } from 'react'
import Modal from '../ui/Modal'

/**
 * ExportPdfModal
 * Popup konfirmasi export PDF — reusable untuk:
 * - Gulungan 70cm / 110cm (Figma 130:224, 130:233)
 * - Laporan Order, PO Reguler, PO Custom (130:344, 130:377)
 *
 * Props:
 * - title: "Daftar Gulungan lebar 70cm" dll
 * - onExport: function async yang dipanggil saat klik Unduh
 * - onPrint: optional, function untuk print langsung
 */
export default function ExportPdfModal({ isOpen, onClose, title, onExport, onPrint }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      await onExport?.()
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)
    } catch (err) {
      alert('Gagal mengunduh: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title="Export PDF" size="sm">
      <div className="flex flex-col items-center text-center py-4">
        {success ? (
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-4 animate-pulse">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-emerald-600">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-[#a47352] flex items-center justify-center mb-4 shadow-lg">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <text x="12" y="17" textAnchor="middle" fontSize="4.5" fontWeight="700" fill="currentColor">PDF</text>
            </svg>
          </div>
        )}

        <h3 className="text-lg font-bold text-[#4a260f] mb-1">
          {success ? 'Berhasil diunduh!' : title}
        </h3>
        <p className="text-sm text-[#a47352]/80 mb-5">
          {success
            ? 'File PDF telah tersimpan di perangkat kamu'
            : 'File akan diunduh dalam format PDF'}
        </p>

        {!success && (
          <div className="w-full space-y-2">
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full h-11 rounded-xl font-semibold text-sm transition-all hover:shadow-md active:scale-[0.98] bg-[#a47352] hover:bg-[#8b5e3c] text-white disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mengunduh...
                </span>
              ) : (
                <>
                  <svg className="inline-block mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Unduh Sekarang
                </>
              )}
            </button>
            {onPrint && (
              <button
                onClick={onPrint}
                disabled={loading}
                className="w-full h-11 rounded-xl font-semibold text-sm transition-colors hover:bg-amber-50 bg-white text-[#8b5e3c] border-2 border-[#caa179]/50"
              >
                <svg className="inline-block mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6v-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Cetak Langsung
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
