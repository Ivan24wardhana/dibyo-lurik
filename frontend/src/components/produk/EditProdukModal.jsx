// =====================================================
// EditProdukModal.jsx
// Modal form edit produk.
//
// Logic gambar:
//   - Ada gambar → tampilkan gambar + tombol trash (hapus)
//   - Tidak ada gambar → tampilkan upload area (klik untuk upload baru)
//
// Flow hapus gambar:
//   1. Klik trash icon
//   2. ConfirmHapusGambarModal muncul
//   3. Klik "Ya, Hapus" → set gambar_url='', popup tutup
//   4. SuccessPopup "Gambar Berhasil di Hapus" auto-dismiss
//   5. Upload area muncul, user bisa upload gambar baru kalau mau
//   6. User klik "Simpan" untuk apply ke backend
// =====================================================

import { useState, useEffect } from 'react'
import { Trash2, Upload } from 'lucide-react'
import { Modal, Button, Loading, useToast, SuccessPopup } from '../ui'
import ConfirmHapusGambarModal from './ConfirmHapusGambarModal'
import api, { getErrorMessage } from '../../lib/api'
import useMasterData from '../../hooks/useMasterData'

export default function EditProdukModal({ open, onClose, produkId, onSuccess }) {
  const toast = useToast()
  const { kategoriList, motifList, rakList, loading: loadingMaster } = useMasterData()

  const [form, setForm] = useState({
    motif_id: '',
    kategori_id: '',
    rak_id: '',
    jenis_pewarna: 'sintetis',
    gambar_url: '',
    kode_produk: '',
  })
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // States untuk popup hapus gambar
  const [confirmDeleteImage, setConfirmDeleteImage] = useState(false)
  const [showSuccessHapus, setShowSuccessHapus] = useState(false)

  // Fetch detail produk saat modal open
  useEffect(() => {
    if (!open || !produkId) return

    setLoadingDetail(true)
    api
      .get(`/api/produk/${produkId}`)
      .then((res) => {
        const produk = res.data?.data
        if (produk) {
          setForm({
            motif_id: produk.motif?.id || '',
            kategori_id: produk.kategori?.id || '',
            rak_id: produk.rak?.id || '',
            jenis_pewarna: produk.jenis_pewarna || 'sintetis',
            gambar_url: produk.gambar_url || '',
            kode_produk: produk.kode_produk || '',
          })
        }
      })
      .catch((err) => toast.error('Gagal load: ' + getErrorMessage(err)))
      .finally(() => setLoadingDetail(false))
  }, [open, produkId, toast])

  // Reset state saat modal close
  useEffect(() => {
    if (!open) {
      setErrors({})
      setConfirmDeleteImage(false)
      setShowSuccessHapus(false)
    }
  }, [open])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }))
  }

  // ===== Hapus gambar flow =====
  const handleTrashClick = () => {
    setConfirmDeleteImage(true)
  }

  const handleConfirmHapusGambar = () => {
    setForm((prev) => ({ ...prev, gambar_url: '' }))
    setConfirmDeleteImage(false)
    setShowSuccessHapus(true)
  }

  // ===== Upload gambar baru =====
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi
    if (!file.type.startsWith('image/')) {
      toast.error('File harus gambar (jpg, png, dll)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5 MB')
      return
    }

    // Read sebagai base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, gambar_url: reader.result }))
    }
    reader.readAsDataURL(file)
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
        gambar_url: form.gambar_url || null,
      }

      await api.patch(`/api/produk/${produkId}`, payload)
      toast.success('Produk berhasil diupdate')
      onSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error('Gagal: ' + getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={submitting ? undefined : onClose}
        title="Edit Produk"
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
              disabled={loadingDetail || loadingMaster}
            >
              Simpan
            </Button>
          </>
        }
      >
        {loadingDetail ? (
          <Loading variant="centered" message="Memuat data..." />
        ) : (
          <div className="space-y-4">
            {/* ===== Gambar / Upload Area ===== */}
            {form.gambar_url ? (
              // Ada gambar - tampilkan dengan tombol trash
              <div className="relative rounded-[10px] overflow-hidden h-[200px] bg-gradient-to-br from-[#e3c2ac] to-[#a47352]">
                <img
                  src={form.gambar_url}
                  alt={form.kode_produk}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleTrashClick}
                  className="
                    absolute top-3 right-3 w-9 h-9 rounded-full
                    bg-[#ff695e] hover:bg-[#e54c41]
                    text-white flex items-center justify-center
                    shadow-lg active:scale-90
                    transition-all duration-150
                  "
                  aria-label="Hapus gambar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Tidak ada gambar - tampilkan upload area
              <label
                htmlFor="edit-produk-image-upload"
                className="
                  flex flex-col items-center justify-center
                  h-[200px] rounded-[10px] cursor-pointer
                  border-2 border-dashed border-[#e3c2ac]
                  hover:border-[#a47352] hover:bg-[rgba(227,194,172,0.15)]
                  transition-all duration-150
                "
              >
                <Upload className="w-8 h-8 text-[#a47352]/50 mb-2" />
                <p className="text-[#a47352] text-sm font-medium">
                  Klik untuk upload foto kain
                </p>
                <p className="text-[#a47352]/40 text-xs mt-1">Maks. 5 MB</p>
                <input
                  id="edit-produk-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}

            {/* Kode Produk readonly */}
            <FormField label="Kode Produk">
              <input
                type="text"
                value={form.kode_produk}
                readOnly
                className="
                  w-full h-[46px] px-4
                  bg-[rgba(227,194,172,0.35)] border border-[#a47352]
                  rounded-[10px] text-[#a47352] text-base
                  cursor-not-allowed opacity-70
                "
              />
            </FormField>

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
        )}
      </Modal>

      {/* Popup konfirmasi hapus gambar (Figma 951:1158) */}
      <ConfirmHapusGambarModal
        open={confirmDeleteImage}
        onClose={() => setConfirmDeleteImage(false)}
        onConfirm={handleConfirmHapusGambar}
      />

      {/* Popup sukses hapus gambar (Figma 951:1159) */}
      <SuccessPopup
        open={showSuccessHapus}
        onClose={() => setShowSuccessHapus(false)}
        message="Gambar Berhasil di Hapus"
        duration={1500}
      />
    </>
  )
}

// =====================================================
// Helper components
// =====================================================
function FormField({ label, children, error }) {
  return (
    <div>
      <label className="block text-[#a47352] text-sm font-medium mb-2">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
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