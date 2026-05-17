// =====================================================
// KeranjangPage.jsx
// Halaman Keranjang untuk Customer Service.
//
// Update: hapus Jumlah Order counter (-/+).
// Karena 1 gulungan = 1 row yang sudah spesifik dipilih,
// cukup input Panjang Pesanan (meter) saja.
// Counter Jumlah Order akan dipakai nanti di PO Reguler.
// =====================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Package, X, Trash2 } from 'lucide-react'
import { EmptyState, ConfirmDialog, useToast } from '../../components/ui'
import useCartStore from '../../store/cartStore'

const fmtRupiah = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0)

export default function KeranjangPage() {
  const toast = useToast()
  const navigate = useNavigate()

  const items = useCartStore((s) => s.items)
  const updateJumlahOrder = useCartStore((s) => s.updateJumlahOrder)
  const removeGulunganFromItem = useCartStore((s) => s.removeGulunganFromItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const validateCart = useCartStore((s) => s.validateCart)
  const getSubtotal = useCartStore((s) => s.getSubtotal)

  const [confirmDelete, setConfirmDelete] = useState({
    open: false, type: null, cartItemId: null, gulunganId: null, label: '',
  })

  const handleChangePanjang = (cartItemId, gulunganId, newValue, maxStok) => {
    let num = parseFloat(newValue) || 0
    if (num < 0) num = 0
    if (num > maxStok) {
      toast.warning(`Maksimal ${maxStok} meter`)
      num = maxStok
    }
    updateJumlahOrder(cartItemId, gulunganId, num)
  }

  const handleConfirmDelete = () => {
    if (confirmDelete.type === 'gulungan') {
      removeGulunganFromItem(confirmDelete.cartItemId, confirmDelete.gulunganId)
    } else if (confirmDelete.type === 'item') {
      removeItem(confirmDelete.cartItemId)
    }
    setConfirmDelete({ open: false, type: null, cartItemId: null, gulunganId: null, label: '' })
  }

  const handleCheckout = () => {
    const { valid, error } = validateCart()
    if (!valid) {
      toast.error(error)
      return
    }
    navigate('/keranjang/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={ShoppingCart}
          title="Keranjang masih kosong"
          message='Klik "Beli" di menu Order untuk menambah produk ke keranjang'
          action={
            <button
              type="button"
              onClick={() => navigate('/order')}
              className="bg-[#a47352] hover:bg-[#8d6044] text-white font-medium rounded-[10px] px-6 py-2.5 inline-flex items-center gap-2 active:scale-[0.97] transition-all"
            >
              <Package className="w-4 h-4" />
              Mulai Order
            </button>
          }
        />
      </div>
    )
  }

  const subtotal = getSubtotal()

  return (
    <div className="space-y-6">
      {/* Total bar - sticky info di atas */}
      <div className="bg-white border-2 border-[#a47352]/30 rounded-[10px] px-6 py-3 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[#a47352]/70 text-xs">Total Sementara ({items.length} produk)</p>
          <p className="text-[#a47352] text-2xl font-bold">{fmtRupiah(subtotal)}</p>
        </div>
        <button
          type="button"
          onClick={handleCheckout}
          className="bg-[#a47352] hover:bg-[#8d6044] text-white rounded-[10px] px-6 py-3 inline-flex items-center gap-2 text-base font-medium active:scale-[0.97] transition-all"
        >
          <ShoppingCart className="w-5 h-5" />
          Lanjut Check-out
        </button>
      </div>

      {/* List cart items */}
      <div className="space-y-6">
        {items.map((item) => (
          <CartItemCard
            key={item.id}
            item={item}
            onChangePanjang={handleChangePanjang}
            onRemoveGulungan={(gulunganId, label) =>
              setConfirmDelete({ open: true, type: 'gulungan', cartItemId: item.id, gulunganId, label })
            }
            onRemoveItem={() =>
              setConfirmDelete({ open: true, type: 'item', cartItemId: item.id, gulunganId: null, label: item.produk.kode_produk })
            }
          />
        ))}
      </div>

      <ConfirmDialog
        open={confirmDelete.open}
        onClose={() =>
          setConfirmDelete({ open: false, type: null, cartItemId: null, gulunganId: null, label: '' })
        }
        onConfirm={handleConfirmDelete}
        title={confirmDelete.type === 'item' ? 'Hapus produk dari keranjang?' : 'Hapus gulungan dari keranjang?'}
        message={
          confirmDelete.type === 'item'
            ? `Semua gulungan dari "${confirmDelete.label}" akan dihapus dari keranjang.`
            : `Gulungan ${confirmDelete.label} akan dihapus dari keranjang.`
        }
        confirmText="Ya, Hapus"
      />
    </div>
  )
}

function CartItemCard({ item, onChangePanjang, onRemoveGulungan, onRemoveItem }) {
  const produk = item.produk
  const fmtJenis = (j) => (j === 'sintetis' ? 'Sintetis' : 'Alami')

  return (
    <div className="bg-white rounded-[10px] shadow-[2px_4px_8px_3px_rgba(0,0,0,0.1)] overflow-hidden">
      {/* Header produk */}
      <div className="bg-[rgba(227,194,172,0.35)] px-6 py-4 flex items-start gap-4">
        <div className="w-[180px] h-[110px] rounded-[10px] overflow-hidden bg-gradient-to-br from-[#e3c2ac] to-[#a47352] flex-shrink-0">
          {produk.gambar_url ? (
            <img src={produk.gambar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-white/40" />
            </div>
          )}
        </div>

        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <InfoCell label="Kode Produksi" value={produk.kode_produk} />
          <InfoCell label="Kategori" value={produk.kategori?.nama || '-'} />
          <InfoCell label="Motif" value={produk.motif?.nama || '-'} />
          <InfoCell label="Jenis Pewarna" value={fmtJenis(produk.jenis_pewarna)} />
        </div>

        <button
          type="button"
          onClick={onRemoveItem}
          title="Hapus semua dari produk ini"
          className="flex-shrink-0 p-2 rounded-lg text-[#a47352] hover:text-white hover:bg-[#ff695e] active:scale-90 transition-all"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Rows per gulungan */}
      <div className="p-4 space-y-3">
        {item.gulungan_selections.map((g) => (
          <GulunganRow
            key={g.gulungan_id}
            gulungan={g}
            gambarUrl={produk.gambar_url}
            onChangePanjang={(val) => onChangePanjang(item.id, g.gulungan_id, val, g.panjang_sisa)}
            onRemove={() => onRemoveGulungan(g.gulungan_id, `#${String(g.nomor_gulungan).padStart(2, '0')}`)}
          />
        ))}
      </div>
    </div>
  )
}

function GulunganRow({ gulungan, gambarUrl, onChangePanjang, onRemove }) {
  const subtotalRow = (gulungan.jumlah_order || 0) * (gulungan.harga_per_meter || 0)
  const isOverflow = gulungan.jumlah_order > gulungan.panjang_sisa

  return (
    <div
      className={`
        bg-[rgba(227,194,172,0.35)]
        rounded-[10px] shadow-[2px_4px_8px_0px_rgba(0,0,0,0.1)]
        p-3 flex items-center gap-3
        ${isOverflow ? 'ring-2 ring-red-400' : ''}
      `}
    >
      {/* Gambar mini */}
      <div className="w-[80px] h-[55px] rounded-[8px] overflow-hidden bg-gradient-to-br from-[#e3c2ac] to-[#a47352] flex-shrink-0">
        {gambarUrl ? (
          <img src={gambarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-5 h-5 text-white/40" />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 w-[100px]">
        <p className="text-[#966b4f]/70 text-xs">No Gulungan</p>
        <p className="text-[#966b4f] text-sm font-medium">
          {String(gulungan.nomor_gulungan).padStart(2, '0')}
        </p>
      </div>

      <div className="flex-shrink-0 w-[100px]">
        <p className="text-[#966b4f]/70 text-xs">Lebar</p>
        <p className="text-[#966b4f] text-sm font-medium">{gulungan.lebar} cm</p>
      </div>

      <div className="flex-shrink-0 w-[110px]">
        <p className="text-[#966b4f]/70 text-xs">Panjang Sisa</p>
        <p className="text-[#966b4f] text-sm font-medium">{gulungan.panjang_sisa} meter</p>
      </div>

      <div className="flex-shrink-0 w-[140px]">
        <p className="text-[#966b4f]/70 text-xs">Harga / meter</p>
        <p className="text-[#966b4f] text-sm font-medium">{fmtRupiah(gulungan.harga_per_meter)}</p>
      </div>

      {/* Input Panjang Pesanan */}
      <div className="flex-shrink-0 w-[180px]">
        <p className="text-[#a47352] text-xs mb-1 font-medium">Panjang Pesanan</p>
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            max={gulungan.panjang_sisa}
            value={gulungan.jumlah_order || ''}
            onChange={(e) => onChangePanjang(e.target.value)}
            placeholder="0"
            className={`
              w-full px-3 py-2.5 pr-10
              bg-[rgba(227,194,172,0.35)]
              border ${isOverflow ? 'border-red-500' : 'border-[#a47352]'}
              rounded-[5px]
              text-[#a47352] text-base font-medium
              focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
              transition-all
            `}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a47352]/60 text-sm pointer-events-none">m</span>
        </div>
      </div>

      {/* Subtotal */}
      <div className="flex-1 text-right min-w-[120px]">
        <p className="text-[#a47352]/60 text-xs">Subtotal</p>
        <p className="text-[#a47352] text-base font-bold">{fmtRupiah(subtotalRow)}</p>
      </div>

      {/* Hapus X */}
      <button
        type="button"
        onClick={onRemove}
        title="Hapus gulungan ini"
        className="
          flex-shrink-0
          w-9 h-9 rounded-full
          bg-white border border-[#a47352]/30
          text-[#a47352]
          hover:bg-[#ff695e] hover:text-white hover:border-[#ff695e]
          active:scale-90
          flex items-center justify-center
          transition-all
        "
      >
        <X className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}

function InfoCell({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[#dab399] text-[11px] uppercase tracking-wide truncate">
        {label}
      </p>
      <p className="text-[#a47352] text-sm font-medium truncate">{value || '-'}</p>
    </div>
  )
}