import { useState } from 'react'
import api from '../../lib/api'
import useRekap from '../../hooks/useRekap'
import RekapTable from '../../components/rekap/RekapTable'
import DetailGulunganModal from '../../components/rekap/DetailGulunganModal'
import ExportPdfModal from '../../components/rekap/ExportPdfModal'
import { formatMeter } from '../../lib/formatters'

/**
 * RekapGulunganPage
 * Halaman rekap gulungan reusable. Di-wrap oleh RekapGulungan70Page dan RekapGulungan110Page.
 * Figma node 20:1152, 95:38 (70cm) dan 95:113 (110cm).
 */
export default function RekapGulunganPage({ lebar }) {
  const { data, totalSisa, loading } = useRekap(lebar)
  const [selected, setSelected] = useState(null)
  const [showExport, setShowExport] = useState(false)

  const handleExport = async () => {
    try {
      const res = await api.get(`/api/laporan/export?type=gulungan&lebar=${lebar}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `rekap-gulungan-${lebar}cm.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      throw new Error('Server belum tersedia')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border-2 border-[#caa179]/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#caa179]/30">
          <h2 className="text-xl font-bold text-[#4a260f]">Daftar Gulungan {lebar} cm</h2>
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
            <RekapTable data={data} onLihat={setSelected} />
          )}

          <div className="mt-5 pt-4 border-t border-[#caa179]/30 flex items-center justify-between">
            <span className="text-sm text-[#a47352]">
              Total: <strong>{data.length}</strong> gulungan
            </span>
            <span className="text-lg font-bold text-[#4a260f]">
              Total Sisa: {formatMeter(totalSisa || data.reduce((sum, g) => sum + Number(g.panjang_sisa || 0), 0))}
            </span>
          </div>
        </div>
      </div>

      <DetailGulunganModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        gulungan={selected}
        lebar={lebar}
      />

      <ExportPdfModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        title={`Daftar Gulungan lebar ${lebar} cm`}
        onExport={handleExport}
        onPrint={() => window.print()}
      />
    </div>
  )
}
