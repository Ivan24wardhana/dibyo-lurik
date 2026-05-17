// =====================================================
// FilterProdukModal.jsx
// Modal filter untuk halaman Produk.
// Match Figma node 1001:658.
//
// Sections:
//   - Kategori (fetch dari /api/kategori)
//   - Pewarna (sintetis / alami)
//   - Status Produk (ready / sold)
//
// Pattern: chip toggle - klik chip yang sama lagi = unselect
//
// Cara pakai:
//   <FilterProdukModal
//     open={filterOpen}
//     onClose={() => setFilterOpen(false)}
//     onApply={(filters) => setFilters(filters)}
//     initialFilters={filters}
//   />
// =====================================================

import { useState, useEffect } from 'react'
import { Modal, Button } from '../ui'
import api from '../../lib/api'
import { JENIS_PEWARNA_LABEL, STATUS_PRODUK_LABEL } from '../../lib/constants'

export default function FilterProdukModal({
  open,
  onClose,
  onApply,
  initialFilters = {},
}) {
  // ===== State filter (local, baru commit ke parent saat klik Terapkan) =====
  const [filters, setFilters] = useState({
    kategori_id: '',
    jenis_pewarna: '',
    status: '',
  })

  // ===== List kategori dari API =====
  const [kategoriList, setKategoriList] = useState([])
  const [loadingKategori, setLoadingKategori] = useState(false)

  // Sync initialFilters → local state saat modal open
  useEffect(() => {
    if (open) {
      setFilters({
        kategori_id: initialFilters.kategori_id || '',
        jenis_pewarna: initialFilters.jenis_pewarna || '',
        status: initialFilters.status || '',
      })
    }
  }, [open, initialFilters.kategori_id, initialFilters.jenis_pewarna, initialFilters.status])

  // Fetch kategori list saat modal pertama kali dibuka
  useEffect(() => {
    if (!open || kategoriList.length > 0) return

    setLoadingKategori(true)
    api
      .get('/api/kategori?limit=100')
      .then((res) => {
        const items =
          res.data?.data?.items || res.data?.data?.data || res.data?.data || []
        setKategoriList(Array.isArray(items) ? items : [])
      })
      .catch(() => setKategoriList([]))
      .finally(() => setLoadingKategori(false))
  }, [open, kategoriList.length])

  // ===== Handlers =====
  const toggleFilter = (key, value) => {
    // Klik chip yang sama lagi = unselect (clear)
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? '' : value,
    }))
  }

  const handleReset = () => {
    setFilters({ kategori_id: '', jenis_pewarna: '', status: '' })
  }

  const handleApply = () => {
    onApply?.(filters)
    onClose?.()
  }

  // Hitung jumlah filter aktif (untuk tampilan)
  const activeCount = Object.values(filters).filter(Boolean).length

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filter"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={handleReset} disabled={activeCount === 0}>
            Reset
          </Button>
          <Button variant="primary" onClick={handleApply}>
            Terapkan {activeCount > 0 && `(${activeCount})`}
          </Button>
        </>
      }
    >
      {/* ===== Kategori ===== */}
      <FilterSection title="Kategori">
        {loadingKategori ? (
          <p className="text-sm text-[#a47352]/60">Memuat kategori...</p>
        ) : kategoriList.length === 0 ? (
          <p className="text-sm text-[#a47352]/60">Tidak ada kategori</p>
        ) : (
          <FilterChips
            options={kategoriList.map((k) => ({ value: k.id, label: k.nama }))}
            value={filters.kategori_id}
            onChange={(v) => toggleFilter('kategori_id', v)}
          />
        )}
      </FilterSection>

      {/* ===== Pewarna ===== */}
      <FilterSection title="Pewarna">
        <FilterChips
          options={Object.entries(JENIS_PEWARNA_LABEL).map(([k, v]) => ({
            value: k,
            label: v,
          }))}
          value={filters.jenis_pewarna}
          onChange={(v) => toggleFilter('jenis_pewarna', v)}
        />
      </FilterSection>

      {/* ===== Status Produk ===== */}
      <FilterSection title="Status Produk">
        <FilterChips
          options={Object.entries(STATUS_PRODUK_LABEL).map(([k, v]) => ({
            value: k,
            label: v,
          }))}
          value={filters.status}
          onChange={(v) => toggleFilter('status', v)}
        />
      </FilterSection>
    </Modal>
  )
}

// =====================================================
// Sub-components
// =====================================================
function FilterSection({ title, children }) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="text-[#a47352] text-base font-medium mb-3">{title}</p>
      {children}
    </div>
  )
}

function FilterChips({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => {
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              h-[52px] rounded-[10px] text-base font-medium px-4
              border transition-all duration-150 ease-out
              active:scale-[0.97]
              ${
                isActive
                  ? 'bg-[#a47352] text-white border-[#a47352] shadow-md'
                  : 'bg-[rgba(227,194,172,0.35)] text-[#a47352] border-transparent hover:border-[#a47352]/50 hover:bg-[rgba(227,194,172,0.5)]'
              }
            `}
          >
            <span className="truncate block">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}