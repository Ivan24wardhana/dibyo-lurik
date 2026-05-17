// =====================================================
// PreOrderRegulerPage.jsx
// Fix: hapus import usePreOrderList (tidak exist),
// pakai useEffect + api.get langsung seperti halaman lain.
// =====================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, SlidersHorizontal, Eye, Pencil, Trash2, ShoppingCart } from 'lucide-react'
import { Loading, EmptyState, Pagination, ConfirmDialog, SuccessPopup, useToast } from '../../components/ui'
import useAuthStore from '../../store/authStore'
import api, { getErrorMessage } from '../../lib/api'
import FilterPODropdown from '../../components/pre-order/FilterPODropdown'
import DetailPORModal from '../../components/pre-order/DetailPORModal'

const STATUS_CONFIG = {
  belum_diproses: { label: 'Belum diproses', color: '#a63636' },
  sedang_diproses: { label: 'Sedang diproses', color: '#b99e5f' },
  selesai_diproses: { label: 'Selesai diproses', color: '#91b960' },
}

function StatusBadge({ value }) {
  const cfg = STATUS_CONFIG[value] || { label: value || '-', color: '#a47352' }
  return (
    <span
      className="text-white text-xs font-medium px-3 py-1.5 rounded-[20px] whitespace-nowrap"
      style={{ backgroundColor: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

const fmtTanggal = (val) => {
  if (!val) return '-'
  try {
    return new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return val }
}

export default function PreOrderRegulerPage() {
  const toast = useToast()
  const profile = useAuthStore((s) => s.profile)
  const role = profile?.role
  const isCS = role === 'customer_service'
  const isKP = role === 'kepala_produksi'

  // List state
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter / search state
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({ status: '', status_pembayaran: '' })
  const filterContainerRef = useRef(null)

  // Modal states
  const [detailModal, setDetailModal] = useState({ open: false, id: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, po: null })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)

  // Fetch list
  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', page)
      params.set('limit', 10)
      if (searchQuery) params.set('q', searchQuery)
      if (filters.status) params.set('status_produksi', filters.status)
      if (filters.status_pembayaran) params.set('status_pembayaran', filters.status_pembayaran)

      const res = await api.get(`/api/pre-order-reguler?${params.toString()}`)
      const result = res.data?.data || {}
      setItems(result.items || [])
      setMeta({
        total: result.pagination?.total || 0,
        totalPages: result.pagination?.total_pages || 1,
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, filters])

  useEffect(() => { fetchList() }, [fetchList])

  const handleSearch = (e) => {
    setSearchInput(e.target.value)
    setPage(1)
    setSearchQuery(e.target.value)
  }

  const handleDelete = async () => {
    const po = deleteModal.po
    if (!po) return
    setDeleteLoading(true)
    try {
      await api.delete(`/api/pre-order-reguler/${po.id}`)
      setDeleteModal({ open: false, po: null })
      setShowDeleteSuccess(true)
      fetchList()
    } catch (err) {
      toast.error('Gagal hapus: ' + getErrorMessage(err))
    } finally {
      setDeleteLoading(false)
    }
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const startNum = (page - 1) * 10 + 1

  return (
    <div>
      {/* Container Card sesuai Figma */}
      <div className="bg-[rgba(227,194,172,0.35)] border border-[#a47352] rounded-[10px] overflow-visible">
        {/* Header: judul + search + filter */}
        <div className="px-6 py-4 flex items-center gap-3 flex-wrap border-b border-[#a47352]/30">
          <h2 className="text-[#a47352] text-xl font-medium flex-shrink-0">
            List Pre-Order Reguler
          </h2>

          {/* Search */}
          <div className="relative flex-1 min-w-[280px]">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a47352]/60 pointer-events-none"
              strokeWidth={2}
            />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearch}
              placeholder="nama Pelanggan"
              className="
                w-full pl-12 pr-4 h-[55px]
                bg-[rgba(227,194,172,0.35)] border border-[#a47352]
                rounded-[10px] text-[#a47352] placeholder-[#a47352]/60 text-base
                focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
                transition-all duration-150
              "
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative" ref={filterContainerRef}>
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className={`
                relative flex items-center gap-2 px-6 h-[55px] min-w-[140px]
                bg-[rgba(227,194,172,0.35)] border border-[#a47352]
                rounded-[10px] text-[#a47352] text-base font-medium
                hover:bg-[rgba(227,194,172,0.5)] active:scale-[0.98]
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
            <FilterPODropdown
              open={filterOpen}
              onClose={() => setFilterOpen(false)}
              filters={filters}
              onChange={(f) => { setFilters(f); setPage(1); setFilterOpen(false) }}
              containerRef={filterContainerRef}
              showPembayaran={isCS}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {/* Header */}
          <div className="bg-[#a47352] text-white grid grid-cols-[60px_160px_1fr_100px_140px_140px_160px_150px] px-4 py-3 text-sm font-medium min-w-[1050px]">
            <div className="text-center">No.</div>
            <div className="text-center">Id Pre-Order</div>
            <div className="text-center">Nama Pelanggan</div>
            <div className="text-center">Jumlah</div>
            <div className="text-center">Tgl Pemesanan</div>
            <div className="text-center">Estimasi</div>
            <div className="text-center">Status Produksi</div>
            <div className="text-center">Aksi</div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="bg-white py-12">
              <Loading variant="centered" message="Memuat data pre-order..." />
            </div>
          ) : error ? (
            <div className="bg-white p-4 text-red-700 text-sm">{error}</div>
          ) : items.length === 0 ? (
            <div className="bg-white py-12">
              <EmptyState
                title="Belum ada pre-order"
                message="DEBUG: ini message dari PreOrderRegulerPage"
              />
            </div>
          ) : (
            items.map((po, idx) => (
              <div
                key={po.id}
                className="
                  bg-white grid grid-cols-[60px_160px_1fr_100px_140px_140px_160px_150px]
                  px-4 py-4 items-center
                  border-b border-[#a47352]/20 last:border-b-0
                  hover:bg-[#fdfaf6] transition-colors duration-150 min-w-[1050px]
                "
              >
                <div className="text-center text-[#a47352] text-sm font-medium">
                  {startNum + idx}.
                </div>
                <div className="text-center text-[#a47352] text-sm font-medium">
                  ID {po.id?.slice(-7)?.toUpperCase() || '-'}
                </div>
                <div className="text-center text-[#a47352] text-sm">
                  {po.nama_customer || '-'}
                </div>
                <div className="text-center text-[#a47352] text-sm">
                  {po.jumlah_item || '-'}
                </div>
                <div className="text-center text-[#a47352] text-sm">
                  {fmtTanggal(po.tanggal_po)}
                </div>
                <div className="text-center text-[#a47352] text-sm">
                  {fmtTanggal(po.tanggal_estimasi)}
                </div>
                <div className="flex justify-center">
                  <StatusBadge value={po.status_produksi} />
                </div>
                <div className="flex justify-center gap-1.5">
                  {/* Detail - semua role */}
                  <ActionBtn
                    icon={Eye}
                    label="Detail"
                    color="#4cd0b1"
                    onClick={() => setDetailModal({ open: true, id: po.id })}
                  />
                  {/* Edit - CS + KP */}
                  {(isCS || isKP) && (
                    <ActionBtn
                      icon={Pencil}
                      label="Edit"
                      color="#f0a864"
                      onClick={() => setDetailModal({ open: true, id: po.id })}
                    />
                  )}
                  {/* Hapus - CS only */}
                  {isCS && (
                    <ActionBtn
                      icon={Trash2}
                      label="Hapus"
                      color="#ff695e"
                      onClick={() => setDeleteModal({ open: true, po })}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            limit={10}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modals */}
      <DetailPORModal
        open={detailModal.open}
        onClose={() => setDetailModal({ open: false, id: null })}
        poId={detailModal.id}
        onSuccess={() => fetchList()}
      />

      <ConfirmDialog
        open={deleteModal.open}
        onClose={() => !deleteLoading && setDeleteModal({ open: false, po: null })}
        onConfirm={handleDelete}
        title="Hapus Pre-Order Reguler?"
        message={
          deleteModal.po
            ? `Pre-order dari "${deleteModal.po.nama_customer}" akan dihapus permanen. Lanjutkan?`
            : 'Apakah Anda yakin?'
        }
        confirmText="Ya, Hapus"
        loading={deleteLoading}
      />

      <SuccessPopup
        open={showDeleteSuccess}
        onClose={() => setShowDeleteSuccess(false)}
        message="Pre-order berhasil dihapus"
        duration={1500}
      />
    </div>
  )
}

function ActionBtn({ icon: Icon, label, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        text-white text-xs font-medium rounded-[8px] px-2.5 py-1.5
        inline-flex flex-col items-center gap-0.5 min-w-[46px]
        active:scale-95 transition-all duration-150
      "
      style={{ backgroundColor: color }}
      onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.88)')}
      onMouseLeave={(e) => (e.currentTarget.style.filter = '')}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  )
}