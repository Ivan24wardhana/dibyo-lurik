// =====================================================
// TambahProdukModal.jsx
// Modal form tambah produk baru.
//
// Field:
//   - Foto Produk (upload dengan compression, optional)
//   - Motif (dropdown)
//   - Kategori (dropdown)
//   - Rak (dropdown)
//   - Jenis Pewarna (dropdown: sintetis/alami)
//
// Image compression:
//   - Resize to max 1024px (long side)
//   - Convert to JPEG quality 0.8
//   - Hasil base64 < 500KB
// =====================================================

import { useState, useEffect } from 'react'
import { Upload, X as XIcon } from 'lucide-react'
import { Modal, Button, useToast } from '../ui'
import api, { getErrorMessage } from '../../lib/api'
import useMasterData from '../../hooks/useMasterData'

const initialForm = {
  motif_id: '',
  kategori_id: '',
  rak_id: '',
  jenis_pewarna: 'sintetis',
}

// =====================================================
// Image compression helper
// Resize gambar ke max 1024px + convert JPEG quality 0.8
// Mengurangi ukuran base64 dari ~3MB jadi ~300-500KB
// =====================================================
function compressImage(file, maxSize = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Hitung dimensi baru (proporsional)
        let width = img.width
        let height = img.height
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }

        // Draw ke canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Convert ke JPEG dataURL
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function TambahProdukModal({ open, onClose, onSuccess }) {
  const toast = useToast()
  const { kategoriList, motifList, rakList, loading: loadingMaster } = useMasterData()

  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageProcessing, setImageProcessing] = useState(false)

  // Reset form saat modal close
  useEffect(() => {
    if (!open) {
      setForm(initialForm)
      setErrors({})
      setImagePreview(null)
    }
  }, [open])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }))
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('File harus gambar (jpg, png, dll)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran gambar terlalu besar (maks 10 MB)')
      return
    }

    setImageProcessing(true)
    try {
      const compressed = await compressImage(file, 1024, 0.8)
      setImagePreview(compressed)

      // Cek ukuran hasil compression
      const sizeKB = Math.round(compressed.length / 1024)
      console.log(`[image] compressed to ${sizeKB} KB`)
    } catch (err) {
      toast.error('Gagal proses gambar')
      console.error(err)
    } finally {
      setImageProcessing(false)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
  }

  const validateForm = () => {
    const newErrors = {}
    if (!form.motif_id) newErrors.motif_id = 'Motif wajib dipilih'
    if (!form.kategori_id) newErrors.kategori_id = 'Kategori wajib dipilih'
    if (!form.rak_id) newErrors.rak_id = 'Rak wajib dipilih'
    if (!form.jenis_pewarna) newErrors.jenis_pewarna = 'Jenis pewarna wajib dipilih'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const payload = {
        motif_id: form.motif_id,
        kategori_id: form.kategori_id,
        rak_id: form.rak_id,
        jenis_pewarna: form.jenis_pewarna,
        gambar_url: imagePreview || null,
      }

      console.log('[produk POST] payload:', {
        ...payload,
        gambar_url: payload.gambar_url
          ? `[base64 ${Math.round(payload.gambar_url.length / 1024)} KB]`
          : null,
      })

      await api.post('/api/produk', payload)
      toast.success('Produk berhasil dibuat')
      onSuccess?.()
      onClose?.()
    } catch (err) {
      // Cek detail error dari backend
      const errorData = err?.response?.data
      console.error('[produk POST] error response:', errorData)

      let msg = getErrorMessage(err)
      if (errorData?.details && typeof errorData.details === 'object') {
        // Tampilkan detail validation errors
        const detailMsgs = Object.entries(errorData.details)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
        msg += ` (${detailMsgs})`
      }
      toast.error('Gagal: ' + msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title="Tambah Produk"
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
            disabled={loadingMaster || imageProcessing}
          >
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Foto Produk */}
        <div>
          <p className="text-[#a47352] text-sm font-medium mb-2">Foto Produk</p>

          {imagePreview ? (
            <div className="relative rounded-[10px] overflow-hidden h-[180px] bg-gray-100">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                aria-label="Hapus gambar"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="produk-image-upload"
              className={`
                flex flex-col items-center justify-center
                h-[180px] rounded-[10px] cursor-pointer
                border-2 border-dashed border-[#e3c2ac]
                hover:border-[#a47352] hover:bg-[rgba(227,194,172,0.15)]
                transition-all duration-150
                ${imageProcessing ? 'opacity-60 cursor-wait' : ''}
              `}
            >
              <Upload className="w-8 h-8 text-[#a47352]/50 mb-2" />
              <p className="text-[#e3c2ac] text-sm font-medium">
                {imageProcessing ? 'Memproses gambar...' : 'Klik untuk upload foto kain'}
              </p>
              <p className="text-[#a47352]/40 text-xs mt-1">Auto compress, maks 10 MB</p>
              <input
                id="produk-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={imageProcessing}
                className="hidden"
              />
            </label>
          )}
        </div>

        <FormSelect
          label="Motif"
          value={form.motif_id}
          onChange={(v) => handleChange('motif_id', v)}
          options={motifList.map((m) => ({ value: m.id, label: m.nama }))}
          error={errors.motif_id}
          loading={loadingMaster}
          required
        />
        <FormSelect
          label="Kategori"
          value={form.kategori_id}
          onChange={(v) => handleChange('kategori_id', v)}
          options={kategoriList.map((k) => ({ value: k.id, label: k.nama }))}
          error={errors.kategori_id}
          loading={loadingMaster}
          required
        />
        <FormSelect
          label="Rak"
          value={form.rak_id}
          onChange={(v) => handleChange('rak_id', v)}
          options={rakList.map((r) => ({ value: r.id, label: r.nama }))}
          error={errors.rak_id}
          loading={loadingMaster}
          required
        />
        <FormSelect
          label="Jenis Pewarna"
          value={form.jenis_pewarna}
          onChange={(v) => handleChange('jenis_pewarna', v)}
          options={[
            { value: 'sintetis', label: 'Sintetis' },
            { value: 'alami', label: 'Alami' },
          ]}
          error={errors.jenis_pewarna}
          required
        />
      </div>
    </Modal>
  )
}

function FormSelect({ label, value, onChange, options, error, loading, required }) {
  const borderClass = error ? 'border-red-500' : 'border-[#a47352]'

  return (
    <div>
      <label className="block text-[#a47352] text-sm font-medium mb-2">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className={`
            w-full h-[46px] px-4 pr-10
            bg-[rgba(227,194,172,0.35)] border ${borderClass}
            rounded-[10px] text-[#a47352] text-base
            focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
            appearance-none cursor-pointer
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-all duration-150
          `}
        >
          <option value="">{loading ? 'Memuat...' : '-- Pilih --'}</option>
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
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}