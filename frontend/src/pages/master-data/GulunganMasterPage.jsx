// =====================================================
// GulunganMasterPage.jsx
// Halaman Master Gulungan untuk Kepala Produksi.
// Update: Filter sekarang pakai dropdown panel (bukan modal).
// =====================================================

import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, Layers } from 'lucide-react'
import {
  Loading,
  EmptyState,
  ConfirmDialog,
  useToast,
} from '../../components/ui'
import useGulunganMaster from '../../hooks/useGulunganMaster'
import useMasterData from '../../hooks/useMasterData'
import api, { getErrorMessage } from '../../lib/api'
import ProdukGulunganCard from '../../components/gulungan/ProdukGulunganCard'
import TambahGulunganModal from '../../components/produk/TambahGulunganModal'
import EditGulunganModal from '../../components/produk/EditGulunganModal'
import FilterDropdownPanel, {
  FilterSection,
  FilterChips,
} from '../../components/produk/FilterDropdownPanel'

export default function GulunganMasterPage() {
  const toast = useToast()
  const { rakList } = useMasterData()

  // State
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({ rak_id: '', lebar: '' })
  // Local buffer untuk filter sebelum diterapkan
  const [localFilters, setLocalFilters] = useState({ rak_id: '', lebar: '' })

  // Modal states
  const [tambahGulungan, setTambahGulungan] = useState({ open: false, produk: null })
  const [editGulungan, setEditGulungan] = useState({ open: false, id: null, produk: null })
  const [deleteGulungan, setDeleteGulungan] = useState({ open: false, gulungan: null, produk: null })
  const [deletingGulungan, setDeletingGulungan] = useState(false)

  // Fetch grouped data
  const { groups, totalGulungan, loading, error, refetch } = useGulunganMaster({
    search: searchQuery,
    filters,
  })

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Sync localFilters saat panel dibuka
  useEffect(() => {
    if (filterOpen) {
      setLocalFilters({ ...filters })
    }
  }, [filterOpen, filters])

  // Handlers
  const handleApplyFilter = () => {
    setFilters({ ...localFilters })
    setFilterOpen(false)
  }

  const handleTambahGulungan = (produk) => {
    setTambahGulungan({ open: true, produk })
  }

  const handleEditGulungan = (gulunganId, produk) => {
    setEditGulungan({ open: true, id: gulunganId, produk })
  }

  const handleDeleteGulunganClick = (gulungan, produk) => {
    setDeleteGulungan({ open: true, gulungan, produk })
  }

  const handleConfirmDelete = async () => {
    const g = deleteGulungan.gulungan
    if (!g) return

    setDeletingGulungan(true)
    try {
      await api.delete(`/api/gulungan/${g.id}`)
      toast.success(`Gulungan #${g.nomor_gulungan} berhasil dihapus`)
      setDeleteGulungan({ open: false, gulungan: null, produk: null })
      refetch()
    } catch (err) {
      toast.error('Gagal hapus: ' + getErrorMessage(err))
    } finally {
      setDeletingGulungan(false)
    }
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div>
      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a47352]/60 pointer-events-none"
            strokeWidth={2}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari kode produk atau motif..."
            className="
              w-full pl-12 pr-4 h-[55px]
              bg-[rgba(227,194,172,0.35)] border border-[#a47352]
              rounded-[10px] text-[#a47352] placeholder-[#a47352]/60 text-base
              focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
              transition-all duration-150
            "
          />
        </div>

        {/* Filter button + Dropdown Panel */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className={`
              relative flex items-center gap-2 px-6 h-[55px] min-w-[160px]
              bg-[rgba(227,194,172,0.35)] border border-[#a47352]
              rounded-[10px] text-[#a47352] text-base font-medium
              hover:bg-[rgba(227,194,172,0.5)]
              active:scale-[0.98]
              transition-all duration-150
              ${filterOpen ? 'bg-[rgba(227,194,172,0.5)]' : ''}
            `}
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#a47352] text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Dropdown Panel langsung dengan FilterDropdownPanel */}
          <FilterDropdownPanel
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            onApply={handleApplyFilter}
          >
            {/* Filter Rak */}
            {rakList.length > 0 && (
              <FilterSection title="Rak">
                <FilterChips
                  options={rakList.map((r) => ({
                    value: r.id,
                    label: `Rak ${r.nama}`,
                  }))}
                  value={localFilters.rak_id}
                  onChange={(v) =>
                    setLocalFilters((prev) => ({ ...prev, rak_id: v }))
                  }
                />
              </FilterSection>
            )}

            {/* Filter Lebar */}
            <FilterSection title="Lebar Gulungan">
              <FilterChips
                options={[
                  { value: '70', label: '70 cm' },
                  { value: '110', label: '110 cm' },
                ]}
                value={localFilters.lebar}
                onChange={(v) =>
                  setLocalFilters((prev) => ({ ...prev, lebar: v }))
                }
              />
            </FilterSection>
          </FilterDropdownPanel>
        </div>
      </div>

      {/* Stats bar */}
      {!loading && !error && (
        <div className="mb-4 text-sm text-[#a47352]/70">
          Menampilkan{' '}
          <span className="font-semibold">{groups.length} produk</span> dengan
          total{' '}
          <span className="font-semibold">{totalGulungan} gulungan</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Loading variant="centered" message="Memuat data gulungan..." />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-[10px] p-4 text-sm">
          <p className="font-medium mb-1">Gagal memuat data</p>
          <p>{error}</p>
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={
            searchQuery || activeFilterCount > 0
              ? 'Tidak ada hasil'
              : 'Belum ada gulungan'
          }
          message={
            searchQuery
              ? `Tidak ditemukan produk dengan kata kunci "${searchQuery}"`
              : activeFilterCount > 0
                ? 'Coba ubah filter untuk melihat hasil lain'
                : 'Tambah gulungan dari halaman Detail Produk atau klik tombol di card produk'
          }
        />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <ProdukGulunganCard
              key={group.produk.id}
              group={group}
              defaultExpanded={true}
              onTambahGulungan={handleTambahGulungan}
              onEditGulungan={(gulunganId) =>
                handleEditGulungan(gulunganId, group.produk)
              }
              onDeleteGulungan={handleDeleteGulunganClick}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <TambahGulunganModal
        open={tambahGulungan.open}
        onClose={() => setTambahGulungan({ open: false, produk: null })}
        produk={tambahGulungan.produk}
        onSuccess={() => refetch()}
      />

      <EditGulunganModal
        open={editGulungan.open}
        onClose={() => setEditGulungan({ open: false, id: null, produk: null })}
        gulunganId={editGulungan.id}
        produk={editGulungan.produk}
        onSuccess={() => refetch()}
      />

      <ConfirmDialog
        open={deleteGulungan.open}
        onClose={() =>
          !deletingGulungan &&
          setDeleteGulungan({ open: false, gulungan: null, produk: null })
        }
        onConfirm={handleConfirmDelete}
        title="Hapus Gulungan?"
        message={
          deleteGulungan.gulungan
            ? `Gulungan #${deleteGulungan.gulungan.nomor_gulungan} (${deleteGulungan.gulungan.lebar} cm) dari produk ${deleteGulungan.produk?.kode_produk} akan dihapus permanen. Tidak bisa dihapus jika sudah dipakai di transaksi order. Lanjutkan?`
            : 'Apakah Anda yakin?'
        }
        confirmText="Ya, Hapus"
        loading={deletingGulungan}
      />
    </div>
  )
}