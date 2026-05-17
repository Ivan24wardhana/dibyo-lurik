// =====================================================
// OrderPage.jsx
// Halaman Order untuk Customer Service.
// Match Figma 1310:14089.
//
// Layout:
//   - Search nama motif/kode produk
//   - Filter dropdown (kategori, pewarna, rak)
//   - + Tambah Pre-Order Custom button (kanan)
//   - Grid produk pakai ProdukOrderCard (3 kolom)
//
// Flow saat klik "Beli":
//   1. Buka PilihGulunganModal
//   2. User pilih gulungan + klik "Masukkan Keranjang"
//   3. Trigger flying animation dari modal button ke cart icon
//   4. addItem ke cartStore
//   5. SuccessPopup muncul setelah animasi
//
// Flow saat klik "+ Pre-Order Reguler":
//   - Navigate ke /pre-order/reguler/tambah?produk_id=xxx
//   (form POR akan dibuat di Milestone 2)
// =====================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, Plus, Package } from 'lucide-react'
import {
  Loading,
  EmptyState,
  Pagination,
  SuccessPopup,
  useToast,
} from '../../components/ui'
import api, { getErrorMessage } from '../../lib/api'
import useCartStore from '../../store/cartStore'
import ProdukOrderCard from '../../components/order/ProdukOrderCard'
import PilihGulunganModal from '../../components/order/PilihGulunganModal'
import FilterProdukDropdown from '../../components/produk/FilterProdukDropdown'
import { triggerFlyingToCart } from '../../components/order/FlyingImage'

export default function OrderPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)

  // State produk list
  const [produkList, setProdukList] = useState([])
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter & search
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    kategori_id: '',
    jenis_pewarna: '',
    status: '',
  })
  const filterContainerRef = useRef(null)

  // Modal pilih gulungan
  const [gulunganModal, setGulunganModal] = useState({ open: false, produk: null })

  // SuccessPopup masuk keranjang
  const [showSuccess, setShowSuccess] = useState(false)

  // Fetch produk
  const fetchProduk = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', page)
      params.set('limit', 12)
      if (searchQuery) params.set('q', searchQuery)
      if (filters.kategori_id) params.set('kategori_id', filters.kategori_id)
      if (filters.jenis_pewarna) params.set('jenis_pewarna', filters.jenis_pewarna)
      if (filters.status) params.set('status', filters.status)

      const res = await api.get(`/api/produk?${params.toString()}`)
      const result = res.data?.data || {}
      setProdukList(result.items || [])
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

  useEffect(() => {
    fetchProduk()
  }, [fetchProduk])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // ===== Handlers =====
  const handleBeli = (produk) => {
    setGulunganModal({ open: true, produk })
  }

  const handlePOReguler = (produk) => {
    // Navigate ke form Tambah POR dengan prefilled produk
    navigate(`/pre-order/reguler/tambah?produk_id=${produk.id}`)
  }

  const handleTambahPOC = () => {
    navigate('/pre-order/custom/tambah')
  }

  /**
   * Dipanggil dari PilihGulunganModal saat user klik "Masukkan Keranjang"
   *
   * @param {object} produk - produk yg dipilih
   * @param {array} selectedGulungan - list gulungan yg dipilih
   * @param {HTMLElement} sourceEl - element button untuk anchor flying animation
   */
  const handleAddToCart = (produk, selectedGulungan, sourceEl) => {
    // 1. Tambah ke cart store
    const cartItemId = addItem(produk, selectedGulungan)
    if (!cartItemId) {
      toast.error('Gagal menambahkan ke keranjang')
      return
    }

    // 2. Trigger flying animation dari sourceEl (button) ke cart icon
    // Pakai gambar produk
    triggerFlyingToCart(produk.gambar_url, sourceEl, () => {
      // Setelah animasi selesai → show SuccessPopup
      setShowSuccess(true)
    })
  }

  // ===== Render helpers =====
  const handleApplyFilter = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div>
      {/* ===== Search + Filter + Tambah PO Custom Bar ===== */}
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
            onChange={(e) => setSearchInput(e.target.value)}
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

        {/* Filter Dropdown */}
        <div className="relative" ref={filterContainerRef}>
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className={`
              relative flex items-center gap-2 px-6 h-[55px] min-w-[160px]
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

        {/* Tambah Pre-Order Custom */}
        <button
          type="button"
          onClick={handleTambahPOC}
          className="
            flex items-center gap-2 h-[55px] px-6
            bg-[#a47352] hover:bg-[#8d6044]
            text-white text-base font-medium
            rounded-[10px]
            active:scale-[0.97]
            transition-all duration-150
          "
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Tambah Pre-Order Custom
        </button>
      </div>

      {/* ===== Content ===== */}
      {loading ? (
        <Loading variant="centered" message="Memuat produk..." />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-[10px] p-4 text-sm">
          <p className="font-medium mb-1">Gagal memuat produk</p>
          <p>{error}</p>
        </div>
      ) : produkList.length === 0 ? (
        <EmptyState
          icon={Package}
          title={searchQuery || activeFilterCount > 0 ? 'Tidak ada hasil' : 'Belum ada produk'}
          message={
            searchQuery
              ? `Tidak ditemukan dengan "${searchQuery}"`
              : activeFilterCount > 0
                ? 'Coba ubah filter'
                : 'Produk akan muncul di sini'
          }
        />
      ) : (
        <>
          {/* Grid Produk */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {produkList.map((produk) => (
              <ProdukOrderCard
                key={produk.id}
                produk={produk}
                onBeli={handleBeli}
                onPOReguler={handlePOReguler}
              />
            ))}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              totalItems={meta.total}
              limit={12}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* ===== Modal Pilih Gulungan ===== */}
      <PilihGulunganModal
        open={gulunganModal.open}
        onClose={() => setGulunganModal({ open: false, produk: null })}
        produk={gulunganModal.produk}
        onAddToCart={handleAddToCart}
      />

      {/* ===== SuccessPopup masuk keranjang ===== */}
      <SuccessPopup
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        message="Berhasil dimasukkan keranjang"
        duration={1500}
      />
    </div>
  )
}