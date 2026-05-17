// =====================================================
// UnduhRekapModal.jsx
// Modal "Export PDF" untuk download rekap gulungan.
// Match Figma node 951:1058 (70cm) & 951:1094 (110cm).
//
// Layout:
//   ┌─────────────────────────────┐
//   │  Export PDF             [X] │
//   │  ─────────────────────────  │
//   │                             │
//   │          [PDF Icon]         │
//   │                             │
//   │   Daftar Gulungan lebar Xcm │
//   │                             │
//   │  ┌───────────────────────┐  │
//   │  │   Unduh Sekarang      │  │
//   │  └───────────────────────┘  │
//   └─────────────────────────────┘
//
// Props:
//   - open: boolean
//   - onClose: fn
//   - lebar: 70 | 110
// =====================================================

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Modal, useToast } from '../ui'
import api, { downloadBlob, getErrorMessage } from '../../lib/api'

export default function UnduhRekapModal({ open, onClose, lebar }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      // Call backend dengan responseType blob (binary PDF)
      const response = await api.get(
        `/api/laporan/rekap-gulungan?lebar=${lebar}`,
        { responseType: 'blob' }
      )

      // Generate filename dengan tanggal hari ini
      const today = new Date()
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
      const filename = `rekap-gulungan-${lebar}cm-${dateStr}.pdf`

      // Trigger download
      downloadBlob(response.data, filename)

      toast.success('Laporan berhasil diunduh')
      onClose?.()
    } catch (error) {
      // Khusus untuk blob response, error message ada di blob (perlu di-parse)
      let errorMsg = getErrorMessage(error)
      if (error?.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text()
          const json = JSON.parse(text)
          errorMsg = json.error || errorMsg
        } catch {
          // ignore parse error, pakai default message
        }
      }
      toast.error('Gagal unduh laporan: ' + errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title="Export PDF"
      size="sm"
      closeOnBackdrop={!loading}
    >
      <div className="flex flex-col items-center py-4">
        {/* ===== Icon PDF ===== */}
        <div className="w-16 h-16 rounded-2xl bg-[rgba(227,194,172,0.35)] flex items-center justify-center mb-4 border border-[#a47352]/30">
          <FileText
            className="w-8 h-8 text-[#a47352]"
            strokeWidth={1.5}
          />
        </div>

        {/* ===== Label ===== */}
        <p className="text-[#a47352] text-base font-medium mb-6">
          Daftar Gulungan lebar {lebar}cm
        </p>

        {/* ===== Tombol Unduh ===== */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          className="
            w-full bg-[#a47352] text-white text-lg font-medium
            rounded-[10px] py-3
            hover:bg-[#8d6044] active:bg-[#5b2400]
            active:scale-[0.98]
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-all duration-150 ease-out
            flex items-center justify-center gap-2
          "
        >
          {loading ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeWidth="4"
                />
                <path
                  d="M4 12a8 8 0 018-8"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
              Mengunduh...
            </>
          ) : (
            'Unduh Sekarang'
          )}
        </button>
      </div>
    </Modal>
  )
}