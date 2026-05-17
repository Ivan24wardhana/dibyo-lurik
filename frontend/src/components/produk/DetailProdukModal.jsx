// =====================================================
// DetailProdukModal.jsx
// Fix: hapus import FilterGulunganModal (file tidak exist)
// Ganti dengan inline chip toggle filter lebar di header section gulungan.
// Lebih sederhana dan tidak perlu file tambahan.
// =====================================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Package, Plus, Pencil, Trash2, Layers,
} from 'lucide-react'
import {
  Modal, Loading, Button, EmptyState, ConfirmDialog, useToast,
} from '../ui'
import TambahGulunganModal from './TambahGulunganModal'
import EditGulunganModal from './EditGulunganModal'
import api, { getErrorMessage } from '../../lib/api'
import useAuthStore from '../../store/authStore'
import {
  formatJenisPewarna,
  formatStatusProduk,
  formatRupiahShort,
  formatMeter,
} from '../../lib/formatters'
import { LEBAR_BADGE_COLOR } from '../../lib/constants'

export default function DetailProdukModal({ open, onClose, produkId }) {
  const toast = useToast()
  const profile = useAuthStore((s) => s.profile)
  const isKepalaProduksi = profile?.role === 'kepala_produksi'

  const [produk, setProduk] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filter lebar — inline chips, tidak perlu modal/dropdown terpisah
  const [filterLebar, setFilterLebar] = useState('')

  // Modal states
  const [tambahGulunganOpen, setTambahGulunganOpen] = useState(false)
  const [editGulungan, setEditGulungan] = useState({ open: false, id: null })
  const [deleteGulungan, setDeleteGulungan] = useState({ open: false, gulungan: null })
  const [deletingGulungan, setDeletingGulungan] = useState(false)

  const fetchDetail = useCallback(async () => {
    if (!produkId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/api/produk/${produkId}`)
      setProduk(res.data?.data || null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [produkId])

  useEffect(() => {
    if (open && produkId) fetchDetail()
  }, [open, produkId, fetchDetail])

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setProduk(null)
        setError(null)
        setFilterLebar('')
        setTambahGulunganOpen(false)
        setEditGulungan({ open: false, id: null })
        setDeleteGulungan({ open: false, gulungan: null })
      }, 300)
    }
  }, [open])

  // Filter gulungan berdasarkan lebar (frontend)
  const filteredGulungan = useMemo(() => {
    const list = Array.isArray(produk?.gulungan) ? produk.gulungan : []
    if (!filterLebar) return list
    return list.filter((g) => String(g.lebar) === String(filterLebar))
  }, [produk?.gulungan, filterLebar])

  // Handlers
  const handleTambahSuccess = () => fetchDetail()
  const handleEditSuccess = () => fetchDetail()

  const handleConfirmDeleteGulungan = async () => {
    const g = deleteGulungan.gulungan
    if (!g) return
    setDeletingGulungan(true)
    try {
      await api.delete(`/api/gulungan/${g.id}`)
      toast.success(`Gulungan #${g.nomor_gulungan} berhasil dihapus`)
      setDeleteGulungan({ open: false, gulungan: null })
      fetchDetail()
    } catch (err) {
      toast.error('Gagal hapus: ' + getErrorMessage(err))
    } finally {
      setDeletingGulungan(false)
    }
  }

  const totalGulungan = Array.isArray(produk?.gulungan) ? produk.gulungan.length : 0
  const isFiltered = !!filterLebar

  return (
    <>
      <Modal open={open} onClose={onClose} title="Detail Produk" size="full">
        {loading ? (
          <Loading variant="centered" message="Memuat detail produk..." />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {error}
          </div>
        ) : !produk ? (
          <p className="text-center text-[#a47352]/60 py-8">
            Data produk tidak ditemukan
          </p>
        ) : (
          <div className="space-y-5">
            {/* ===== Info Produk ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
              <div className="aspect-[16/9] lg:aspect-auto lg:h-[280px] rounded-[10px] overflow-hidden bg-gradient-to-br from-[#e3c2ac] to-[#a47352]">
                {produk.gambar_url ? (
                  <img
                    src={produk.gambar_url}
                    alt={produk.kode_produk}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-20 h-20 text-white/40" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              <div className="bg-[rgba(227,194,172,0.35)] rounded-[10px] p-5">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <InfoCell label="Kode Produksi" value={produk.kode_produk} />
                  <InfoCell label="Status" value={formatStatusProduk(produk.status)} />
                  <InfoCell label="Kategori" value={produk.kategori?.nama || '-'} />
                  <InfoCell label="Motif" value={produk.motif?.nama || '-'} />
                  <InfoCell label="Rak" value={produk.rak?.nama || '-'} />
                  <InfoCell label="Jenis Pewarna" value={formatJenisPewarna(produk.jenis_pewarna)} />
                  <InfoCell label="Stok" value={`${produk.stok || 0} gulungan`} />
                  <InfoCell label="Total Terjual" value={formatMeter(produk.terjual || 0)} />
                </div>
              </div>
            </div>

            {/* ===== Gulungan Section ===== */}
            <div className="bg-white border border-[#a47352]/30 rounded-[10px] overflow-hidden">
              {/* Header */}
              <div className="bg-[rgba(227,194,172,0.35)] px-5 py-4 flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-[#a47352] text-lg font-semibold flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Daftar Gulungan{' '}
                  <span className="text-sm font-normal text-[#a47352]/70">
                    {isFiltered
                      ? `(${filteredGulungan.length} dari ${totalGulungan})`
                      : `(${totalGulungan})`}
                  </span>
                </h3>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* ⭐ Inline filter lebar — chip buttons, tidak perlu dropdown */}
                  <div className="flex items-center gap-1.5">
                    {['', '70', '110'].map((val) => {
                      const isActive = filterLebar === val
                      const label = val === '' ? 'Semua' : `${val} cm`
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFilterLebar(val)}
                          className={`
                            text-xs font-medium px-3 py-1.5 rounded-[8px]
                            transition-all duration-150 active:scale-[0.97]
                            ${isActive
                              ? 'bg-[#a47352] text-white'
                              : 'bg-white border border-[#a47352]/40 text-[#a47352] hover:border-[#a47352]'
                            }
                          `}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Tambah - kepala produksi only */}
                  {isKepalaProduksi && (
                    <Button
                      variant="primary"
                      icon={Plus}
                      onClick={() => setTambahGulunganOpen(true)}
                    >
                      Tambah Gulungan
                    </Button>
                  )}
                </div>
              </div>

              {/* Content */}
              {filteredGulungan.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    icon={Layers}
                    title={isFiltered ? 'Tidak ada gulungan dengan filter ini' : 'Belum ada gulungan'}
                    message={
                      isFiltered
                        ? 'Coba pilih lebar yang berbeda atau klik "Semua"'
                        : isKepalaProduksi
                          ? 'Klik "Tambah Gulungan" untuk menambahkan stok'
                          : 'Stok gulungan akan muncul di sini'
                    }
                  />
                </div>
              ) : (
                <GulunganTable
                  gulungan={filteredGulungan}
                  isKepalaProduksi={isKepalaProduksi}
                  onEdit={(id) => setEditGulungan({ open: true, id })}
                  onDelete={(g) => setDeleteGulungan({ open: true, gulungan: g })}
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modals */}
      <TambahGulunganModal
        open={tambahGulunganOpen}
        onClose={() => setTambahGulunganOpen(false)}
        produk={produk}
        onSuccess={handleTambahSuccess}
      />
      <EditGulunganModal
        open={editGulungan.open}
        onClose={() => setEditGulungan({ open: false, id: null })}
        gulunganId={editGulungan.id}
        produk={produk}
        onSuccess={handleEditSuccess}
      />
      <ConfirmDialog
        open={deleteGulungan.open}
        onClose={() => !deletingGulungan && setDeleteGulungan({ open: false, gulungan: null })}
        onConfirm={handleConfirmDeleteGulungan}
        title="Hapus Gulungan?"
        message={
          deleteGulungan.gulungan
            ? `Gulungan #${deleteGulungan.gulungan.nomor_gulungan} (${deleteGulungan.gulungan.lebar} cm) akan dihapus permanen. Lanjutkan?`
            : 'Apakah Anda yakin?'
        }
        confirmText="Ya, Hapus"
        loading={deletingGulungan}
      />
    </>
  )
}

function GulunganTable({ gulungan, isKepalaProduksi, onEdit, onDelete }) {
  const gridCols = isKepalaProduksi
    ? 'grid-cols-[60px_120px_minmax(120px,1fr)_minmax(120px,1fr)_minmax(140px,1fr)_180px]'
    : 'grid-cols-[60px_120px_minmax(120px,1fr)_minmax(120px,1fr)_minmax(140px,1fr)]'

  return (
    <div className="overflow-x-auto">
      <div className={`bg-[#a47352] text-white grid ${gridCols} px-4 py-3 text-sm font-medium`}>
        <div className="text-center">No.</div>
        <div className="text-center">Lebar</div>
        <div className="text-center">Panjang Total</div>
        <div className="text-center">Panjang Sisa</div>
        <div className="text-center">Harga/m</div>
        {isKepalaProduksi && <div className="text-center">Aksi</div>}
      </div>

      {gulungan.map((g) => {
        const lebarColor = LEBAR_BADGE_COLOR?.[g.lebar] || '#798acc'
        const isHabis = !g.is_active

        return (
          <div
            key={g.id}
            className={`
              grid ${gridCols} px-4 py-3 items-center text-sm
              border-b border-[#a47352]/20 last:border-b-0
              ${isHabis ? 'bg-gray-50 opacity-60' : 'bg-white hover:bg-[#fdfaf6]'}
              transition-colors duration-150
            `}
          >
            <div className="text-center font-medium text-[#a47352]">{g.nomor_gulungan}.</div>

            <div className="flex justify-center">
              <span
                className="text-white text-xs font-medium px-3 py-1 rounded-[20px] inline-flex items-center justify-center min-w-[80px]"
                style={{ backgroundColor: lebarColor }}
              >
                {g.lebar} cm
              </span>
            </div>

            <div className="text-center text-[#a47352]">{formatMeter(g.panjang_total)}</div>

            <div className="text-center text-[#a47352] font-medium">
              {formatMeter(g.panjang_sisa)}
              {isHabis && <span className="ml-2 text-xs text-red-500">(habis)</span>}
            </div>

            <div className="text-center text-[#a47352] font-medium">
              {formatRupiahShort(g.harga_per_meter)}
            </div>

            {isKepalaProduksi && (
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(g.id)}
                  className="bg-[#f0a864] hover:bg-[#d8924f] text-white rounded-[8px] px-3 py-1.5 inline-flex items-center gap-1 active:scale-95 transition-all duration-150"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="text-xs">Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(g)}
                  className="bg-[#ff695e] hover:bg-[#e54c41] text-white rounded-[8px] px-3 py-1.5 inline-flex items-center gap-1 active:scale-95 transition-all duration-150"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-xs">Hapus</span>
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function InfoCell({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[#a47352]/70 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[#a47352] text-base font-medium truncate">{value || '-'}</p>
    </div>
  )
}