// =====================================================
// StrukModal.jsx
// Render struk di modal dalam halaman yang sama (tidak buka window baru).
// Lebih reliable daripada window.open() karena:
//   - Tidak kena pop-up blocker
//   - Auth context tetap (token attached)
//   - Window kebuka di tab utama, tidak background
//
// Flow:
//   1. Modal open dengan orderId
//   2. Fetch /api/orders/[id]/struk
//   3. Render struk preview
//   4. User klik "Cetak" → window.print() trigger print dialog
//   5. Close modal → finishCheckout
// =====================================================

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer } from 'lucide-react'
import api, { getErrorMessage } from '../../lib/api'

const fmtRupiah = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(val || 0)

const fmtDateTime = (val) => {
  if (!val) return '-'
  try {
    return new Date(val).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return val }
}

export default function StrukModal({ open, onClose, orderId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !orderId) return
    setLoading(true)
    setError(null)
    api
      .get(`/api/orders/${orderId}/struk`)
      .then((res) => setData(res.data?.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [open, orderId])

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setData(null)
        setError(null)
      }, 300)
    }
  }, [open])

  const handlePrint = () => {
    // Trigger print pakai print-area only via @media print
    window.print()
  }

  if (typeof window === 'undefined' || !open) return null

  const subtotal = data?.items?.reduce((s, i) => s + (i.subtotal || 0), 0) || 0
  const diskon = data?.diskon || 0
  const diskonAmount = subtotal * (diskon / 100)
  const total = data?.total_harga || (subtotal - diskonAmount)

  return createPortal(
    <>
      {/* CSS untuk print: hanya tampilkan #struk-print-area, sembunyikan yang lain */}
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body * { visibility: hidden !important; }
          #struk-print-area, #struk-print-area * { visibility: visible !important; }
          #struk-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            padding: 4mm !important;
            background: white !important;
          }
          .print-hide { display: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-[rgba(174,131,78,0.53)] backdrop-blur-sm print-hide"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]
          bg-white rounded-[14px]
          shadow-[2px_4px_20px_rgba(0,0,0,0.3)]
          w-[95vw] max-w-[420px] max-h-[90vh]
          flex flex-col
          print-hide
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - print-hide */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#a47352]/20">
          <h2 className="text-[#a47352] text-lg font-medium">Struk Pesanan</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#a47352] hover:text-[#5b2400] active:scale-90 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Struk content - akan di-print */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-[#a47352] py-8">Memuat struk...</p>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 font-medium mb-1">Gagal memuat struk</p>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          ) : !data ? (
            <p className="text-center text-gray-500 py-8">Data tidak tersedia</p>
          ) : (
            <div
              id="struk-print-area"
              className="max-w-[300px] mx-auto bg-white font-mono text-xs leading-snug"
            >
              {/* Header struk */}
              <div className="text-center mb-3 pb-2 border-b-2 border-dashed border-black">
                <h1 className="text-base font-bold tracking-wide">DIBYO LURIK</h1>
                <p className="text-[10px]">Sistem Manajemen Toko Kain</p>
                <p className="text-[10px] mt-1">━━━━━━━━━━━━━━</p>
              </div>

              {/* Info Order */}
              <div className="mb-3 space-y-0.5">
                <Row label="No. Order" value={data.nomor_order || data.id?.slice(-8)?.toUpperCase()} />
                <Row label="Tanggal" value={fmtDateTime(data.tanggal_order || data.created_at)} />
                <Row label="Kasir" value={data.kasir?.nama || data.kasir?.username || '-'} />
                <Row label="Bayar" value={data.metode_pembayaran === 'cash' ? 'Cash' : 'Transfer'} />
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Items */}
              <div className="space-y-2.5">
                {(data.items || []).map((item, idx) => {
                  const g = item.gulungan || {}
                  const produk = g.produk || {}
                  return (
                    <div key={item.id || idx}>
                      <p className="font-bold">{produk.kode_produk || '-'}</p>
                      <p className="text-[10px]">
                        {produk.motif?.nama || '-'} | {g.lebar}cm | Gul.{g.nomor_gulungan}
                      </p>
                      <div className="flex justify-between">
                        <span>
                          {item.jumlah_order}m x {fmtRupiah(item.harga_per_meter)}
                        </span>
                        <span className="font-medium">{fmtRupiah(item.subtotal)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Totals */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{fmtRupiah(subtotal)}</span>
                </div>
                {diskon > 0 && (
                  <div className="flex justify-between">
                    <span>Diskon ({diskon}%)</span>
                    <span>-{fmtRupiah(diskonAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
                  <span>TOTAL</span>
                  <span>{fmtRupiah(total)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-4 pt-3 border-t-2 border-dashed border-black">
                <p className="text-[10px]">━━━ TERIMA KASIH ━━━</p>
                <p className="text-[10px] mt-1">Semoga puas dengan kain Lurik kami</p>
                <p className="text-[10px] mt-2">Struk ini sebagai bukti pembelian</p>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons - print-hide */}
        {data && (
          <div className="flex gap-2 px-5 py-3 border-t border-[#a47352]/20">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 bg-gray-200 hover:bg-gray-300
                text-gray-700 text-sm font-medium
                rounded-lg py-2.5
                active:scale-[0.97] transition-all
              "
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="
                flex-1 bg-[#a47352] hover:bg-[#8d6044]
                text-white text-sm font-medium
                rounded-lg py-2.5
                inline-flex items-center justify-center gap-2
                active:scale-[0.97] transition-all
              "
            >
              <Printer className="w-4 h-4" />
              Cetak
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{label}</span>
      <span className="text-right">{value || '-'}</span>
    </div>
  )
}