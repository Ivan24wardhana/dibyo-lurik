// =====================================================
// TambahGulunganModal.jsx
// Fix: auto-fill harga pakai local pricelist (bukan API call).
// Lebih reliable, tidak tergantung network/backend lookup.
// =====================================================

import { useState, useEffect } from 'react'
import { Modal, Button, useToast } from '../ui'
import api, { getErrorMessage } from '../../lib/api'
import { getHargaDefault } from '../../lib/pricelist'

const getInitialForm = (jenisPewarna, motifNama) => ({
  lebar: 110,
  panjang_total: '',
  harga_per_meter: String(getHargaDefault(jenisPewarna, 110, motifNama)),
})

export default function TambahGulunganModal({ open, onClose, produk, onSuccess }) {
  const toast = useToast()
  const [form, setForm] = useState({
    lebar: 110,
    panjang_total: '',
    harga_per_meter: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Reset + auto-fill harga awal saat modal open
  useEffect(() => {
    if (!open) {
      setForm({ lebar: 110, panjang_total: '', harga_per_meter: '' })
      setErrors({})
      return
    }
    if (produk) {
      const harga = getHargaDefault(produk.jenis_pewarna, 110, produk.motif?.nama)
      setForm({ lebar: 110, panjang_total: '', harga_per_meter: harga > 0 ? String(harga) : '' })
    }
  }, [open, produk])

  // Auto-fill harga saat lebar berubah
  const handleLebarChange = (val) => {
    const lebar = parseInt(val)
    const harga = produk ? getHargaDefault(produk.jenis_pewarna, lebar, produk.motif?.nama) : 0
    setForm((prev) => ({
      ...prev,
      lebar,
      harga_per_meter: harga > 0 ? String(harga) : prev.harga_per_meter,
    }))
    if (errors.lebar) setErrors((prev) => ({ ...prev, lebar: null }))
  }

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!form.lebar) newErrors.lebar = 'Lebar wajib dipilih'

    const panjangNum = parseFloat(form.panjang_total)
    if (!form.panjang_total) {
      newErrors.panjang_total = 'Panjang wajib diisi'
    } else if (isNaN(panjangNum) || panjangNum <= 0) {
      newErrors.panjang_total = 'Panjang harus angka > 0'
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
      await api.post('/api/gulungan', {
        produk_id: produk.id,
        lebar: parseInt(form.lebar),
        panjang_total: parseFloat(form.panjang_total),
        harga_per_meter: parseFloat(form.harga_per_meter),
      })
      toast.success('Gulungan berhasil ditambahkan')
      onSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error('Gagal: ' + getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (!produk) return null

  const formatJenis = (j) => j === 'sintetis' ? 'Sintetis' : 'Alami'
  const hargaSuggest = getHargaDefault(produk.jenis_pewarna, form.lebar, produk.motif?.nama)

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title="Tambah Gulungan"
      size="md"
      closeOnBackdrop={!submitting}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>Simpan</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Info produk parent readonly */}
        <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] p-4">
          <p className="text-[#a47352]/70 text-xs font-medium uppercase tracking-wide mb-2">
            Gulungan untuk produk:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-[#a47352]/60">Kode: </span><span className="text-[#a47352] font-medium">{produk.kode_produk}</span></div>
            <div><span className="text-[#a47352]/60">Pewarna: </span><span className="text-[#a47352] font-medium">{formatJenis(produk.jenis_pewarna)}</span></div>
            <div><span className="text-[#a47352]/60">Motif: </span><span className="text-[#a47352] font-medium">{produk.motif?.nama || '-'}</span></div>
            <div><span className="text-[#a47352]/60">Rak: </span><span className="text-[#a47352] font-medium">{produk.rak?.nama || '-'}</span></div>
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
          {hargaSuggest > 0 && (
            <p className="text-[#91b960] text-xs mt-1">
              💡 Harga pricelist: Rp {hargaSuggest.toLocaleString('id-ID')}/m
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