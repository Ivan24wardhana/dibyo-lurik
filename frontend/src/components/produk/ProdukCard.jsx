// =====================================================
// ProdukCard.jsx
// Card produk untuk grid di ProdukPage.
//
// Conditional buttons by role (lewat prop showActions):
//   - showActions=false (Owner & CS):  [Detail]
//   - showActions=true  (Kepala Produksi):  [Detail] [Edit] [Hapus]
//
// Props:
//   - produk: object - data produk
//   - onDetailClick: fn(produkId)
//   - onEditClick: fn(produkId)         - kepala produksi only
//   - onDeleteClick: fn(produk)         - kepala produksi only
//   - showActions: boolean - default false
// =====================================================

import { Eye, Package, Pencil, Trash2 } from 'lucide-react'
import {
  formatJenisPewarna,
  formatStatusProduk,
} from '../../lib/formatters'

export default function ProdukCard({
  produk,
  onDetailClick,
  onEditClick,
  onDeleteClick,
  showActions = false,
}) {
  // Klik card = trigger Detail
  const handleCardClick = () => {
    onDetailClick?.(produk.id)
  }

  const handleDetail = (e) => {
    e.stopPropagation()
    onDetailClick?.(produk.id)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEditClick?.(produk.id)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDeleteClick?.(produk)
  }

  // Field dengan fallback
  const motifNama = produk.motif?.nama || produk.motif_nama || '-'
  const kategoriNama = produk.kategori?.nama || produk.kategori_nama || '-'
  const rakNama = produk.rak?.nama || produk.rak_nama || '-'
  const stok = produk.total_gulungan ?? produk.stok ?? 0
  const terjual = produk.total_terjual ?? produk.terjual ?? 0

  return (
    <div
      onClick={handleCardClick}
      className="
        bg-white rounded-[10px] overflow-hidden cursor-pointer
        shadow-[1px_4px_8px_0px_rgba(0,0,0,0.25)]
        hover:shadow-[2px_8px_16px_0px_rgba(0,0,0,0.3)]
        hover:-translate-y-1
        transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
      "
    >
      {/* Gambar */}
      <div className="px-6 pt-6">
        <div className="relative aspect-[16/7] rounded-[10px] overflow-hidden bg-gradient-to-br from-[#e3c2ac] to-[#a47352]">
          {produk.gambar_url ? (
            <img
              src={produk.gambar_url}
              alt={produk.kode_produk}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-16 h-16 text-white/40" strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>

      {/* Info Grid 3 kolom */}
      <div className="px-6 pt-5 pb-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <InfoItem label="Kode Produksi" value={produk.kode_produk} />
        <InfoItem
          label="Jenis Pewarna"
          value={formatJenisPewarna(produk.jenis_pewarna)}
        />
        <InfoItem label="Rak" value={rakNama} />

        <InfoItem label="Kategori" value={kategoriNama} />
        <InfoItem label="Stok" value={`${stok} gulungan`} />
        <div />

        <InfoItem label="Motif" value={motifNama} />
        <InfoItem label="Jumlah Terjual" value={`${terjual} gulungan`} />
        <div />
      </div>

      {/* Footer: Status badge + Action buttons */}
      <div className="px-6 pb-5 flex items-center justify-between flex-wrap gap-2">
        <span
          className="
            bg-[#76cbf9] text-white text-sm font-medium
            rounded-[15px] px-4 py-1
            inline-flex items-center justify-center
            min-w-[100px]
          "
        >
          {formatStatusProduk(produk.status)}
        </span>

        {/* Action buttons - cluster di kanan */}
        <div className="flex items-center gap-2">
          {/* Detail - selalu ada */}
          <ActionButton
            icon={Eye}
            label="Detail"
            color="#4cd0b1"
            hoverColor="#3bb89a"
            onClick={handleDetail}
          />

          {/* Edit & Hapus - hanya kepala produksi (showActions=true) */}
          {showActions && (
            <>
              <ActionButton
                icon={Pencil}
                label="Edit"
                color="#f0a864"
                hoverColor="#d8924f"
                onClick={handleEdit}
              />
              <ActionButton
                icon={Trash2}
                label="Hapus"
                color="#ff695e"
                hoverColor="#e54c41"
                onClick={handleDelete}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// Sub-component: action button kecil
// =====================================================
function ActionButton({ icon: Icon, label, color, hoverColor, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        text-white text-xs font-medium
        rounded-[10px] px-3 py-2
        inline-flex flex-col items-center gap-0.5
        active:scale-95
        transition-all duration-150 ease-out
      "
      style={{ backgroundColor: color }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverColor)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = color)}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  )
}

function InfoItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[#e3c2ac] text-[11px] font-medium leading-tight uppercase tracking-wide">
        {label}
      </p>
      <p className="text-[#a47352] text-sm font-medium leading-tight mt-1 truncate">
        {value}
      </p>
    </div>
  )
}