import { useState } from 'react'
import useProduk from '../../hooks/useProduk'
import ProdukCard from '../../components/produk/ProdukCard'
import DetailProdukModal from '../../components/produk/DetailProdukModal'
import FilterProdukModal from '../../components/produk/FilterProdukModal'
import SearchBar from '../../components/ui/SearchBar'
import EmptyState from '../../components/ui/EmptyState'

/**
 * ProdukPage
 * Halaman daftar produk dengan:
 * - SearchBar
 * - Filter button dengan badge count
 * - Grid 4 kolom
 * - Popup detail produk
 * - Popup filter
 * Figma node 14:883
 */
export default function ProdukPage() {
  const {
    produk, kategoriList, loading,
    search, setSearch,
    filters, setFilters,
    activeFilterCount,
  } = useProduk()

  const [showFilter, setShowFilter] = useState(false)
  const [selectedProduk, setSelectedProduk] = useState(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari kode produk, kategori, atau motif..."
          className="flex-1"
        />

        <button
          onClick={() => setShowFilter(true)}
          className="h-12 px-5 rounded-xl border-2 border-[#caa179]/50 bg-white text-[#8b5e3c] font-semibold text-sm hover:border-[#a47352] transition-colors flex items-center justify-center gap-2 relative"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Filter
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#a47352] text-white text-xs font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-[#caa179]/30 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-amber-50" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-amber-100 rounded w-3/4" />
                <div className="h-3 bg-amber-50 rounded w-1/2" />
                <div className="h-10 bg-amber-50 rounded-xl mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : produk.length === 0 ? (
        <EmptyState
          title={search || activeFilterCount > 0 ? 'Produk tidak ditemukan' : 'Belum ada produk'}
          description={search || activeFilterCount > 0
            ? 'Coba ubah kata kunci atau reset filter untuk melihat produk lainnya'
            : 'Produk akan tampil di sini setelah kepala produksi menambahkannya'}
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {produk.map((p) => (
            <ProdukCard key={p.id} produk={p} onDetail={setSelectedProduk} />
          ))}
        </div>
      )}

      {produk.length > 0 && (
        <p className="text-xs text-center text-[#a47352]/70">
          Menampilkan {produk.length} produk
        </p>
      )}

      <DetailProdukModal
        isOpen={!!selectedProduk}
        onClose={() => setSelectedProduk(null)}
        produk={selectedProduk}
      />

      <FilterProdukModal
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={setFilters}
        initialFilters={filters}
        kategoriList={kategoriList}
      />
    </div>
  )
}
