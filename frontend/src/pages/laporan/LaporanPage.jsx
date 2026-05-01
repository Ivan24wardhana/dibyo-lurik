import { useState } from 'react'
import api from '../../lib/api'
import useLaporan from '../../hooks/useLaporan'
import LaporanTable from '../../components/laporan/LaporanTable'
import DetailOrderModal from '../../components/laporan/DetailOrderModal'
import DetailPORModal from '../../components/laporan/DetailPORModal'
import DetailPOCModal from '../../components/laporan/DetailPOCModal'
import ExportPdfModal from '../../components/rekap/ExportPdfModal'

/**
 * LaporanPage
 * Halaman laporan reusable untuk 3 jenis: order, po-reguler, po-custom.
 * Pilih komponen modal yang tepat berdasarkan jenis.
 */
export default function LaporanPage({ jenis, title, listTitle }) {
  const { data, loading } = useLaporan(jenis)
  const [selected, setSelected] = useState(null)
  const [showExport, setShowExport] = useState(false)

  const handleExport = async () => {
    try {
      const res = await api.get(`/api/laporan/export?type=${jenis}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `laporan-${jenis}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      throw new Error('Server belum tersedia')
    }
  }

  const DetailModal = jenis === 'order' ? DetailOrderModal : jenis === 'po-reguler' ? DetailPORModal : DetailPOCModal
  const modalProp = jenis === 'order' ? 'order' : 'po'

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border-2 border-[#caa179]/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#caa179]/30">
          <h2 className="text-xl font-bold text-[#4a260f]">{listTitle}</h2>
          <button
            onClick={() => setShowExport(true)}
            disabled={data.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#a47352] text-white font-semibold text-sm hover:bg-[#8b5e3c] transition-colors disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-amber-50 rounded-lg" />
              ))}
            </div>
          ) : (
            <LaporanTable data={data} onLihat={setSelected} jenis={jenis} />
          )}

          {data.length > 0 && (
            <p className="text-xs text-center text-[#a47352]/70 mt-4">
              Total: <strong>{data.length}</strong> transaksi
            </p>
          )}
        </div>
      </div>

      <DetailModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        {...{ [modalProp]: selected }}
      />

      <ExportPdfModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        title={title}
        onExport={handleExport}
        onPrint={() => window.print()}
      />
    </div>
  )
}
