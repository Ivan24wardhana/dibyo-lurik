// =====================================================
// ProdukOrderCard.jsx
// Card produk untuk halaman Order (Customer Service).
// Beda dengan ProdukCard utama: tidak ada Detail/Edit/Hapus,
// diganti dengan dua tombol: "+ Pre-Order Reguler" + "Beli".
//
// Props:
//   - produk: { id, kode_produk, gambar_url, jenis_pewarna, kategori, motif, rak, stok, terjual, status }
//   - onBeli: fn(produk) - klik tombol Beli → buka popup pilih gulungan
//   - onPOReguler: fn(produk) - klik tombol + Pre-Order Reguler
//
// Color palette (konsisten dgn Figma):
//   - Status Ready/Tersedia: #76CBF9
//   - Status Sold/Habis:      #FF695E
//   - Tombol Beli:            #F0A864
//   - Tombol +PO Reguler:     #4CD0B1
// =====================================================

import { Package, ShoppingCart, Plus } from 'lucide-react'

export default function ProdukOrderCard({ produk, onBeli, onPOReguler }) {
  if (!produk) return null

  const isSold = produk.status === 'sold' || (produk.stok || 0) === 0
  const formatJenis = (j) => (j === 'sintetis' ? 'Sintetis' : 'Alami')

  return (
    <div
      className="
        bg-white rounded-[10px] overflow-hidden
        shadow-[1px_4px_8px_0px_rgba(0,0,0,0.15)]
        hover:shadow-[2px_8px_16px_0px_rgba(0,0,0,0.2)]
        hover:-translate-y-0.5
        transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
        flex flex-col
      "
      data-produk-id={produk.id}
    >
      {/* Gambar produk */}
      <div className="px-5 pt-5">
        <div className="relative aspect-[16/7] rounded-[10px] overflow-hidden bg-gradient-to-br from-[#e3c2ac] to-[#a47352]">
          {produk.gambar_url ? (
            <img
              src={produk.gambar_url}
              alt={produk.kode_produk}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/40">
              <Package className="w-12 h-12" strokeWidth={1.5} />
              <p className="text-xs mt-2">Tidak ada gambar</p>
            </div>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="px-5 pt-4 pb-3 grid grid-cols-3 gap-x-3 gap-y-3 flex-1">
        <InfoItem label="Kode Produksi" value={produk.kode_produk} />
        <InfoItem label="Jenis Pewarna" value={formatJenis(produk.jenis_pewarna)} />
        <InfoItem label="Rak" value={produk.rak?.nama || '-'} />
        <InfoItem label="Kategori" value={produk.kategori?.nama || '-'} />
        <InfoItem label="Stok" value={`${produk.stok || 0} gulungan`} />
        <div /> {/* spacer kolom 3 */}
        <InfoItem label="Motif" value={produk.motif?.nama || '-'} />
        <InfoItem label="Jumlah Terjual" value={`${produk.terjual || 0} gulungan`} />
      </div>

      {/* Bottom bar: status badge + action buttons */}
      <div className="px-5 pb-5 pt-2 flex items-center justify-between flex-wrap gap-2">
        {/* Status badge */}
        <span
          className="
            text-white text-xs font-medium
            rounded-[15px] px-4 py-1.5
            inline-flex items-center justify-center
            min-w-[80px]
          "
          style={{ backgroundColor: isSold ? '#FF695E' : '#76CBF9' }}
        >
          {isSold ? 'Habis' : 'Ready'}
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Pre-Order Reguler - green mint */}
          <button
            type="button"
            onClick={() => onPOReguler?.(produk)}
            className="
              text-white text-xs font-medium
              rounded-[8px] px-3 py-2
              inline-flex items-center gap-1.5
              hover:brightness-90
              active:scale-95
              transition-all duration-150
            "
            style={{ backgroundColor: '#4CD0B1' }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            Pre-Order Reguler
          </button>

          {/* Beli - orange */}
          <button
            type="button"
            onClick={() => onBeli?.(produk)}
            disabled={isSold}
            className="
              text-white text-xs font-medium
              rounded-[8px] px-4 py-2
              inline-flex items-center gap-1.5
              hover:brightness-90
              active:scale-95
              disabled:bg-gray-300 disabled:cursor-not-allowed disabled:brightness-100
              transition-all duration-150
            "
            style={{ backgroundColor: isSold ? '#cccccc' : '#F0A864' }}
          >
            <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2.2} />
            Beli
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[#e3c2ac] text-[10px] font-medium leading-tight uppercase tracking-wide">
        {label}
      </p>
      <p className="text-[#a47352] text-sm font-medium leading-tight mt-1 truncate">
        {value || '-'}
      </p>
    </div>
  )
}