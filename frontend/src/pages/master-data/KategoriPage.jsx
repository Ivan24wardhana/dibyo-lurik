// =====================================================
// KategoriPage.jsx
// Halaman Master Kategori, match Figma 1310:5136 + popups.
//
// Layout:
//   Card container:
//     Header: "List Kategori" + "+ Tambah Kategori" button
//     Table: header coklat (No | Kategori | Aksi) + rows
//
// Popups:
//   Tambah: modal kecil (title + garis + label + input + Simpan)
//   Edit: modal kecil sama, pre-filled
//   Berhasil: SuccessPopup (thumbs up, auto-dismiss)
//   Hapus: ConfirmDialog
// =====================================================

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { SuccessPopup, ConfirmDialog, Loading, EmptyState, useToast } from '../../components/ui'
import { createPortal } from 'react-dom'
import api, { getErrorMessage } from '../../lib/api'

export default function KategoriPage() {
  return (
    <MasterTablePage
      title="Kategori"
      endpoint="/api/kategori"
      entityLabel="kategori"
      columnLabel="Kategori"
      inputLabel="Nama Kategori"
      inputPlaceholder="contoh: Kain Lurik"
    />
  )
}

// =====================================================
// Shared MasterTablePage — reusable untuk Kategori, Motif, Rak
// =====================================================
export function MasterTablePage({
  title,
  endpoint,
  entityLabel,
  columnLabel,
  inputLabel,
  inputPlaceholder,
}) {
  const toast = useToast()

  // List state
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Tambah state
  const [tambahOpen, setTambahOpen] = useState(false)
  const [tambahName, setTambahName] = useState('')
  const [tambahError, setTambahError] = useState('')
  const [tambahLoading, setTambahLoading] = useState(false)
  const [showSuccessTambah, setShowSuccessTambah] = useState(false)

  // Edit state
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [showSuccessEdit, setShowSuccessEdit] = useState(false)

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showSuccessDelete, setShowSuccessDelete] = useState(false)

  // Fetch list
  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`${endpoint}?limit=100`)
      const result = res.data?.data || {}
      setItems(result.items || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  // ===== Tambah =====
  const openTambah = () => {
    setTambahName('')
    setTambahError('')
    setTambahOpen(true)
  }

  const handleTambah = async () => {
    if (!tambahName.trim()) {
      setTambahError(`${inputLabel} wajib diisi`)
      return
    }
    setTambahLoading(true)
    setTambahError('')
    try {
      await api.post(endpoint, { nama: tambahName.trim() })
      setTambahOpen(false)
      setTambahName('')
      setShowSuccessTambah(true)
      fetchList()
    } catch (err) {
      const msg = getErrorMessage(err)
      if (msg.toLowerCase().includes('sudah ada') || msg.toLowerCase().includes('conflict')) {
        setTambahError(`${title} dengan nama ini sudah ada`)
      } else {
        setTambahError(msg)
      }
    } finally {
      setTambahLoading(false)
    }
  }

  // ===== Edit =====
  const openEdit = (item) => {
    setEditItem(item)
    setEditName(item.nama)
    setEditError('')
    setEditOpen(true)
  }

  const handleEdit = async () => {
    if (!editName.trim()) {
      setEditError(`${inputLabel} wajib diisi`)
      return
    }
    setEditLoading(true)
    setEditError('')
    try {
      await api.patch(`${endpoint}/${editItem.id}`, { nama: editName.trim() })
      setEditOpen(false)
      setShowSuccessEdit(true)
      fetchList()
    } catch (err) {
      const msg = getErrorMessage(err)
      if (msg.toLowerCase().includes('sudah ada') || msg.toLowerCase().includes('conflict')) {
        setEditError(`${title} dengan nama ini sudah ada`)
      } else {
        setEditError(msg)
      }
    } finally {
      setEditLoading(false)
    }
  }

  // ===== Delete =====
  const openDelete = (item) => {
    setDeleteItem(item)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setDeleteLoading(true)
    try {
      await api.delete(`${endpoint}/${deleteItem.id}`)
      setDeleteOpen(false)
      setShowSuccessDelete(true)
      fetchList()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleteOpen(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      {/* Container card */}
      <div className="bg-[rgba(227,194,172,0.35)] border border-[#a47352] rounded-[10px] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#a47352]/30">
          <h2 className="text-[#a47352] text-2xl font-medium">
            List {title}
          </h2>
          <button
            type="button"
            onClick={openTambah}
            className="
              flex items-center gap-2
              bg-[#a47352] hover:bg-[#8d6044]
              text-white text-base font-medium
              rounded-[10px] px-5 py-3
              active:scale-[0.97]
              transition-all duration-150
            "
          >
            <Plus className="w-5 h-5" />
            Tambah {title}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {/* Table header */}
          <div className="bg-[#a47352] text-white grid grid-cols-[100px_1fr_200px] px-6 py-4 text-base font-medium">
            <div className="text-center">No.</div>
            <div>{columnLabel}</div>
            <div className="text-center">Aksi</div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="bg-white py-16">
              <Loading variant="centered" message={`Memuat ${entityLabel}...`} />
            </div>
          ) : error ? (
            <div className="bg-white p-6 text-red-700 text-sm">{error}</div>
          ) : items.length === 0 ? (
            <div className="bg-white py-16">
              <EmptyState
                title={`Belum ada ${entityLabel}`}
                message={`Klik "+ Tambah ${title}" untuk menambahkan ${entityLabel} pertama`}
              />
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={item.id}
                className="
                  bg-white grid grid-cols-[100px_1fr_200px]
                  px-6 py-4 items-center
                  border-b border-[#a47352]/20 last:border-b-0
                  hover:bg-[#fdfaf6]
                  transition-colors duration-150
                "
              >
                <div className="text-center text-[#a47352] font-medium">
                  {idx + 1}.
                </div>
                <div className="text-[#a47352] font-medium text-base">
                  {item.nama}
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="
                      bg-[#f0a864] hover:bg-[#d8924f]
                      text-white rounded-[8px] px-3 py-1.5
                      inline-flex items-center gap-1 text-sm
                      active:scale-95 transition-all duration-150
                    "
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openDelete(item)}
                    className="
                      bg-[#ff695e] hover:bg-[#e54c41]
                      text-white rounded-[8px] px-3 py-1.5
                      inline-flex items-center gap-1 text-sm
                      active:scale-95 transition-all duration-150
                    "
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== Popup Tambah (sesuai Figma 1310:12073) ===== */}
      <KategoriFormModal
        open={tambahOpen}
        onClose={() => !tambahLoading && setTambahOpen(false)}
        title={`Tambah ${title}`}
        inputLabel={inputLabel}
        inputPlaceholder={inputPlaceholder}
        value={tambahName}
        onChange={(v) => { setTambahName(v); setTambahError('') }}
        onSubmit={handleTambah}
        loading={tambahLoading}
        error={tambahError}
      />

      {/* ===== Popup Edit (sesuai Figma 1310:12179) ===== */}
      <KategoriFormModal
        open={editOpen}
        onClose={() => !editLoading && setEditOpen(false)}
        title={`Edit ${title}`}
        inputLabel={inputLabel}
        inputPlaceholder={inputPlaceholder}
        value={editName}
        onChange={(v) => { setEditName(v); setEditError('') }}
        onSubmit={handleEdit}
        loading={editLoading}
        error={editError}
      />

      {/* ===== SuccessPopup Tambah (Figma 1310:12284) ===== */}
      <SuccessPopup
        open={showSuccessTambah}
        onClose={() => setShowSuccessTambah(false)}
        message={`${title} berhasil ditambahkan`}
        duration={1500}
      />

      {/* ===== SuccessPopup Edit (Figma 1310:13170) ===== */}
      <SuccessPopup
        open={showSuccessEdit}
        onClose={() => setShowSuccessEdit(false)}
        message={`${title} berhasil diupdate`}
        duration={1500}
      />

      {/* ===== SuccessPopup Hapus (Figma 1310:13383) ===== */}
      <SuccessPopup
        open={showSuccessDelete}
        onClose={() => setShowSuccessDelete(false)}
        message={`${title} berhasil dihapus`}
        duration={1500}
      />

      {/* ===== Confirm Hapus (Figma 1310:13345) ===== */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => !deleteLoading && setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Hapus ${title}?`}
        message={
          deleteItem
            ? `${title} "${deleteItem.nama}" akan dihapus permanen. Tidak bisa dihapus jika masih dipakai di produk. Lanjutkan?`
            : 'Apakah Anda yakin?'
        }
        confirmText="Ya, Hapus"
        loading={deleteLoading}
      />
    </div>
  )
}

// =====================================================
// KategoriFormModal — popup kecil Tambah/Edit
// Match Figma popup design: modal kecil, title + garis + label + input + Simpan
// =====================================================
function KategoriFormModal({
  open,
  onClose,
  title,
  inputLabel,
  inputPlaceholder,
  value,
  onChange,
  onSubmit,
  loading,
  error,
}) {
  // ESC key
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (typeof window === 'undefined' || !open) return null

  return createPortal(
    <>
      {/* Backdrop dengan blur */}
      <div
        className="fixed inset-0 z-[9998] bg-[rgba(174,131,78,0.53)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal kecil - match Figma: white card, rounded-[20px], shadow */}
      <div
        className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999]
          bg-white rounded-[20px]
          shadow-[2px_4px_4px_0px_rgba(0,0,0,0.25)]
          w-[372px]
          p-5
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Title + X button */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#a47352] text-2xl font-medium">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="
              text-[#a47352] hover:text-[#5b2400]
              active:scale-90 transition-all duration-150
            "
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Garis separator */}
        <div className="h-px bg-[#a47352]/30 mb-4" />

        {/* Label + Input */}
        <div className="mb-4">
          <label className="block text-[#a47352] text-base font-medium mb-2">
            {inputLabel}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && onSubmit()}
            placeholder={inputPlaceholder}
            autoFocus
            className={`
              w-full h-[46px] px-4
              bg-[rgba(227,194,172,0.35)] border
              ${error ? 'border-red-500' : 'border-[#a47352]'}
              rounded-[10px] text-[#a47352] text-base
              focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
              transition-all duration-150
            `}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        {/* Simpan button - right aligned sesuai Figma */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="
              bg-[#a47352] hover:bg-[#8d6044]
              text-white text-base font-medium
              rounded-[10px] px-6 py-2
              disabled:opacity-60 disabled:cursor-not-allowed
              active:scale-[0.97]
              transition-all duration-150
            "
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}