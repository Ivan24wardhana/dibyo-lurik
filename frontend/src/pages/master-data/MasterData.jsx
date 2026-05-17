// =====================================================
// HargaPage.jsx
// Halaman Master Daftar Harga (Kepala Produksi).
//
// Menampilkan pricelist kain Dibyo Lurik:
//   Sintetis 70cm  = Rp 38.500  |  Alami 70cm  = Rp 46.500
//   Sintetis 110cm = Rp 57.500  |  Alami 110cm = Rp 67.500
//   + exception: Blok Lurik Sintetis 110cm = Rp 60.000 (motif spesifik)
//
// UI:
//   - Form tambah harga (inline di atas)
//   - Tabel: Jenis Pewarna | Lebar | Motif (null=Umum) | Harga | Aksi
//   - Edit modal: hanya bisa edit harga_per_meter
//   - Hapus: confirm dialog
//
// Note: kombinasi (jenis_pewarna + motif + lebar) tidak bisa diubah
//       setelah dibuat. Untuk ganti kombinasi = hapus + buat baru.
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
import { formatRupiahFull } from '../../lib/formatters'

// Formatter harga lengkap (Rp 38.500,00)
const fmtHarga = (val) => {
  const num = parseFloat(val || 0)
  return num.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
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
  motif_id: '',     // kosong = berlaku umum
  harga_per_meter: '',
}

