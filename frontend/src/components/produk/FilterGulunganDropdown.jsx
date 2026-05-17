// =====================================================
// TambahGulunganModal.jsx
// Modal tambah gulungan baru ke produk.
//
// Logic auto-fill:
//   - Motif, Pewarna, Rak, Kategori → inherit dari produk (TIDAK ditampilkan input)
//   - No Gulungan → auto-increment di backend
//   - Harga Per Meter → auto-fetch via DB function get_harga_per_meter()
//                       saat user pilih lebar, tapi tetap EDITABLE
//
// Field yang user input:
//   1. Lebar (70 atau 110 cm) - dropdown
//   2. Panjang Total (meter) - input number
//   3. Harga Per Meter - input dengan prefix Rp (auto-suggest, editable)
//
// Cara pakai:
//   <TambahGulunganModal
//     open={open}
//     onClose={...}
//     produk={produk}    // produk parent (untuk display info + lookup harga)
//     onSuccess={() => refetch()}
//   />
// =====================================================

import { useState, useEffect } from 'react'
import { Modal, Button, useToast } from '../ui'
import api, { getErrorMessage } from '../../lib/api'
import { formatJenisPewarna } from '../../lib/formatters'

const initialForm = {
  lebar: 110,
  panjang_total: '',
  harga_per_meter: '',
  use_auto_harga: true, // checkbox: pakai harga auto atau manual
}

