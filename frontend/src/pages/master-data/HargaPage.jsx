// =====================================================
// HargaPage.jsx
// Halaman Master Daftar Harga (Kepala Produksi).
// Fix: hapus import formatRupiahFull yang tidak ada.
// =====================================================

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  Modal,
  Button,
  Loading,
  EmptyState,
  ConfirmDialog,
  useToast,
} from '../../components/ui'
import useMasterData from '../../hooks/useMasterData'
import api, { getErrorMessage } from '../../lib/api'

// Helper lokal - format Rupiah tanpa desimal
const fmtHarga = (val) => {
  const num = parseFloat(val || 0)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

const JENIS_PEWARNA_OPTIONS = [
  { value: 'sintetis', label: 'Sintetis' },
  { value: 'alami', label: 'Alami' },
]

const LEBAR_OPTIONS = [
  { value: 70, label: '70 cm' },
  { value: 110, label: '110 cm' },
]

const initialForm = {
  jenis_pewarna: 'sintetis',
  lebar: 110,
  motif_id: '',
  harga_per_meter: '',
}

export default function HargaPage() {
  const toast = useToast()
  const { motifList } = useMasterData()

  // List state
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Tambah state
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})
  const [addLoading, setAddLoading] = useState(false)

  // Edit state
  const [editModal, setEditModal] = useState({ open: false, item: null })
  const [editHarga, setEditHarga] = useState('')
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // Delete state
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null })
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Fetch list
  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/daftar-harga?limit=100')
      const result = res.data?.data || {}
      setItems(result.items || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  // Tambah
  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const validateForm = () => {
    const errs = {}
    if (!form.jenis_pewarna) errs.jenis_pewarna = 'Wajib dipilih'
    if (!form.lebar) errs.lebar = 'Wajib dipilih'
    const h = parseFloat(form.harga_per_meter)
    if (!form.harga_per_meter) {
      errs.harga_per_meter = 'Wajib diisi'
    } else if (isNaN(h) || h < 0) {
      errs.harga_per_meter = 'Harga tidak valid'
    }
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAdd = async () => {
    if (!validateForm()) return
    setAddLoading(true)
    try {
      await api.post('/api/daftar-harga', {
        jenis_pewarna: form.jenis_pewarna,
        lebar: parseInt(form.lebar),
        motif_id: form.motif_id || null,
        harga_per_meter: parseFloat(form.harga_per_meter),
      })
      toast.success('Harga berhasil ditambahkan')
      setForm(initialForm)
      fetchList()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setAddLoading(false)
    }
  }

  // Edit
  const openEdit = (item) => {
    setEditHarga(String(item.harga_per_meter))
    setEditError('')
    setEditModal({ open: true, item })
  }

  const handleEdit = async () => {
    const h = parseFloat(editHarga)
    if (!editHarga || isNaN(h) || h < 0) {
      setEditError('Harga tidak valid')
      return
    }
    setEditLoading(true)
    try {
      await api.patch(`/api/daftar-harga/${editModal.item.id}`, {
        harga_per_meter: h,
      })
      toast.success('Harga berhasil diupdate')
      setEditModal({ open: false, item: null })
      fetchList()
    } catch (err) {
      setEditError(getErrorMessage(err))
    } finally {
      setEditLoading(false)
    }
  }

  // Delete
  const handleConfirmDelete = async () => {
    const item = deleteModal.item
    if (!item) return
    setDeleteLoading(true)
    try {
      await api.delete(`/api/daftar-harga/${item.id}`)
      toast.success('Harga berhasil dihapus')
      setDeleteModal({ open: false, item: null })
      fetchList()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleteModal({ open: false, item: null })
    } finally {
      setDeleteLoading(false)
    }
  }

  const getMotifLabel = (item) => {
    if (!item.motif)
      return (
        <span className="text-[#a47352]/50 italic text-sm">
          Umum (semua motif)
        </span>
      )
    return (
      <span className="text-[#a47352] font-medium">{item.motif.nama}</span>
    )
  }

  const getDeleteLabel = (item) => {
    const motifLabel = item.motif ? `Motif ${item.motif.nama}` : 'Umum'
    const jenisLabel = item.jenis_pewarna === 'sintetis' ? 'Sintetis' : 'Alami'
    return `${jenisLabel} - ${item.lebar} cm - ${motifLabel}`
  }

  return (
    <div>
      {/* Info Banner */}
      <div className="bg-[rgba(227,194,172,0.35)] border border-[#a47352]/30 rounded-[10px] p-4 mb-5">
        <p className="text-[#a47352] text-sm font-medium mb-1">
          💡 Cara kerja Daftar Harga:
        </p>
        <p className="text-[#a47352]/80 text-sm">
          Harga dipakai saat <strong>tambah gulungan</strong> (auto-fill). Kalau ada motif spesifik, harga exception-nya dipakai dulu. Kalau tidak ada, fallback ke harga <strong>Umum</strong>.
        </p>
      </div>

      {/* Form Tambah */}
      <div className="bg-white border border-[#a47352]/30 rounded-[10px] p-5 mb-5 shadow-sm">
        <h3 className="text-[#a47352] text-base font-semibold mb-4">
          + Tambah Harga Baru
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Jenis Pewarna */}
          <div>
            <label className="block text-[#a47352] text-sm font-medium mb-1.5">
              Jenis Pewarna *
            </label>
            <div className="relative">
              <select
                value={form.jenis_pewarna}
                onChange={(e) => handleFormChange('jenis_pewarna', e.target.value)}
                className={`
                  w-full h-[44px] px-3 pr-8 appearance-none cursor-pointer
                  bg-[rgba(227,194,172,0.35)] border
                  ${formErrors.jenis_pewarna ? 'border-red-500' : 'border-[#a47352]'}
                  rounded-[10px] text-[#a47352] text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
                `}
              >
                {JENIS_PEWARNA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronIcon />
            </div>
            {formErrors.jenis_pewarna && (
              <p className="text-red-500 text-xs mt-1">{formErrors.jenis_pewarna}</p>
            )}
          </div>

          {/* Lebar */}
          <div>
            <label className="block text-[#a47352] text-sm font-medium mb-1.5">
              Lebar *
            </label>
            <div className="relative">
              <select
                value={form.lebar}
                onChange={(e) => handleFormChange('lebar', parseInt(e.target.value))}
                className={`
                  w-full h-[44px] px-3 pr-8 appearance-none cursor-pointer
                  bg-[rgba(227,194,172,0.35)] border
                  ${formErrors.lebar ? 'border-red-500' : 'border-[#a47352]'}
                  rounded-[10px] text-[#a47352] text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
                `}
              >
                {LEBAR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronIcon />
            </div>
            {formErrors.lebar && (
              <p className="text-red-500 text-xs mt-1">{formErrors.lebar}</p>
            )}
          </div>

          {/* Motif (optional) */}
          <div>
            <label className="block text-[#a47352] text-sm font-medium mb-1.5">
              Motif{' '}
              <span className="text-[#a47352]/50">(opsional)</span>
            </label>
            <div className="relative">
              <select
                value={form.motif_id}
                onChange={(e) => handleFormChange('motif_id', e.target.value)}
                className="
                  w-full h-[44px] px-3 pr-8 appearance-none cursor-pointer
                  bg-[rgba(227,194,172,0.35)] border border-[#a47352]
                  rounded-[10px] text-[#a47352] text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
                "
              >
                <option value="">— Umum —</option>
                {motifList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama}
                  </option>
                ))}
              </select>
              <ChevronIcon />
            </div>
          </div>

          {/* Harga */}
          <div>
            <label className="block text-[#a47352] text-sm font-medium mb-1.5">
              Harga Per Meter *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a47352] text-sm font-medium pointer-events-none">
                Rp
              </span>
              <input
                type="number"
                step="500"
                min="0"
                value={form.harga_per_meter}
                onChange={(e) => handleFormChange('harga_per_meter', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="38500"
                className={`
                  w-full h-[44px] pl-10 pr-3
                  bg-[rgba(227,194,172,0.35)] border
                  ${formErrors.harga_per_meter ? 'border-red-500' : 'border-[#a47352]'}
                  rounded-[10px] text-[#a47352] text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
                `}
              />
            </div>
            {formErrors.harga_per_meter && (
              <p className="text-red-500 text-xs mt-1">{formErrors.harga_per_meter}</p>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={handleAdd}
          loading={addLoading}
        >
          Tambah Harga
        </Button>
      </div>

      {/* Tabel */}
      <div className="bg-white border border-[#a47352]/30 rounded-[10px] overflow-hidden shadow-sm">
        <div className="bg-[#a47352] text-white grid grid-cols-[50px_160px_100px_1fr_180px_180px] px-4 py-3 text-sm font-medium">
          <div className="text-center">No.</div>
          <div>Jenis Pewarna</div>
          <div className="text-center">Lebar</div>
          <div>Motif (Spesifik)</div>
          <div className="text-right">Harga / Meter</div>
          <div className="text-center">Aksi</div>
        </div>

        {loading ? (
          <div className="py-12">
            <Loading variant="centered" message="Memuat daftar harga..." />
          </div>
        ) : error ? (
          <div className="p-4 text-red-700 text-sm">{error}</div>
        ) : items.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="Belum ada daftar harga"
              message="Tambah harga menggunakan form di atas"
            />
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id}
              className="
                grid grid-cols-[50px_160px_100px_1fr_180px_180px]
                px-4 py-3 items-center
                border-b border-[#a47352]/20 last:border-b-0
                hover:bg-[#fdfaf6] transition-colors duration-150
              "
            >
              <div className="text-center text-[#a47352] text-sm font-medium">
                {idx + 1}.
              </div>

              <div>
                <span
                  className="text-white text-xs font-medium px-3 py-1 rounded-[20px]"
                  style={{
                    backgroundColor:
                      item.jenis_pewarna === 'sintetis' ? '#798acc' : '#75438e',
                  }}
                >
                  {item.jenis_pewarna === 'sintetis' ? 'Sintetis' : 'Alami'}
                </span>
              </div>

              <div className="flex justify-center">
                <span
                  className="text-white text-xs font-medium px-3 py-1 rounded-[20px]"
                  style={{
                    backgroundColor: item.lebar === 70 ? '#75438e' : '#798acc',
                  }}
                >
                  {item.lebar} cm
                </span>
              </div>

              <div>{getMotifLabel(item)}</div>

              <div className="text-right text-[#a47352] font-semibold text-base">
                {fmtHarga(item.harga_per_meter)}
              </div>

              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="
                    bg-[#f0a864] hover:bg-[#d8924f]
                    text-white rounded-[8px] px-3 py-1.5
                    inline-flex items-center gap-1
                    active:scale-95 transition-all duration-150 text-sm
                  "
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModal({ open: true, item })}
                  className="
                    bg-[#ff695e] hover:bg-[#e54c41]
                    text-white rounded-[8px] px-3 py-1.5
                    inline-flex items-center gap-1
                    active:scale-95 transition-all duration-150 text-sm
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

      {/* Edit Modal */}
      <Modal
        open={editModal.open}
        onClose={
          editLoading
            ? undefined
            : () => setEditModal({ open: false, item: null })
        }
        title="Edit Harga"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setEditModal({ open: false, item: null })}
              disabled={editLoading}
            >
              Batal
            </Button>
            <Button variant="primary" onClick={handleEdit} loading={editLoading}>
              Simpan
            </Button>
          </>
        }
      >
        {editModal.item && (
          <div className="space-y-4">
            <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] p-4 text-sm">
              <p className="text-[#a47352]/70 text-xs font-medium uppercase tracking-wide mb-2">
                Kombinasi (tidak bisa diubah):
              </p>
              <div className="grid grid-cols-3 gap-2">
                <InfoItem
                  label="Pewarna"
                  value={
                    editModal.item.jenis_pewarna === 'sintetis'
                      ? 'Sintetis'
                      : 'Alami'
                  }
                />
                <InfoItem label="Lebar" value={`${editModal.item.lebar} cm`} />
                <InfoItem
                  label="Motif"
                  value={editModal.item.motif?.nama || 'Umum'}
                />
              </div>
            </div>

            <div>
              <label className="block text-[#a47352] text-sm font-medium mb-2">
                Harga Per Meter *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a47352] text-base font-medium pointer-events-none">
                  Rp
                </span>
                <input
                  type="number"
                  step="500"
                  min="0"
                  value={editHarga}
                  onChange={(e) => {
                    setEditHarga(e.target.value)
                    setEditError('')
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                  className={`
                    w-full h-[46px] pl-12 pr-4
                    bg-[rgba(227,194,172,0.35)] border
                    ${editError ? 'border-red-500' : 'border-[#a47352]'}
                    rounded-[10px] text-[#a47352] text-base
                    focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
                  `}
                />
              </div>
              {editError && (
                <p className="text-red-500 text-xs mt-1">{editError}</p>
              )}
              <p className="text-[#a47352]/60 text-xs mt-1">
                Harga sekarang: {fmtHarga(editModal.item.harga_per_meter)}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={deleteModal.open}
        onClose={() =>
          !deleteLoading && setDeleteModal({ open: false, item: null })
        }
        onConfirm={handleConfirmDelete}
        title="Hapus Harga?"
        message={
          deleteModal.item
            ? `Harga "${getDeleteLabel(deleteModal.item)}" akan dihapus. Gulungan yang sudah dibuat tidak terpengaruh. Lanjutkan?`
            : 'Apakah Anda yakin?'
        }
        confirmText="Ya, Hapus"
        loading={deleteLoading}
      />
    </div>
  )
}

// Helper components
function ChevronIcon() {
  return (
    <svg
      className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a47352] pointer-events-none"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-[#a47352]/60 text-xs">{label}</p>
      <p className="text-[#a47352] font-medium text-sm">{value}</p>
    </div>
  )
}