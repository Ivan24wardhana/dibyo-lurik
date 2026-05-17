// =====================================================
// POTable.jsx
// Tabel reusable untuk list PO (Reguler atau Custom).
// Match Figma node 377:3970.
// =====================================================

import { Eye } from 'lucide-react'
import { StatusProduksiBadge, StatusPembayaranBadge } from './StatusBadges'
import { formatRupiahShort } from '../../lib/formatters'

export default function POTable({
  data = [],
  onDetailClick,
  startNumber = 1,
  tipe = 'reguler',
}) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-[#a47352]/30">
      {/* Header */}
      <div className="bg-[#a47352] text-white grid grid-cols-[60px_140px_minmax(140px,1fr)_140px_180px_180px_160px_100px] px-4 py-4 text-base font-medium">
        <div className="text-center">No.</div>
        <div className="text-center">ID Pre-Order</div>
        <div className="text-center">Nama Pelanggan</div>
        <div className="text-center">Jumlah</div>
        <div className="text-center">Status Produksi</div>
        <div className="text-center">Status Pembayaran</div>
        <div className="text-center">Total Harga</div>
        <div className="text-center">Aksi</div>
      </div>

      {/* Rows */}
      {data.map((po, idx) => {
        // Hitung jumlah item
        let jumlah = 1
        if (tipe === 'reguler') {
          if (Array.isArray(po.items)) {
            jumlah = po.items.reduce((sum, it) => sum + (it.jumlah || 1), 0)
          } else if (po.total_items) {
            jumlah = po.total_items
          } else if (po.jumlah_items) {
            jumlah = po.jumlah_items
          }
        }

        const idDisplay = po.nomor_po || po.id?.slice(0, 8) || '-'

        return (
          <div
            key={po.id}
            className="
              bg-[#fdfdfd] grid grid-cols-[60px_140px_minmax(140px,1fr)_140px_180px_180px_160px_100px]
              px-4 py-4 items-center
              text-[#a47352] text-sm
              border-b border-[#a47352]/30 last:border-b-0
              hover:bg-[#fdfaf6]
              transition-colors duration-150
            "
          >
            <div className="text-center font-medium">{startNumber + idx}.</div>
            <div className="text-center font-medium truncate" title={idDisplay}>
              {idDisplay}
            </div>
            <div className="text-center truncate" title={po.nama_customer || '-'}>
              {po.nama_customer || '-'}
            </div>
            <div className="text-center">{jumlah}</div>
            <div className="flex justify-center">
              <StatusProduksiBadge status={po.status} />
            </div>
            <div className="flex justify-center">
              <StatusPembayaranBadge status={po.status_pembayaran} />
            </div>
            <div className="text-center font-medium">
              {formatRupiahShort(po.total_harga)}
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => onDetailClick?.(po.id)}
                className="
                  bg-[#4cd0b1] text-white text-sm font-medium
                  rounded-[10px] px-3 py-2
                  inline-flex items-center gap-1.5
                  hover:bg-[#3bb89a]
                  active:scale-95
                  transition-all duration-150 ease-out
                "
              >
                <Eye className="w-4 h-4" />
                Detail
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}