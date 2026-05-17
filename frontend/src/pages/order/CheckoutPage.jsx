// =====================================================
// CheckoutPage.jsx
// Halaman Check-out untuk Customer Service.
//
// Update: Hapus window.open, pakai StrukModal inline.
// Lebih reliable - tidak kena pop-up blocker, auth context tetap.
// =====================================================

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, CreditCard, ChevronDown, ChevronLeft, ShoppingCart,
} from 'lucide-react'
import { useToast, EmptyState } from '../../components/ui'
import useCartStore from '../../store/cartStore'
import api, { getErrorMessage } from '../../lib/api'
import CetakStrukDialog from '../../components/order/CetakStrukDialog'
import StrukModal from '../../components/order/StrukModal'

const fmtRupiah = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0)

const fmtTanggal = (date) =>
  date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })

const METODE_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'transfer', label: 'Transfer' },
]

export default function CheckoutPage() {
  const toast = useToast()
  const navigate = useNavigate()

  const items = useCartStore((s) => s.items)
  const validateCart = useCartStore((s) => s.validateCart)
  const flattenForCheckout = useCartStore((s) => s.flattenForCheckout)
  const clearCart = useCartStore((s) => s.clearCart)

  const [metodePembayaran, setMetodePembayaran] = useState('cash')
  const [diskon, setDiskon] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showCetakDialog, setShowCetakDialog] = useState(false)
  const [showStrukModal, setShowStrukModal] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState(null)

  useEffect(() => {
    if (items.length === 0) return
    const { valid, error } = validateCart()
    if (!valid) {
      toast.error(error)
      navigate('/keranjang')
    }
  }, [])

  const allRows = useMemo(() => {
    const rows = []
    for (const item of items) {
      for (const g of item.gulungan_selections) {
        rows.push({
          cartItemId: item.id,
          produk: item.produk,
          gulungan: g,
          subtotal: (g.jumlah_order || 0) * (g.harga_per_meter || 0),
        })
      }
    }
    return rows
  }, [items])

  const subtotal = allRows.reduce((sum, r) => sum + r.subtotal, 0)
  const diskonAmount = subtotal * (diskon / 100)
  const totalAkhir = subtotal - diskonAmount

  const handleBuatPesanan = async () => {
    const { valid, error } = validateCart()
    if (!valid) {
      toast.error(error)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        metode_pembayaran: metodePembayaran,
        diskon: diskon,
        items: flattenForCheckout(),
      }

      const res = await api.post('/api/orders', payload)
      const order = res.data?.data
      setCreatedOrderId(order?.id)
      setShowCetakDialog(true)
    } catch (err) {
      toast.error('Gagal buat pesanan: ' + getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

 const handleCetakStruk = () => {
  console.log('🟢 handleCetakStruk dipanggil')
  console.log('createdOrderId:', createdOrderId)
  console.log('showStrukModal sebelum:', showStrukModal)
  
  if (!createdOrderId) {
    console.log('❌ createdOrderId kosong, return!')
    return
  }
  
  setShowCetakDialog(false)
  setShowStrukModal(true)
  
  console.log('✅ setShowStrukModal(true) dipanggil')
}
  const handleSkipCetak = () => {
    setShowCetakDialog(false)
    finishCheckout()
  }

  const handleCloseStruk = () => {
    setShowStrukModal(false)
    finishCheckout()
  }

  const finishCheckout = () => {
    clearCart()
    toast.success('Pesanan berhasil dibuat')
    navigate('/order')
  }

  if (items.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={ShoppingCart}
          title="Keranjang kosong"
          message="Belum ada produk di keranjang untuk di-checkout"
          action={
            <button
              type="button"
              onClick={() => navigate('/order')}
              className="bg-[#a47352] hover:bg-[#8d6044] text-white rounded-[10px] px-6 py-2.5 inline-flex items-center gap-2 active:scale-[0.97] transition-all"
            >
              <Package className="w-4 h-4" />
              Mulai Order
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className="bg-[rgba(227,194,172,0.35)] rounded-[20px] p-6 md:p-8">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-[#a47352] text-3xl font-medium">Check-out</h1>
          <p className="text-[#a47352] text-sm mt-1.5">
            Tanggal Order : {fmtTanggal(new Date())}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/keranjang')}
          className="bg-[#a47352] hover:bg-[#8d6044] text-white rounded-[10px] px-4 py-2 inline-flex items-center gap-2 text-sm font-medium active:scale-[0.97] transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali
        </button>
      </div>

      <div className="h-px bg-[#a47352]/30 my-6" />

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-[#a47352]" />
          <h2 className="text-[#a47352] text-xl font-bold">Data Produk</h2>
        </div>
        <div className="space-y-3">
          {allRows.map((row, idx) => (
            <ProdukRow key={`${row.cartItemId}-${row.gulungan.gulungan_id}-${idx}`} row={row} />
          ))}
        </div>
      </div>

      <div className="h-px bg-[#a47352]/30 my-6" />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-[#a47352]" />
          <h2 className="text-[#a47352] text-xl font-bold">Detail Pembayaran</h2>
        </div>

        <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] p-6 grid grid-cols-1 lg:grid-cols-[1fr_220px_1fr] gap-4">
          <div>
            <label className="block text-[#a47352] text-sm font-medium mb-2">
              Metode Pembayaran
            </label>
            <div className="relative">
              <select
                value={metodePembayaran}
                onChange={(e) => setMetodePembayaran(e.target.value)}
                className="w-full h-[70px] px-4 pr-12 appearance-none cursor-pointer bg-[#e3c2ac] border border-[#a47352] rounded-[5px] text-[#a47352] text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#a47352]/30"
              >
                {METODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a47352] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[#a47352] text-sm font-medium mb-2">
              Diskon (opsional)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={diskon || ''}
                onChange={(e) => {
                  let val = parseFloat(e.target.value) || 0
                  if (val < 0) val = 0
                  if (val > 100) val = 100
                  setDiskon(val)
                }}
                placeholder="0"
                className="w-full h-[70px] px-4 pr-10 bg-[#e3c2ac] border border-[#a47352] rounded-[5px] text-[#a47352] text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#a47352]/30"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a47352] font-medium pointer-events-none">%</span>
            </div>
          </div>

          <div>
            <label className="block text-[#a47352] text-sm font-medium mb-2">
              Total Harga
            </label>
            <div className="bg-[#e3c2ac] border border-[#a47352] rounded-[5px] p-4 space-y-2">
              <RingkasanRow label="Sub Total" value={fmtRupiah(subtotal)} />
              <RingkasanRow label="Diskon" value={`-${fmtRupiah(diskonAmount)}`} badge={`${diskon}%`} />
              <div className="h-px bg-[#a47352]/30 my-1" />
              <RingkasanRow label="Total" value={fmtRupiah(totalAkhir)} bold />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleBuatPesanan}
        disabled={submitting}
        className="w-full h-[80px] bg-[#3dd8b3] hover:bg-[#2cc6a1] text-white text-2xl font-bold rounded-[5px] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
      >
        {submitting ? 'Memproses...' : 'Buat Pesanan'}
      </button>

      <CetakStrukDialog
        open={showCetakDialog}
        onClose={handleSkipCetak}
        onCetak={handleCetakStruk}
      />

      <StrukModal
        open={showStrukModal}
        onClose={handleCloseStruk}
        orderId={createdOrderId}
      />
    </div>
  )
}

function ProdukRow({ row }) {
  const { produk, gulungan, subtotal } = row

  return (
    <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] shadow-[2px_4px_8px_rgba(0,0,0,0.1)] p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-[120px] h-[100px] rounded-[10px] overflow-hidden bg-gradient-to-br from-[#e3c2ac] to-[#a47352] flex-shrink-0">
          {produk.gambar_url ? (
            <img src={produk.gambar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-8 h-8 text-white/40" />
            </div>
          )}
        </div>

        <div className="flex-shrink-0 min-w-[160px]">
          <p className="text-[#dab399] text-[10px] uppercase tracking-wide">Kode Produksi</p>
          <p className="text-[#a47352] text-sm font-medium">{produk.kode_produk}</p>
          <p className="text-[#dab399] text-[10px] uppercase tracking-wide mt-1">Kategori</p>
          <p className="text-[#a47352] text-sm font-medium">{produk.kategori?.nama || '-'}</p>
          <p className="text-[#dab399] text-[10px] uppercase tracking-wide mt-1">Motif</p>
          <p className="text-[#a47352] text-sm font-medium">{produk.motif?.nama || '-'}</p>
        </div>

        <div className="flex-shrink-0">
          <p className="text-[#a47352] text-xs mb-1 font-medium">Lebar Kain</p>
          <div className="bg-[#e3c2ac] h-[46px] px-4 rounded-[5px] flex items-center text-[#a47352] text-sm font-medium min-w-[120px]">
            Lebar {gulungan.lebar} cm
          </div>
        </div>

        <div className="flex-shrink-0">
          <p className="text-[#a47352] text-xs mb-1 font-medium">No Gulungan</p>
          <div className="bg-[#e3c2ac] h-[46px] px-4 rounded-[5px] flex items-center text-[#a47352] text-sm font-medium min-w-[100px]">
            {String(gulungan.nomor_gulungan).padStart(2, '0')}
          </div>
        </div>

        <div className="flex-shrink-0">
          <p className="text-[#a47352] text-xs mb-1 font-medium">Panjang Pesanan</p>
          <div className="bg-[#e3c2ac] h-[46px] px-4 rounded-[5px] flex items-center text-[#a47352] text-sm font-medium min-w-[120px]">
            {gulungan.jumlah_order} meter
          </div>
        </div>

        <div className="flex-shrink-0">
          <p className="text-[#a47352] text-xs mb-1 font-medium">Harga Per Meter</p>
          <div className="bg-[#e3c2ac] h-[46px] px-4 rounded-[5px] flex items-center text-[#a47352] text-sm font-medium min-w-[160px]">
            {fmtRupiah(gulungan.harga_per_meter)}
          </div>
        </div>

        <div className="flex-1 text-right min-w-[120px]">
          <p className="text-[#a47352] text-xs mb-1 font-medium">Subtotal</p>
          <p className="text-[#a47352] text-base font-bold">{fmtRupiah(subtotal)}</p>
        </div>
      </div>
    </div>
  )
}

function RingkasanRow({ label, value, badge, bold }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`text-[#a47352] ${bold ? 'text-base font-bold' : 'text-sm'}`}>
          {label}
        </span>
        {badge && (
          <span className="bg-[#a47352]/10 text-[#a47352] text-xs px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <span className={`text-[#a47352] ${bold ? 'text-base font-bold' : 'text-sm font-medium'}`}>
        {value}
      </span>
    </div>
  )
}