export default function HargaPage() {
  const toast = useToast()
  const { motifList } = useMasterData()

  // ===== List state =====
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ===== Tambah state =====
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})
  const [addLoading, setAddLoading] = useState(false)

  // ===== Edit state =====
  const [editModal, setEditModal] = useState({ open: false, item: null })
  const [editHarga, setEditHarga] = useState('')
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // ===== Delete state =====
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null })
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ===== Fetch list =====
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

  // ===== Tambah =====
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

  // ===== Edit =====
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

  // ===== Delete =====
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

  // Label untuk motif di tabel
  const getMotifLabel = (item) => {
    if (!item.motif) return <span className="text-[#a47352]/50 italic text-sm">Umum (semua motif)</span>
    return <span className="text-[#a47352] font-medium">{item.motif.nama}</span>
  }

  // Label untuk delete confirm
  const getDeleteLabel = (item) => {
    const motifLabel = item.motif ? `Motif ${item.motif.nama}` : 'Umum'
    const lebarLabel = `${item.lebar} cm`
    const jenisLabel = item.jenis_pewarna === 'sintetis' ? 'Sintetis' : 'Alami'
    return `${jenisLabel} - ${lebarLabel} - ${motifLabel}`
  }

  return (
    <div>
      {/* ===== Info Banner ===== */}
      <div className="bg-[rgba(227,194,172,0.35)] border border-[#a47352]/30 rounded-[10px] p-4 mb-5">
        <p className="text-[#a47352] text-sm font-medium mb-1">
          💡 Cara kerja Daftar Harga:
        </p>
        <p className="text-[#a47352]/80 text-sm">
          Harga dipakai saat <strong>tambah gulungan</strong> (auto-fill berdasarkan jenis pewarna + lebar).
          Kalau ada <strong>motif spesifik</strong>, harga exception untuk motif itu akan dipakai dulu.
          Kalau tidak ada, fallback ke harga <strong>Umum</strong>.
        </p>
      </div>

      {/* ===== Form Tambah Harga ===== */}
      <div className="bg-white border border-[#a47352]/30 rounded-[10px] p-5 mb-5 shadow-sm">
        <h3 className="text-[#a47352] text-base font-semibold mb-4">
          + Tambah Harga Baru
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Jenis Pewarna */}
          <FormSelect
            label="Jenis Pewarna *"
            value={form.jenis_pewarna}
            onChange={(v) => handleFormChange('jenis_pewarna', v)}
            options={JENIS_PEWARNA_OPTIONS}
            error={formErrors.jenis_pewarna}
          />

          {/* Lebar */}
          <FormSelect
            label="Lebar *"
            value={form.lebar}
            onChange={(v) => handleFormChange('lebar', parseInt(v))}
            options={LEBAR_OPTIONS}
            error={formErrors.lebar}
          />

          {/* Motif (optional) */}
          <div>
            <label className="block text-[#a47352] text-sm font-medium mb-1.5">
              Motif Spesifik
              <span className="text-[#a47352]/50 ml-1">(opsional)</span>
            </label>
            <div className="relative">
              <select
                value={form.motif_id}
                onChange={(e) => handleFormChange('motif_id', e.target.value)}
                className="
                  w-full h-[44px] px-3 pr-8
                  bg-[rgba(227,194,172,0.35)] border border-[#a47352]
                  rounded-[10px] text-[#a47352] text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
                  appearance-none cursor-pointer
                "
              >
                <option value="">— Umum (semua motif) —</option>
                {motifList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama}
                  </option>
                ))}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a47352] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
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

      {/* ===== Tabel Daftar Harga ===== */}
      <div className="bg-white border border-[#a47352]/30 rounded-[10px] overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-[#a47352] text-white grid grid-cols-[50px_160px_100px_1fr_180px_180px] px-4 py-3 text-sm font-medium">
          <div className="text-center">No.</div>
          <div>Jenis Pewarna</div>
          <div className="text-center">Lebar</div>
          <div>Motif (Spesifik)</div>
          <div className="text-right">Harga / Meter</div>
          <div className="text-center">Aksi</div>
        </div>

        {/* Content */}
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

              {/* Jenis Pewarna badge */}
              <div>
                <span
                  className="
                    text-white text-xs font-medium px-3 py-1 rounded-[20px]
                  "
                  style={{
                    backgroundColor:
                      item.jenis_pewarna === 'sintetis' ? '#798acc' : '#75438e',
                  }}
                >
                  {item.jenis_pewarna === 'sintetis' ? 'Sintetis' : 'Alami'}
                </span>
              </div>

              {/* Lebar badge */}
              <div className="flex justify-center">
                <span
                  className="text-white text-xs font-medium px-3 py-1 rounded-[20px]"
                  style={{
                    backgroundColor:
                      item.lebar === 70 ? '#75438e' : '#798acc',
                  }}
                >
                  {item.lebar} cm
                </span>
              </div>

              {/* Motif */}
              <div>{getMotifLabel(item)}</div>

              {/* Harga */}
              <div className="text-right text-[#a47352] font-semibold text-base">
                {fmtHarga(item.harga_per_meter)}
              </div>

              {/* Aksi */}
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

      {/* ===== Edit Modal ===== */}
      <Modal
        open={editModal.open}
        onClose={editLoading ? undefined : () => setEditModal({ open: false, item: null })}
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
            {/* Info kombinasi readonly */}
            <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] p-4 text-sm">
              <p className="text-[#a47352]/70 text-xs font-medium uppercase tracking-wide mb-2">
                Kombinasi (tidak bisa diubah):
              </p>
              <div className="grid grid-cols-3 gap-2">
                <InfoItem label="Pewarna" value={editModal.item.jenis_pewarna === 'sintetis' ? 'Sintetis' : 'Alami'} />
                <InfoItem label="Lebar" value={`${editModal.item.lebar} cm`} />
                <InfoItem label="Motif" value={editModal.item.motif?.nama || 'Umum'} />
              </div>
            </div>

            {/* Input harga baru */}
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
              {editError && <p className="text-red-500 text-xs mt-1">{editError}</p>}
              <p className="text-[#a47352]/60 text-xs mt-1">
                Harga sekarang: {fmtHarga(editModal.item.harga_per_meter)}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Confirm Delete ===== */}
      <ConfirmDialog
        open={deleteModal.open}
        onClose={() => !deleteLoading && setDeleteModal({ open: false, item: null })}
        onConfirm={handleConfirmDelete}
        title="Hapus Harga?"
        message={
          deleteModal.item
            ? `Harga "${getDeleteLabel(deleteModal.item)}" akan dihapus. Gulungan yang sudah dibuat tidak terpengaruh (harga sudah ter-snapshot). Lanjutkan?`
            : 'Apakah Anda yakin?'
        }
        confirmText="Ya, Hapus"
        loading={deleteLoading}
      />
    </div>
  )
}

// =====================================================
// Helper components
// =====================================================
function FormSelect({ label, value, onChange, options, error }) {
  return (
    <div>
      <label className="block text-[#a47352] text-sm font-medium mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full h-[44px] px-3 pr-8
            bg-[rgba(227,194,172,0.35)] border
            ${error ? 'border-red-500' : 'border-[#a47352]'}
            rounded-[10px] text-[#a47352] text-sm
            focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
            appearance-none cursor-pointer
          `}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a47352] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
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