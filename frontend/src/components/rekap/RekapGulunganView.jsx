// =====================================================
// RekapGulunganView.jsx
// Shared view component untuk halaman Rekap Gulungan.
// Dipakai oleh RekapGulungan70Page & RekapGulungan110Page.
//
// Update: tombol "Generate" sekarang buka UnduhRekapModal
// untuk download PDF laporan rekap.
// =====================================================

import { useState } from 'react'
import { Layers, FileText } from 'lucide-react'
import useRekap from '../../hooks/useRekap'
import RakGroupCard from './RakGroupCard'
import UnduhRekapModal from './UnduhRekapModal'
import { Loading, EmptyState, Button } from '../ui'
import { formatMeter } from '../../lib/formatters'

export default function RekapGulunganView({ lebar }) {
  const { data, loading, error, refetch } = useRekap(lebar)
  const [unduhModalOpen, setUnduhModalOpen] = useState(false)

  return (
    <div>
      {/* ===== Top Bar: Total + Generate Button ===== */}
      <div className="bg-[rgba(227,194,172,0.35)] rounded-[20px] px-6 py-5 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[#a47352] text-xl lg:text-2xl font-medium">
          Total Keseluruhan :{' '}
          <span className="font-semibold">
            {formatMeter(data.totalAll)}
          </span>
        </p>

        <Button
          variant="primary"
          icon={FileText}
          onClick={() => setUnduhModalOpen(true)}
          disabled={loading || data.groups.length === 0}
        >
          Generate
        </Button>
      </div>

      {/* ===== Content ===== */}
      {loading ? (
        <Loading variant="centered" message="Memuat rekap..." />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-[10px] p-4">
          <p className="font-medium mb-1">Gagal memuat data</p>
          <p className="text-sm mb-3">{error}</p>
          <Button variant="secondary" onClick={refetch}>
            Coba Lagi
          </Button>
        </div>
      ) : data.groups.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Belum ada gulungan"
          message={`Belum ada gulungan dengan lebar ${lebar} cm di rak manapun`}
        />
      ) : (
        <div>
          {data.groups.map((rak) => (
            <RakGroupCard key={rak.rak_id} rak={rak} />
          ))}
        </div>
      )}

      {/* ===== Modal Unduh ===== */}
      <UnduhRekapModal
        open={unduhModalOpen}
        onClose={() => setUnduhModalOpen(false)}
        lebar={lebar}
      />
    </div>
  )
}