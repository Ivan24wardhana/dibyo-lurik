// =====================================================
// FilterPODropdown.jsx
// Filter dropdown untuk halaman Pre-Order (Reguler & Custom).
// Sections:
//   - Status Produksi (semua diproses, sedang, selesai)
//   - Status Pembayaran (opsional, hanya untuk CS)
//
// Pakai dalam container relative dengan containerRef:
//   const containerRef = useRef(null)
//   <div className="relative" ref={containerRef}>
//     <button onClick={...}>Filter</button>
//     <FilterPODropdown containerRef={containerRef} ... />
//   </div>
// =====================================================

import { useState, useEffect } from 'react'
import FilterDropdownPanel, { FilterSection, FilterChips } from '../produk/FilterDropdownPanel'

export default function FilterPODropdown({
  open,
  onClose,
  filters = {},
  onChange,
  containerRef,
  showPembayaran = false,
}) {
  // Local buffer state sebelum klik Terapkan
  const [local, setLocal] = useState({
    status: '',
    status_pembayaran: '',
  })

  // Sync local saat panel dibuka
  useEffect(() => {
    if (open) {
      setLocal({
        status: filters.status || '',
        status_pembayaran: filters.status_pembayaran || '',
      })
    }
  }, [open, filters.status, filters.status_pembayaran])

  const handleApply = () => {
    onChange?.(local)
  }

  return (
    <FilterDropdownPanel
      open={open}
      onClose={onClose}
      onApply={handleApply}
      containerRef={containerRef}
    >
      {/* Status Produksi */}
      <FilterSection title="Status Produksi">
        <FilterChips
          options={[
            { value: 'belum_diproses', label: 'Belum diproses' },
            { value: 'sedang_diproses', label: 'Sedang diproses' },
            { value: 'selesai_diproses', label: 'Selesai diproses' },
          ]}
          value={local.status}
          onChange={(v) => setLocal((prev) => ({ ...prev, status: v }))}
        />
      </FilterSection>

      {/* Status Pembayaran - hanya CS yang lihat */}
      {showPembayaran && (
        <FilterSection title="Status Pembayaran">
          <FilterChips
            options={[
              { value: 'dp', label: 'DP' },
              { value: 'lunas', label: 'Lunas' },
            ]}
            value={local.status_pembayaran}
            onChange={(v) =>
              setLocal((prev) => ({ ...prev, status_pembayaran: v }))
            }
          />
        </FilterSection>
      )}
    </FilterDropdownPanel>
  )
}