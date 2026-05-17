// =====================================================
// StrukPage.jsx
// Halaman struk yang dibuka di popup window setelah checkout.
// Auto-trigger window.print() setelah data loaded.
//
// Style: minimal (untuk thermal printer / receipt printer).
// Lebar ~80mm setara 300px screen.
// =====================================================

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
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

export default function StrukPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    api
      .get(`/api/orders/${id}/struk`)
      .then((res) => setData(res.data?.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  // Auto-print setelah data loaded
  useEffect(() => {
    if (data && !loading) {
      setTimeout(() => window.print(), 500)
    }
  }, [data, loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Memuat struk...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <p className="text-red-600 font-medium mb-2">Gagal memuat struk</p>
        <p className="text-gray-600 text-sm">{error}</p>
      </div>
    )
  }

  const subtotal = data.items?.reduce((s, i) => s + (i.subtotal || 0), 0) || 0
  const diskon = data.diskon || 0
  const diskonAmount = subtotal * (diskon / 100)
  const total = data.total_harga || (subtotal - diskonAmount)

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-2 print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body { margin: 0; padding: 0; }
        }
      `}</style>

      <div className="max-w-[300px] mx-auto bg-white p-4 font-mono text-xs leading-snug print:max-w-none print:p-2">
        {/* Header */}
        <div className="text-center mb-3 pb-2 border-b-2 border-dashed border-black">
          <h1 className="text-base font-bold tracking-wide">DIBYO LURIK</h1>
          <p className="text-[10px]">Sistem Manajemen Toko Kain</p>
          <p className="text-[10px] mt-1">━━━━━━━━━━━━━━</p>
        </div>

        {/* Info Order */}
        <div className="mb-3 space-y-0.5">
          <Row label="No. Order" value={data.nomor_order || data.id?.slice(-8)} />
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
                  {produk.motif?.nama_motif || produk.motif?.nama || '-'} |
                  {' '}{g.lebar}cm | Gul.{g.nomor_gulungan}
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

        {/* Print button - hidden saat print */}
        <div className="mt-4 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="
              w-full bg-[#a47352] hover:bg-[#8d6044] text-white
              text-sm font-medium rounded-md py-2
              transition-all
            "
          >
            🖨️ Cetak Ulang
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="
              w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-700
              text-sm font-medium rounded-md py-2
              transition-all
            "
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
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