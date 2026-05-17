// =====================================================
// PilihGulunganModal.jsx
// Popup untuk memilih gulungan saat user klik "Beli" di OrderPage.
// Match Figma node 1354:191.
//
// Flow:
//   1. Modal open → fetch list gulungan untuk produk yg dipilih
//   2. User centang 1+ gulungan
//   3. Klik "Masukkan Keranjang"
//      → addItem(produk, [g1, g2, ...]) ke cartStore
//      → trigger flying animation (via callback)
//      → tutup modal
//
// Props:
//   - open: boolean
//   - onClose: fn
//   - produk: object produk yang dipilih
//   - onAddToCart: fn(produk, selectedGulungan, sourceElement)
//     → caller yang handle Zustand add + flying animation
// =====================================================

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Package, ShoppingCart, Check } from 'lucide-react'
import api, { getErrorMessage } from '../../lib/api'
import { useToast } from '../ui'

export default function PilihGulunganModal({ open, onClose, produk, onAddToCart }) {
  const toast = useToast()
  const [gulunganList, setGulunganList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const buttonRef = useRef(null)  // untuk anchor flying animation

  // Fetch gulungan produk saat modal open
  useEffect(() => {
    if (!open || !produk?.id) return

    setLoading(true)
    setError(null)
    setSelectedIds(new Set())

    api
      .get(`/api/produk/${produk.id}/gulungan`)
      .then((res) => {
        const list = res.data?.data?.items || res.data?.data || []
        // Filter hanya gulungan yang masih aktif (panjang_sisa > 0)
        const active = list.filter(
          (g) => g.is_active !== false && parseFloat(g.panjang_sisa) > 0
        )
        setGulunganList(active)
      })
      .catch((err) => {
        setError(getErrorMessage(err))
      })
      .finally(() => setLoading(false))
  }, [open, produk?.id])

  // Reset state saat tutup
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setGulunganList([])
        setSelectedIds(new Set())
        setError(null)
      }, 300)
    }
  }, [open])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const toggleSelect = (gulunganId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(gulunganId)) next.delete(gulunganId)
      else next.add(gulunganId)
      return next
    })
  }

  const handleMasukkanKeranjang = () => {
    if (selectedIds.size === 0) {
      toast.warning('Pilih minimal 1 gulungan')
      return
    }

    // Susun array gulungan yang dipilih
    const selected = gulunganList.filter((g) => selectedIds.has(g.id))

    // Callback ke caller - dia yang handle addToCart + flying animation
    onAddToCart?.(produk, selected, buttonRef.current)

    onClose?.()
  }

  if (typeof window === 'undefined' || !open || !produk) return null

  const fmtJenis = (j) => (j === 'sintetis' ? 'Sintetis' : 'Alami')
  const fmtRupiah = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0)

  return createPortal(
    <>
      {/* Backdrop coklat blur */}
      <div
        className="fixed inset-0 z-[9998] bg-[rgba(174,131,78,0.53)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <div
        className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]
          bg-white rounded-[14px]
          shadow-[2px_4px_20px_rgba(0,0,0,0.3)]
          w-[90vw] max-w-[1000px] max-h-[90vh]
          flex flex-col
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: title + close X */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#a47352]/20">
          <h2 className="text-[#a47352] text-2xl font-medium">Pilih Gulungan</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#a47352] hover:text-[#5b2400] active:scale-90 transition-all"
            aria-label="Tutup"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Card header produk - readonly info */}
          <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] p-4 flex items-center gap-4">
            <div className="w-[120px] h-[80px] rounded-[8px] overflow-hidden bg-gradient-to-br from-[#e3c2ac] to-[#a47352] flex-shrink-0">
              {produk.gambar_url ? (
                <img src={produk.gambar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-white/40" />
                </div>
              )}
            </div>

            <div className="flex-1 grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
              <ProdukInfo label="Kode Produksi" value={produk.kode_produk} />
              <ProdukInfo label="Jenis Pewarna" value={fmtJenis(produk.jenis_pewarna)} />
              <ProdukInfo label="Rak" value={produk.rak?.nama || '-'} />
              <ProdukInfo label="Kategori" value={produk.kategori?.nama || '-'} />
              <ProdukInfo label="Motif" value={produk.motif?.nama || '-'} />
            </div>
          </div>

          {/* List gulungan */}
          {loading ? (
            <div className="py-12 text-center text-[#a47352]">Memuat gulungan...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-700 text-sm">
              <p className="font-medium mb-1">Gagal memuat gulungan</p>
              <p>{error}</p>
            </div>
          ) : gulunganList.length === 0 ? (
            <div className="py-12 text-center text-[#a47352]/60">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" strokeWidth={1.5} />
              <p className="text-sm">Belum ada gulungan tersedia untuk produk ini</p>
            </div>
          ) : (
            <div className="space-y-2">
              {gulunganList.map((g) => {
                const isSelected = selectedIds.has(g.id)
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleSelect(g.id)}
                    className={`
                      w-full
                      bg-[rgba(227,194,172,0.35)]
                      rounded-[10px] shadow-sm
                      flex items-center gap-3 p-3
                      hover:bg-[rgba(227,194,172,0.5)]
                      active:scale-[0.99]
                      transition-all duration-150
                      ${isSelected ? 'ring-2 ring-[#a47352]' : ''}
                    `}
                  >
                    {/* Gambar mini */}
                    <div className="w-[100px] h-[50px] rounded-[8px] overflow-hidden bg-gradient-to-br from-[#e3c2ac] to-[#a47352] flex-shrink-0">
                      {produk.gambar_url ? (
                        <img src={produk.gambar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-white/40" />
                        </div>
                      )}
                    </div>

                    {/* Info gulungan - grid 5 kolom */}
                    <div className="flex-1 grid grid-cols-5 gap-2 text-xs text-left">
                      <GulInfo label="No Gulungan" value={String(g.nomor_gulungan).padStart(2, '0')} />
                      <GulInfo label="Lebar Gulungan" value={`${g.lebar} cm`} />
                      <GulInfo label="Panjang Total" value={`${g.panjang_total} m`} />
                      <GulInfo label="Panjang sisa" value={`${g.panjang_sisa} m`} />
                      <GulInfo label="Harga Per meter" value={fmtRupiah(g.harga_per_meter)} />
                    </div>

                    {/* Checkbox bulat */}
                    <div className="flex-shrink-0 mr-2">
                      <div
                        className={`
                          w-9 h-9 rounded-full
                          flex items-center justify-center
                          transition-all duration-200
                          ${isSelected
                            ? 'bg-[#4cd0b1] scale-110'
                            : 'bg-white border-2 border-[#a47352]/40'
                          }
                        `}
                      >
                        {isSelected && (
                          <Check className="w-5 h-5 text-white" strokeWidth={3} />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer button "Masukkan Keranjang" */}
        <div className="px-6 py-4 border-t border-[#a47352]/20 flex justify-end">
          <button
            ref={buttonRef}
            type="button"
            onClick={handleMasukkanKeranjang}
            disabled={selectedIds.size === 0 || gulunganList.length === 0}
            className="
              bg-[#a47352] hover:bg-[#8d6044]
              text-white text-base font-medium
              rounded-[10px] px-6 py-3
              inline-flex items-center gap-2
              active:scale-[0.97]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            <ShoppingCart className="w-5 h-5" />
            Masukkan Keranjang
            {selectedIds.size > 0 && (
              <span className="bg-white/20 rounded-full min-w-[24px] h-[24px] flex items-center justify-center text-sm">
                {selectedIds.size}
              </span>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}

// =====================================================
// Helper components
// =====================================================
function ProdukInfo({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[#dab399] text-[10px] uppercase tracking-wide truncate">
        {label}
      </p>
      <p className="text-[#a47352] text-sm font-medium truncate">{value || '-'}</p>
    </div>
  )
}

function GulInfo({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[#dab399] text-[10px] mb-0.5 truncate">{label}</p>
      <p className="text-[#a47352] text-xs font-semibold truncate">{value || '-'}</p>
    </div>
  )
}