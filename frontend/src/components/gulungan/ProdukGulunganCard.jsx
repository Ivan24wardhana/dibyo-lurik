// =====================================================
// ProdukGulunganCard.jsx
// Card per produk untuk halaman Master Gulungan.
// Match Figma node 592:3385.
//
// Layout:
//   Header (always visible):
//     [Gambar 50x50] Kode Produksi: AKLBL-001 [▼]   [+ Tambah Gulungan]
//
//   Body (visible saat expanded):
//     Tabel gulungan: No, Lebar, Panjang Total, Panjang Sisa, Rak, Harga, Aksi
//
// Props:
//   - group: { produk, gulungan } - hasil dari useGulunganMaster
//   - defaultExpanded: boolean
//   - onTambahGulungan: fn(produk)
//   - onEditGulungan: fn(gulunganId)
//   - onDeleteGulungan: fn(gulungan, produk)
// =====================================================

import { useState } from 'react'
import { ChevronDown, Plus, Pencil, Trash2, Package } from 'lucide-react'
import { Button } from '../ui'
import {
  formatRupiahShort,
  formatMeter,
} from '../../lib/formatters'
import { LEBAR_BADGE_COLOR } from '../../lib/constants'

export default function ProdukGulunganCard({
  group,
  defaultExpanded = true,
  onTambahGulungan,
  onEditGulungan,
  onDeleteGulungan,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const { produk, gulungan } = group
  const gulunganCount = gulungan?.length || 0

  return (
    <div className="bg-white border border-[#a47352]/30 rounded-[10px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* ===== Header (always visible) ===== */}
      <div className="bg-[rgba(227,194,172,0.35)] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        {/* Left: gambar + info produk + chevron */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="
            flex items-center gap-3 flex-1 min-w-0
            text-left hover:opacity-80
            active:scale-[0.99]
            transition-all duration-150
          "
        >
          {/* Gambar */}
          <div className="w-12 h-12 rounded-[8px] overflow-hidden bg-gradient-to-br from-[#e3c2ac] to-[#a47352] flex-shrink-0">
            {produk.gambar_url ? (
              <img
                src={produk.gambar_url}
                alt={produk.kode_produk}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white/40" strokeWidth={1.5} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[#a47352]/60 text-xs font-medium">
              Kode Produksi
            </p>
            <p className="text-[#a47352] text-base font-semibold truncate">
              {produk.kode_produk}
            </p>
          </div>

          {/* Count badge */}
          <span className="
            bg-white text-[#a47352] text-xs font-semibold
            rounded-full px-2.5 py-1 min-w-[28px]
            inline-flex items-center justify-center
            border border-[#a47352]/30
          ">
            {gulunganCount}
          </span>

          {/* Chevron */}
          <ChevronDown
            className={`
              w-5 h-5 text-[#a47352] flex-shrink-0
              transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
              ${expanded ? 'rotate-180' : 'rotate-0'}
            `}
            strokeWidth={2.2}
          />
        </button>

        {/* Right: Tambah button */}
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => onTambahGulungan?.(produk)}
        >
          Tambah Gulungan
        </Button>
      </div>

      {/* ===== Body (expandable) ===== */}
      <div
        className={`
          overflow-hidden
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        {gulunganCount === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[#a47352]/60 text-sm italic">
              Belum ada gulungan untuk produk ini
            </p>
          </div>
        ) : (
          <GulunganTable
            gulungan={gulungan}
            produk={produk}
            onEdit={onEditGulungan}
            onDelete={onDeleteGulungan}
          />
        )}
      </div>
    </div>
  )
}

// =====================================================
// Tabel gulungan dalam card
// =====================================================
function GulunganTable({ gulungan, produk, onEdit, onDelete }) {
  // Grid: No | Lebar | Panjang Total | Panjang Sisa | Rak | Harga | Aksi
  const gridCols = 'grid-cols-[60px_120px_minmax(120px,1fr)_minmax(120px,1fr)_minmax(80px,120px)_minmax(140px,1fr)_180px]'

  return (
    <div className="overflow-x-auto">
      {/* Header */}
      <div
        className={`bg-[#a47352] text-white grid ${gridCols} px-4 py-3 text-sm font-medium`}
      >
        <div className="text-center">No.</div>
        <div className="text-center">Lebar</div>
        <div className="text-center">Panjang Total</div>
        <div className="text-center">Panjang Sisa</div>
        <div className="text-center">Rak</div>
        <div className="text-center">Harga/m</div>
        <div className="text-center">Aksi</div>
      </div>

      {/* Rows */}
      {gulungan.map((g) => {
        const lebarColor = LEBAR_BADGE_COLOR?.[g.lebar] || '#798acc'
        const isHabis = !g.is_active

        return (
          <div
            key={g.id}
            className={`
              grid ${gridCols}
              px-4 py-3 items-center text-sm
              border-b border-[#a47352]/20 last:border-b-0
              ${isHabis ? 'bg-gray-50 opacity-60' : 'bg-white hover:bg-[#fdfaf6]'}
              transition-colors duration-150
            `}
          >
            <div className="text-center font-medium text-[#a47352]">
              {g.nomor_gulungan}.
            </div>

            <div className="flex justify-center">
              <span
                className="text-white text-xs font-medium px-3 py-1 rounded-[20px] inline-flex items-center justify-center min-w-[80px]"
                style={{ backgroundColor: lebarColor }}
              >
                {g.lebar} cm
              </span>
            </div>

            <div className="text-center text-[#a47352]">
              {formatMeter(g.panjang_total)}
            </div>

            <div className="text-center text-[#a47352] font-medium">
              {formatMeter(g.panjang_sisa)}
              {isHabis && (
                <span className="ml-1 text-xs text-red-500 font-medium">
                  (habis)
                </span>
              )}
            </div>

            <div className="text-center text-[#a47352] font-medium">
              {produk.rak?.nama || '-'}
            </div>

            <div className="text-center text-[#a47352] font-medium">
              {formatRupiahShort(g.harga_per_meter)}
            </div>

            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => onEdit?.(g.id)}
                className="
                  bg-[#f0a864] hover:bg-[#d8924f]
                  text-white rounded-[8px] px-3 py-1.5
                  inline-flex items-center gap-1
                  active:scale-95 transition-all duration-150
                "
                aria-label="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="text-xs">Edit</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(g, produk)}
                className="
                  bg-[#ff695e] hover:bg-[#e54c41]
                  text-white rounded-[8px] px-3 py-1.5
                  inline-flex items-center gap-1
                  active:scale-95 transition-all duration-150
                "
                aria-label="Hapus"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-xs">Hapus</span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}