export default function TambahGulunganModal({ open, onClose, produk, onSuccess }) {
  const toast = useToast()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [autoHarga, setAutoHarga] = useState(null) // hasil lookup harga
  const [fetchingHarga, setFetchingHarga] = useState(false)

  // Reset saat modal close
  useEffect(() => {
    if (!open) {
      setForm(initialForm)
      setErrors({})
      setAutoHarga(null)
    }
  }, [open])

  // Auto-fetch harga setiap user ganti lebar
  useEffect(() => {
    if (!open || !produk?.id || !form.lebar) return

    let cancelled = false
    setFetchingHarga(true)

    // Fetch via endpoint daftar-harga atau lewat dummy: query langsung pakai supabase rpc tidak available di frontend
    // Sini saya pakai endpoint helper /api/daftar-harga/lookup (asumsi sudah ada)
    // Atau kalau belum ada, frontend hitung manual based on harga template
    api
      .get(
        `/api/daftar-harga/lookup?jenis_pewarna=${produk.jenis_pewarna}&motif_id=${produk.motif?.id}&lebar=${form.lebar}`
      )
      .then((res) => {
        if (cancelled) return
        const harga = res.data?.data?.harga_per_meter || 0
        setAutoHarga(harga)
        // Auto-fill kalau user belum manual edit
        if (form.use_auto_harga) {
          setForm((prev) => ({ ...prev, harga_per_meter: String(harga) }))
        }
      })
      .catch(() => {
        // Endpoint mungkin belum ada - skip auto-fill
        if (!cancelled) setAutoHarga(null)
      })
      .finally(() => {
        if (!cancelled) setFetchingHarga(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, produk?.id, produk?.jenis_pewarna, produk?.motif?.id, form.lebar, form.use_auto_harga])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }))
  }

  const handleToggleAutoHarga = (checked) => {
    setForm((prev) => ({
      ...prev,
      use_auto_harga: checked,
      harga_per_meter: checked && autoHarga ? String(autoHarga) : prev.harga_per_meter,
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!form.lebar) {
      newErrors.lebar = 'Lebar wajib dipilih'
    }

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
      const payload = {
        produk_id: produk.id,
        lebar: parseInt(form.lebar),
        panjang_total: parseFloat(form.panjang_total),
        harga_per_meter: parseFloat(form.harga_per_meter),
      }

      await api.post('/api/gulungan', payload)
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

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title="Tambah Gulungan"
      size="md"
      closeOnBackdrop={!submitting}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
          >
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* ===== Info Produk Parent (read-only) ===== */}
        <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] p-4">
          <p className="text-[#a47352]/70 text-xs font-medium uppercase tracking-wide mb-2">
            Gulungan untuk produk:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-[#a47352]/60">Kode: </span>
              <span className="text-[#a47352] font-medium">
                {produk.kode_produk}
              </span>
            </div>
            <div>
              <span className="text-[#a47352]/60">Pewarna: </span>
              <span className="text-[#a47352] font-medium">
                {formatJenisPewarna(produk.jenis_pewarna)}
              </span>
            </div>
            <div>
              <span className="text-[#a47352]/60">Motif: </span>
              <span className="text-[#a47352] font-medium">
                {produk.motif?.nama || '-'}
              </span>
            </div>
            <div>
              <span className="text-[#a47352]/60">Rak: </span>
              <span className="text-[#a47352] font-medium">
                {produk.rak?.nama || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* ===== Lebar Gulungan ===== */}
        <FormSelect
          label="Lebar Gulungan"
          value={form.lebar}
          onChange={(v) => handleChange('lebar', parseInt(v))}
          options={[
            { value: 70, label: '70 cm' },
            { value: 110, label: '110 cm' },
          ]}
          error={errors.lebar}
          required
        />

        {/* ===== Panjang Gulungan ===== */}
        <FormField label="Panjang Gulungan (meter)" error={errors.panjang_total} required>
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
              transition-all duration-150
            `}
          />
        </FormField>

        {/* ===== Harga Per Meter ===== */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[#a47352] text-sm font-medium">
              Harga Per Meter
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            {autoHarga && autoHarga > 0 && (
              <label className="flex items-center gap-2 text-xs text-[#a47352]/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.use_auto_harga}
                  onChange={(e) => handleToggleAutoHarga(e.target.checked)}
                  className="rounded text-[#a47352]"
                />
                Pakai harga otomatis
              </label>
            )}
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a47352] text-base font-medium pointer-events-none">
              Rp
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.harga_per_meter}
              onChange={(e) => {
                handleChange('harga_per_meter', e.target.value)
                // Kalau user manual edit, matikan auto
                if (form.use_auto_harga) {
                  setForm((prev) => ({ ...prev, use_auto_harga: false }))
                }
              }}
              placeholder="0"
              disabled={fetchingHarga}
              className={`
                w-full h-[46px] pl-12 pr-4
                bg-[rgba(227,194,172,0.35)] border 
                ${errors.harga_per_meter ? 'border-red-500' : 'border-[#a47352]'}
                rounded-[10px] text-[#a47352] text-base
                focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
                disabled:opacity-60
                transition-all duration-150
              `}
            />
          </div>

          {errors.harga_per_meter && (
            <p className="text-red-500 text-xs mt-1">{errors.harga_per_meter}</p>
          )}

          {fetchingHarga && (
            <p className="text-[#a47352]/60 text-xs mt-1">
              Mencari harga...
            </p>
          )}
          {!fetchingHarga && autoHarga && autoHarga > 0 && (
            <p className="text-[#91b960] text-xs mt-1">
              💡 Harga otomatis dari Daftar Harga: Rp {autoHarga.toLocaleString('id-ID')}
            </p>
          )}
          {!fetchingHarga && autoHarga === 0 && (
            <p className="text-[#b99e5f] text-xs mt-1">
              ⚠️ Harga belum di-setup di Daftar Harga, silakan input manual
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

// =====================================================
// Helper components
// =====================================================
function FormField({ label, children, error, required }) {
  return (
    <div>
      <label className="block text-[#a47352] text-sm font-medium mb-2">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function FormSelect({ label, value, onChange, options, error, required }) {
  return (
    <FormField label={label} error={error} required={required}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full h-[46px] px-4 pr-10
            bg-[rgba(227,194,172,0.35)] border 
            ${error ? 'border-red-500' : 'border-[#a47352]'}
            rounded-[10px] text-[#a47352] text-base
            focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
            appearance-none cursor-pointer
            transition-all duration-150
          `}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a47352] pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </FormField>
  )
}