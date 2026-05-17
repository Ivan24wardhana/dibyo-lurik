// =====================================================
// ProdukPage.jsx
// Fix: filter dropdown sekarang pakai containerRef
// sehingga posisi tepat di bawah tombol Filter.
// =====================================================

import { useState, useRef } from 'react'
import { Search, SlidersHorizontal, Plus, Package } from 'lucide-react'
import useProduk from '../../hooks/useProduk'
import useAuthStore from '../../store/authStore'
import ProdukCard from '../../components/produk/ProdukCard'
import FilterProdukDropdown from '../../components/produk/FilterProdukDropdown'
import DetailProdukModal from '../../components/produk/DetailProdukModal'
import TambahProdukModal from '../../components/produk/TambahProdukModal'
import EditProdukModal from '../../components/produk/EditProdukModal'
import api, { getErrorMessage } from '../../lib/api'
import {
  Loading,
  EmptyState,
  Pagination,
  Button,
  ConfirmDialog,
  useToast,
} from '../../components/ui'

export default function ProdukPage() {
  const toast = useToast()
  const profile = useAuthStore((s) => s.profile)
  const isKepalaProduksi = profile?.role === 'kepala_produksi'

  // ===== State =====
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    kategori_id: '',
    jenis_pewarna: '',
    status: '',
  })

  // ⭐ containerRef untuk fix posisi dropdown & click-outside
  const filterContainerRef = useRef(null)

  // Modal states
  const [detailOpen, setDetailOpen] = useState(false)
  const [tambahOpen, setTambahOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, produk: null })
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const { data, meta, loading, error, refetch } = useProduk({
    page,
    limit: 12,
    search: searchQuery,
    filters,
  })

  // ===== Handlers =====
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
    setPage(1)
    setSearchQuery(value)
  }

  const handleApplyFilter = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleDetailClick = (produkId) => {
    setSelectedId(produkId)
    setDetailOpen(true)
  }
  const handleCloseDetail = () => {
    setDetailOpen(false)
    setTimeout(() => setSelectedId(null), 300)
  }

  const handleEditClick = (produkId) => {
    setSelectedId(produkId)
    setEditOpen(true)
  }
  const handleCloseEdit = () => {
    setEditOpen(false)
    setTimeout(() => setSelectedId(null), 300)
  }

  const handleDeleteClick = (produk) => {
    setDeleteConfirm({ open: true, produk })
  }
  const handleConfirmDelete = async () => {
    const produk = deleteConfirm.produk
    if (!produk) return

    setDeleteSubmitting(true)
    try {
      await api.delete(`/api/produk/${produk.id}`)
      toast.success(`Produk ${produk.kode_produk} berhasil dihapus`)
      setDeleteConfirm({ open: false, produk: null })
      refetch()
    } catch (err) {
      toast.error('Gagal hapus: ' + getErrorMessage(err))
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div>
      {/* ===== Search + Filter + Tambah Bar ===== */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[300px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a47352]/60 pointer-events-none"
            strokeWidth={2}
          />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="nama motif/kode produk"
            className="
              w-full pl-12 pr-4 h-[55px]
              bg-[rgba(227,194,172,0.35)] border border-[#a47352]
              rounded-[10px]
              text-[#a47352] placeholder-[#a47352]/60 text-base
              focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
              transition-all duration-150
            "
          />
        </div>

        {/* ⭐ Container relative wraps tombol + dropdown — INI KUNCINYA */}
        <div className="relative" ref={filterContainerRef}>
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

          {/* Dropdown panel — relative ke container di atas */}
          <FilterProdukDropdown
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            filters={filters}
            onChange={(newFilters) => {
              handleApplyFilter(newFilters)
              setFilterOpen(false)
            }}
            containerRef={filterContainerRef}
          />
        </div>

        {/* Tambah Produk */}
        {isKepalaProduksi && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setTambahOpen(true)}
            className="h-[55px] px-6"
          >
            Tambah Produk
          </Button>
        )}
      </div>

      {/* ===== Content ===== */}
      {loading ? (
        <Loading variant="centered" message="Memuat produk..." />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-[10px] p-4 text-sm">
          <p className="font-medium mb-1">Gagal memuat data produk</p>
          <p>{error}</p>
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={Package}
          title={
            searchQuery || activeFilterCount > 0
              ? 'Tidak ada hasil'
              : 'Belum ada produk'
          }
          message={
            searchQuery
              ? `Tidak ditemukan produk dengan kata kunci "${searchQuery}"`
              : activeFilterCount > 0
                ? 'Coba ubah filter untuk melihat hasil lain'
                : 'Daftar produk akan muncul di sini'
          }
          action={
            isKepalaProduksi && !searchQuery && activeFilterCount === 0 ? (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setTambahOpen(true)}
              >
                Tambah Produk Pertama
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.map((produk) => (
              <ProdukCard
                key={produk.id}
                produk={produk}
                onDetailClick={handleDetailClick}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                showActions={isKepalaProduksi}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            limit={12}
            onPageChange={setPage}
          />
        </>
      )}

      {/* ===== Modals ===== */}
      <DetailProdukModal
        open={detailOpen}
        onClose={handleCloseDetail}
        produkId={selectedId}
      />
      <TambahProdukModal
        open={tambahOpen}
        onClose={() => setTambahOpen(false)}
        onSuccess={() => refetch()}
      />
      <EditProdukModal
        open={editOpen}
        onClose={handleCloseEdit}
        produkId={selectedId}
        onSuccess={() => refetch()}
      />
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() =>
          !deleteSubmitting && setDeleteConfirm({ open: false, produk: null })
        }
        onConfirm={handleConfirmDelete}
        title="Hapus Produk?"
        message={
          deleteConfirm.produk
            ? `Produk "${deleteConfirm.produk.kode_produk}" akan dihapus permanen. Tidak bisa dihapus jika masih punya gulungan atau ada di pre-order. Lanjutkan?`
            : 'Apakah Anda yakin?'
        }
        confirmText="Ya, Hapus"
        loading={deleteSubmitting}
      />
    </div>
  )
}