// =====================================================
// RakGroupCard.jsx
// Card untuk 1 rak group, berisi tabel daftar gulungan.
//
// Layout match Figma:
//   ┌──────────────────────────────────────────────────────┐
//   │  Rak A                                               │  ← header
//   │  ┌────────────────────────────────────────────────┐  │
//   │  │ No │ Gambar │ Kode │ Motif │ Pewarna │ Sisa  │  │  ← table header bg coklat
//   │  ├────┼────────┼──────┼───────┼─────────┼───────┤  │
//   │  │ 1. │ [img]  │ AKL- │ ...   │ Sintetis│ 14 m  │  │  ← row
//   │  │ 2. │ [img]  │ ...  │ ...   │ ...     │ 24 m  │  │
//   │  └────────────────────────────────────────────────┘  │
//   │                                  Total : 38 Meter    │  ← footer
//   └──────────────────────────────────────────────────────┘
//
// Props:
//   - rak: { rak_id, rak_nama, items: [...gulungan], total: number }
// =====================================================

import { Package } from 'lucide-react'
import { formatMeter, formatJenisPewarna } from '../../lib/formatters'

export default function RakGroupCard({ rak }) {
  const { rak_nama, items = [], total = 0 } = rak

  return (
    <div className="bg-[rgba(227,194,172,0.35)] rounded-[20px] p-5 mb-6">
      {/* ===== Header Rak ===== */}
      <p className="text-[#a47352] text-xl font-medium mb-4 px-2">
        {rak_nama}
      </p>

      {/* ===== Tabel Container ===== */}
      <div className="rounded-[10px] overflow-hidden">
        {/* Header Tabel - bg coklat solid */}
        <div className="bg-[#a47352] text-white grid grid-cols-12 px-4 py-4 text-base font-medium">
          <div className="col-span-1 text-center">No.</div>
          <div className="col-span-2 text-center">Gambar</div>
          <div className="col-span-2 text-center">Kode Produk</div>
          <div className="col-span-3 text-center">Motif</div>
          <div className="col-span-2 text-center">Jenis Pewarna</div>
          <div className="col-span-2 text-center">Panjang Sisa</div>
        </div>

        {/* Body Rows */}
        {items.length === 0 ? (
          <div className="bg-[rgba(227,194,172,0.5)] py-12 text-center text-[#a47352]/60 text-sm">
            Belum ada gulungan di rak ini
          </div>
        ) : (
          <div className="space-y-2 mt-3">
            {items.map((g, idx) => (
              <GulunganRow key={g.id} gulungan={g} index={idx + 1} />
            ))}
          </div>
        )}
      </div>

      {/* ===== Footer Total ===== */}
      <div className="flex justify-end mt-4 pr-2">
        <p className="text-[#a47352] text-base font-medium">
          Total : <span className="font-semibold">{formatMeter(total)}</span>
        </p>
      </div>
    </div>
  )
}

// =====================================================
// Row 1 gulungan
// =====================================================
function GulunganRow({ gulungan, index }) {
  const produk = gulungan.produk || {}
  const motifNama = gulungan.motif_nama || produk.motif?.nama || produk.motif_nama || '-'
  const kodeProduk = produk.kode_produk || gulungan.kode_produk || '-'
  const jenisPewarna = produk.jenis_pewarna || gulungan.jenis_pewarna
  const gambarUrl = produk.gambar_url || gulungan.gambar_url

  return (
    <div
      className="
        bg-[rgba(227,194,172,0.5)] border border-[#a47352]
        rounded-[10px] grid grid-cols-12 px-4 py-3
        items-center text-[#a47352] text-sm
        hover:bg-[rgba(227,194,172,0.7)]
        transition-colors duration-150
      "
    >
      {/* No */}
      <div className="col-span-1 text-center font-medium">
        {index}.
      </div>

      {/* Gambar */}
      <div className="col-span-2 flex justify-center">
        <div className="w-[100px] h-[70px] rounded-[8px] overflow-hidden bg-gradient-to-br from-[#e3c2ac] to-[#a47352] flex-shrink-0">
          {gambarUrl ? (
            <img
              src={gambarUrl}
              alt={kodeProduk}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-7 h-7 text-white/40" strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>

      {/* Kode Produk */}
      <div className="col-span-2 text-center font-medium truncate">
        {kodeProduk}
      </div>

      {/* Motif */}
      <div className="col-span-3 text-center truncate">
        {motifNama}
      </div>

      {/* Jenis Pewarna */}
      <div className="col-span-2 text-center">
        {formatJenisPewarna(jenisPewarna)}
      </div>

      {/* Panjang Sisa */}
      <div className="col-span-2 text-center font-medium">
        {formatMeter(gulungan.panjang_sisa)}
      </div>
    </div>
  )
}