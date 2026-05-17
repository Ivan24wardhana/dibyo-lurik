// =====================================================
// DetailPORModal.jsx
// Detail + Edit Status Pre-Order Reguler.
//
// POR = Customer order kain dari produk existing,
// tapi gulungan habis/kurang → pre-order dulu.
//
// Backend endpoints status update (sudah ada):
//   POST /[id]/start-produksi   → status: sedang_diproses (CS/KP)
//   POST /[id]/finish-produksi  → status: selesai_diproses (CS/KP)
//   POST /[id]/mark-paid        → status_pembayaran: lunas (CS only)
// =====================================================

import { useState, useEffect, useCallback } from 'react'
import { Package, User, CreditCard, Box, Calendar, ChevronDown, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { SuccessPopup, useToast } from '../ui'
import api, { getErrorMessage } from '../../lib/api'
import useAuthStore from '../../store/authStore'

// Format Rupiah inline (tidak pakai formatRupiahFull yang tidak exist)
const fmtRupiah = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0)

const fmtTanggal = (val) => {
  if (!val) return '-'
  try {
    return new Date(val).toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch { return val }
}

// Status configs
const STATUS_PRODUKSI = [
  { value: 'belum_diproses', label: 'Belum diproses', color: '#a63636' },
  { value: 'sedang_diproses', label: 'Sedang diproses', color: '#b99e5f' },
  { value: 'selesai_diproses', label: 'Selesai diproses', color: '#91b960' },
]
const STATUS_PEMBAYARAN = [
  { value: 'dp', label: 'DP', color: '#a47352' },
  { value: 'lunas', label: 'Lunas', color: '#91b960' },
]

function StatusBadge({ value, options }) {
  const cfg = options.find((o) => o.value === value) || options[0]
  return (
    <span
      className="text-white text-xs font-medium px-3 py-1.5 rounded-[20px] inline-block"
      style={{ backgroundColor: cfg?.color || '#a47352' }}
    >
      {cfg?.label || value || '-'}
    </span>
  )
}

function SelectField({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full h-[40px] px-3 pr-8 appearance-none cursor-pointer
          bg-[#e3c2ac] border border-[#a47352]
          rounded-[7px] text-[#a47352] text-sm font-medium
          focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
        "
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a47352] pointer-events-none" />
    </div>
  )
}

function InfoCell({ label, value }) {
  return (
    <div>
      <p className="text-[#a47352]/60 text-[10px] mb-0.5">{label}</p>
      <p className="text-[#a47352] text-xs font-medium">{value || '-'}</p>
    </div>
  )
}

export default function DetailPORModal({ open, onClose, poId, onSuccess }) {
  const toast = useToast()
  const profile = useAuthStore((s) => s.profile)
  const role = profile?.role
  const isCS = role === 'customer_service'
  const isKP = role === 'kepala_produksi'
  const canEdit = isCS || isKP

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Form state
  const [statusProduksi, setStatusProduksi] = useState('')
  const [statusPembayaran, setStatusPembayaran] = useState('')

  const fetchDetail = useCallback(async () => {
    if (!poId) return
    setLoading(true)
    try {
      const res = await api.get(`/api/pre-order-reguler/${poId}`)
      const d = res.data?.data
      setData(d)
      setStatusProduksi(d?.status_produksi || 'belum_diproses')
      setStatusPembayaran(d?.status_pembayaran || 'dp')
    } catch (err) {
      toast.error('Gagal load: ' + getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [poId, toast])

  useEffect(() => {
    if (open && poId) fetchDetail()
  }, [open, poId, fetchDetail])

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setData(null)
        setStatusProduksi('')
        setStatusPembayaran('')
        setShowSuccess(false)
      }, 300)
    }
  }, [open])

  // Save handler — pakai dedicated endpoints
  const handleSimpan = async () => {
    if (!data) return
    setSubmitting(true)

    try {
      const promises = []

      // Update status produksi jika berubah
      if (statusProduksi !== data.status_produksi) {
        if (statusProduksi === 'sedang_diproses') {
          promises.push(api.post(`/api/pre-order-reguler/${poId}/start-produksi`))
        } else if (statusProduksi === 'selesai_diproses') {
          promises.push(api.post(`/api/pre-order-reguler/${poId}/finish-produksi`))
        }
      }

      // Update status pembayaran jika berubah (CS only)
      if (isCS && statusPembayaran !== data.status_pembayaran && statusPembayaran === 'lunas') {
        promises.push(api.post(`/api/pre-order-reguler/${poId}/mark-paid`))
      }

      if (promises.length === 0) {
        toast.warning('Tidak ada perubahan')
        setSubmitting(false)
        return
      }

      await Promise.all(promises)
      setShowSuccess(true)
      onSuccess?.()
      setTimeout(() => onClose?.(), 1800)
    } catch (err) {
      toast.error('Gagal: ' + getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // KP hanya bisa pilih selesai_diproses
  const statusProduksiOptions = isKP
    ? STATUS_PRODUKSI.filter((o) => o.value === 'selesai_diproses')
    : STATUS_PRODUKSI

  if (typeof window === 'undefined' || !open) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-[rgba(174,131,78,0.53)] backdrop-blur-sm"
        onClick={() => !submitting && onClose?.()}
      />

      {/* Modal */}
      <div
        className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]
          bg-white rounded-[14px] shadow-[2px_4px_20px_rgba(0,0,0,0.3)]
          w-[90vw] max-w-[960px] max-h-[90vh] overflow-y-auto
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#a47352]/20">
          <h2 className="text-[#a47352] text-xl font-medium">Pre-Order Reguler</h2>
          <button type="button" onClick={() => !submitting && onClose?.()} className="text-[#a47352] hover:text-[#5b2400] transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#a47352]">Memuat data...</div>
        ) : !data ? (
          <div className="py-12 text-center text-[#a47352]/60">Data tidak ditemukan</div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Row 1: Data Customer + Detail Pembayaran */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data Customer */}
              <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-[#a47352]" />
                  <p className="text-[#a47352] font-semibold text-sm">Data Customer</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <InfoCell label="Nama Customer" value={data.nama_customer} />
                  <InfoCell label="No Telpon" value={data.no_telpon} />
                  <InfoCell label="Tanggal PO" value={fmtTanggal(data.tanggal_po)} />
                </div>
                <div className="h-px bg-[#a47352]/20 mb-3" />
                <InfoCell label="Alamat" value={data.alamat} />
              </div>

              {/* Detail Pembayaran */}
              <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-[#a47352]" />
                  <p className="text-[#a47352] font-semibold text-sm">Detail Pembayaran</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div>
                    <p className="text-[#a47352]/60 mb-1">Status Pembayaran</p>
                    {isCS ? (
                      <SelectField value={statusPembayaran} onChange={setStatusPembayaran} options={STATUS_PEMBAYARAN} />
                    ) : (
                      <StatusBadge value={data.status_pembayaran} options={STATUS_PEMBAYARAN} />
                    )}
                  </div>
                  <InfoCell label="Nominal DP" value={fmtRupiah(data.nominal_dp)} />
                  <InfoCell label="Metode Pembayaran" value={data.metode_pembayaran || '-'} />
                </div>
                <div className="h-px bg-[#a47352]/20 mb-3" />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <InfoCell label="Diskon" value={data.diskon ? `${data.diskon}%` : '0%'} />
                  <InfoCell label="Total Harga" value={fmtRupiah(data.total_harga)} />
                </div>
              </div>
            </div>

            {/* Row 2: Data Produk (items POR) */}
            <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Box className="w-4 h-4 text-[#a47352]" />
                <p className="text-[#a47352] font-semibold text-sm">Data Produk</p>
              </div>
              <div className="space-y-3">
                {(data.item_pre_order_reguler || []).map((item, idx) => (
                  <div key={item.id || idx} className="bg-white rounded-[8px] p-3 flex items-center gap-4">
                    {/* Gambar */}
                    <div className="w-[80px] h-[60px] rounded-[6px] overflow-hidden bg-gradient-to-br from-[#e3c2ac] to-[#a47352] flex-shrink-0">
                      {item.produk?.gambar_url ? (
                        <img src={item.produk.gambar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-white/40" />
                        </div>
                      )}
                    </div>
                    {/* Info produk */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[#dab399] text-[10px]">Kode Produksi</p>
                      <p className="text-[#a47352] text-sm font-medium">{item.produk?.kode_produk || '-'}</p>
                      <p className="text-[#dab399] text-[10px] mt-0.5">Kategori</p>
                      <p className="text-[#a47352] text-xs">{item.produk?.kategori?.nama || '-'}</p>
                      <p className="text-[#dab399] text-[10px] mt-0.5">Motif</p>
                      <p className="text-[#a47352] text-xs">{item.produk?.motif?.nama || '-'}</p>
                    </div>
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-3 flex-shrink-0 text-xs">
                      {[
                        { label: 'Lebar Kain', val: item.lebar ? `${item.lebar} cm` : '-' },
                        { label: 'Jumlah PO', val: item.jumlah || '-' },
                        { label: 'Panjang Kain', val: item.panjang_kain ? `${item.panjang_kain} m` : '-' },
                        { label: 'Harga', val: fmtRupiah(item.harga_per_meter) },
                      ].map((s) => (
                        <div key={s.label}>
                          <p className="text-[#a47352]/60 mb-1">{s.label}</p>
                          <div className="bg-[#e3c2ac] text-[#a47352] text-xs px-2 py-1 rounded-[6px] text-center whitespace-nowrap">
                            {s.val}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(!data.item_pre_order_reguler || data.item_pre_order_reguler.length === 0) && (
                  <p className="text-[#a47352]/50 text-sm italic text-center py-4">Belum ada item</p>
                )}
              </div>
            </div>

            {/* Row 3: Estimasi + Status Produksi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-[#a47352]" />
                  <p className="text-[#a47352] font-semibold text-sm">Estimasi Produk Jadi</p>
                </div>
                <div className="bg-[#e3c2ac] rounded-[7px] px-4 py-3 text-[#a47352] text-sm font-medium">
                  {fmtTanggal(data.tanggal_estimasi) || '00/00/0000'}
                </div>
              </div>

              <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ChevronDown className="w-4 h-4 text-[#a47352]" />
                  <p className="text-[#a47352] font-semibold text-sm">Status Produksi</p>
                </div>
                {canEdit ? (
                  <>
                    <SelectField value={statusProduksi} onChange={setStatusProduksi} options={statusProduksiOptions} />
                    {isKP && (
                      <p className="text-[#a47352]/60 text-xs mt-2">
                        ℹ️ Kepala Produksi hanya bisa mengubah ke "Selesai diproses"
                      </p>
                    )}
                  </>
                ) : (
                  <StatusBadge value={data.status_produksi} options={STATUS_PRODUKSI} />
                )}
              </div>
            </div>

            {/* Simpan - CS dan KP only */}
            {canEdit && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSimpan}
                  disabled={submitting}
                  className="
                    bg-[#a47352] hover:bg-[#8d6044] text-white text-sm font-medium
                    rounded-[7px] px-6 py-2.5
                    disabled:opacity-60 disabled:cursor-not-allowed
                    active:scale-[0.97] transition-all
                  "
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <SuccessPopup open={showSuccess} onClose={() => setShowSuccess(false)} message="Status berhasil diupdate" duration={1500} />
    </>,
    document.body
  )
}