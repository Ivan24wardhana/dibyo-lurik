// =====================================================
// FilterProdukDropdown.jsx
// Filter dropdown untuk halaman Produk.
// Sections: Kategori (dinamis DB) + Pewarna + Status Produk
//
// PENTING: Render dalam container relative dengan containerRef:
//   const containerRef = useRef(null)
//   <div className="relative" ref={containerRef}>
//     <button onClick={...}>Filter</button>
//     <FilterProdukDropdown containerRef={containerRef} ... />
//   </div>
// =====================================================

import { useState, useEffect } from 'react'
import FilterDropdownPanel, { FilterSection, FilterChips } from './FilterDropdownPanel'
import useMasterData from '../../hooks/useMasterData'

export default function FilterProdukDropdown({
  open,
  onClose,
  filters = {},
  onChange,
  containerRef,
}) {
  const { kategoriList } = useMasterData()

  // Local state buffer sebelum Terapkan
  const [local, setLocal] = useState({
    kategori_id: '',
    jenis_pewarna: '',
    status: '',
  })

  useEffect(() => {
    if (open) {
      setLocal({
        kategori_id: filters.kategori_id || '',
        jenis_pewarna: filters.jenis_pewarna || '',
        status: filters.status || '',
      })
    }
  }, [open, filters.kategori_id, filters.jenis_pewarna, filters.status])

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
      {/* Kategori - dinamis dari DB */}
      <FilterSection title="Kategori">
        <FilterChips
          options={kategoriList.map((k) => ({ value: k.id, label: k.nama }))}
          value={local.kategori_id}
          onChange={(v) => setLocal((prev) => ({ ...prev, kategori_id: v }))}
        />
      </FilterSection>

      {/* Pewarna */}
      <FilterSection title="Pewarna">
        <FilterChips
          options={[
            { value: 'sintetis', label: 'Pewarna Sintetis' },
            { value: 'alami', label: 'Pewarna Alami' },
          ]}
          value={local.jenis_pewarna}
          onChange={(v) => setLocal((prev) => ({ ...prev, jenis_pewarna: v }))}
        />
      </FilterSection>

      {/* Status Produk */}
      <FilterSection title="Status Produk">
        <FilterChips
          options={[
            { value: 'sold', label: 'Sold' },
            { value: 'ready', label: 'Ready' },
          ]}
          value={local.status}
          onChange={(v) => setLocal((prev) => ({ ...prev, status: v }))}
        />
      </FilterSection>
    </FilterDropdownPanel>
  )
}