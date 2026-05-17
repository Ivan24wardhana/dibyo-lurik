// =====================================================
// EditGulunganModal.jsx
// Fix: auto-fill harga pakai local pricelist saat lebar berubah.
// Saat pertama buka: pakai harga existing dari gulungan.
// Saat ganti lebar: auto-suggest harga baru dari pricelist.
// =====================================================

import { useState, useEffect, useRef } from 'react'
import { Modal, Button, Loading, useToast } from '../ui'
import api, { getErrorMessage } from '../../lib/api'
import { formatJenisPewarna } from '../../lib/formatters'
import { getHargaDefault } from '../../lib/pricelist'

const initialForm = {
  lebar: 110,
  panjang_total: '',
  harga_per_meter: '',
  nomor_gulungan: '',
  panjang_sisa: 0,
}

export default function EditGulunganModal({ open, onClose, gulunganId, produk, onSuccess }) {
  const toast = useToast()
  const [form, setForm] = useState(initialForm)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Track lebar awal saat load untuk deteksi perubahan
  const originalLebarRef = useRef(null)

  // Fetch detail gulungan saat open
  useEffect(() => {
    if (!open || !gulunganId) return

    setLoadingDetail(true)
    api
      .get(`/api/gulungan/${gulunganId}`)
      .then((res) => {
        const g = res.data?.data
        if (g) {
          originalLebarRef.current = g.lebar
          setForm({
            lebar: g.lebar || 110,
            panjang_total: String(g.panjang_total || ''),
            harga_per_meter: String(g.harga_per_meter || ''),
            nomor_gulungan: g.nomor_gulungan || '',
            panjang_sisa: g.panjang_sisa || 0,
          })
        }
      })
      .catch((err) => toast.error('Gagal load: ' + getErrorMessage(err)))
      .finally(() => setLoadingDetail(false))
  }, [open, gulunganId, toast])

  // Reset saat close
  useEffect(() => {
    if (!open) {
      setForm(initialForm)
      setErrors({})
      originalLebarRef.current = null
    }
  }, [open])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }))
  }

  // Saat lebar berubah: auto-suggest harga dari pricelist
  const handleLebarChange = (val) => {
    const lebar = parseInt(val)
    setForm((prev) => {
      const newForm = { ...prev, lebar }
      // Auto-fill harga HANYA kalau lebar berubah dari nilai awal
      if (lebar !== originalLebarRef.current && produk) {
        const harga = getHargaDefault(produk.jenis_pewarna, lebar, produk.motif?.nama)
        if (harga > 0) {
          newForm.harga_per_meter = String(harga)
        }
      }
      return newForm
    })
    if (errors.lebar) setErrors((prev) => ({ ...prev, lebar: null }))
  }

  // Min panjang_total
  const panjangTerjual = parseFloat(form.panjang_total || 0) - parseFloat(form.panjang_sisa || 0)
  const minPanjangTotal = panjangTerjual > 0 ? panjangTerjual : 0.01

  const validateForm = () => {
    const newErrors = {}
    if (!form.lebar) newErrors.lebar = 'Lebar wajib dipilih'

    const panjangNum = parseFloat(form.panjang_total)
    if (!form.panjang_total) {
      newErrors.panjang_total = 'Panjang wajib diisi'
    } else if (isNaN(panjangNum) || panjangNum <= 0) {
      newErrors.panjang_total = 'Panjang harus angka > 0'
    } else if (panjangNum < minPanjangTotal) {
      newErrors.panjang_total = `Tidak boleh kurang dari ${minPanjangTotal} m (sudah terjual)`
    }

    const hargaNum = parseFloat(form.harga_per_meter)
    if (!form.harga_per_meter) {
      newErrors.harga_per_meter = 'Harga wajib diisi'
    } else if (isNaN(hargaNum) || hargaNum < 0) {
      newErrors.harga_per_meter = 'Harga tidak valid'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      await api.patch(`/api/gulungan/${gulunganId}`, {
        lebar: parseInt(form.lebar),
        panjang_total: parseFloat(form.panjang_total),
        harga_per_meter: parseFloat(form.harga_per_meter),
      })
      toast.success('Gulungan berhasil diupdate')
      onSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error('Gagal: ' + getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (!produk) return null

  // Harga dari pricelist untuk lebar yang dipilih saat ini
  const hargaSuggest = produk
    ? getHargaDefault(produk.jenis_pewarna, form.lebar, produk.motif?.nama)
    : 0
  const lebarChanged = form.lebar !== originalLebarRef.current

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title="Edit Gulungan"
      size="md"
      closeOnBackdrop={!submitting}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting} disabled={loadingDetail}>
            Simpan
          </Button>
        </>
      }
    >
      {loadingDetail ? (
        <Loading variant="centered" message="Memuat data gulungan..." />
      ) : (
        <div className="space-y-4">
          {/* Info produk parent readonly */}
          <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] p-4">
            <p className="text-[#a47352]/70 text-xs font-medium uppercase tracking-wide mb-2">
              Info Produk (tidak bisa diubah):
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-[#a47352]/60">Kode: </span><span className="text-[#a47352] font-medium">{produk.kode_produk}</span></div>
              <div><span className="text-[#a47352]/60">No Gulungan: </span><span className="text-[#a47352] font-medium">#{form.nomor_gulungan}</span></div>
              <div><span className="text-[#a47352]/60">Pewarna: </span><span className="text-[#a47352] font-medium">{formatJenisPewarna(produk.jenis_pewarna)}</span></div>
              <div><span className="text-[#a47352]/60">Motif: </span><span className="text-[#a47352] font-medium">{produk.motif?.nama || '-'}</span></div>
              <div><span className="text-[#a47352]/60">Rak: </span><span className="text-[#a47352] font-medium">{produk.rak?.nama || '-'}</span></div>
              <div><span className="text-[#a47352]/60">Sisa: </span><span className="text-[#a47352] font-medium">{form.panjang_sisa} m</span></div>
            </div>
          </div>

          {/* Lebar */}
          <div>
            <label className="block text-[#a47352] text-sm font-medium mb-2">
              Lebar Gulungan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={form.lebar}
                onChange={(e) => handleLebarChange(e.target.value)}
                className={`
                  w-full h-[46px] px-4 pr-10 appearance-none cursor-pointer
                  bg-[rgba(227,194,172,0.35)] border
                  ${errors.lebar ? 'border-red-500' : 'border-[#a47352]'}
                  rounded-[10px] text-[#a47352] text-base
                  focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
                `}
              >
                <option value={70}>70 cm</option>
                <option value={110}>110 cm</option>
              </select>
              <ChevronIcon />
            </div>
            {errors.lebar && <p className="text-red-500 text-xs mt-1">{errors.lebar}</p>}
          </div>

          {/* Panjang Total */}
          <div>
            <label className="block text-[#a47352] text-sm font-medium mb-2">
              Panjang Gulungan (meter) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.panjang_total}
              onChange={(e) => handleChange('panjang_total', e.target.value)}
              placeholder="contoh: 30"
              className={`
                w-full h-[46px] px-4
                bg-[rgba(227,194,172,0.35)] border
                ${errors.panjang_total ? 'border-red-500' : 'border-[#a47352]'}
                rounded-[10px] text-[#a47352] text-base
                focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
              `}
            />
            {panjangTerjual > 0 && (
              <p className="text-[#b99e5f] text-xs mt-1">
                ⚠️ Sudah terjual {panjangTerjual} m — minimal {minPanjangTotal} m
              </p>
            )}
            {errors.panjang_total && <p className="text-red-500 text-xs mt-1">{errors.panjang_total}</p>}
          </div>

          {/* Harga Per Meter */}
          <div>
            <label className="block text-[#a47352] text-sm font-medium mb-2">
              Harga Per Meter <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a47352] text-base font-medium pointer-events-none">
                Rp
              </span>
              <input
                type="number"
                step="500"
                min="0"
                value={form.harga_per_meter}
                onChange={(e) => handleChange('harga_per_meter', e.target.value)}
                placeholder="0"
                className={`
                  w-full h-[46px] pl-12 pr-4
                  bg-[rgba(227,194,172,0.35)] border
                  ${errors.harga_per_meter ? 'border-red-500' : 'border-[#a47352]'}
                  rounded-[10px] text-[#a47352] text-base
                  focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
                `}
              />
            </div>
            {errors.harga_per_meter && <p className="text-red-500 text-xs mt-1">{errors.harga_per_meter}</p>}
            {/* Tampilkan hint harga pricelist */}
            {hargaSuggest > 0 && (
              <p className="text-[#91b960] text-xs mt-1">
                💡 Pricelist {lebarChanged ? '(lebar baru)' : 'referensi'}: Rp {hargaSuggest.toLocaleString('id-ID')}/m
                {String(form.harga_per_meter) !== String(hargaSuggest) && (
                  <button
                    type="button"
                    onClick={() => handleChange('harga_per_meter', String(hargaSuggest))}
                    className="ml-2 underline text-[#a47352] hover:text-[#5b2400]"
                  >
                    Pakai ini
                  </button>
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

function ChevronIcon() {
  return (
    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a47352] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}