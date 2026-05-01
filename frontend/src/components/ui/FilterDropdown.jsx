// =====================================================
// FilterDropdown.jsx
// Dropdown untuk filter table (mis. filter by status, kategori).
// Beda dengan Select biasa: ini punya label "Filter:" + bisa "Semua"
//
// Cara pakai:
//   <FilterDropdown
//     label="Status"
//     value={statusFilter}
//     onChange={setStatusFilter}
//     options={[
//       { value: 'ready', label: 'Tersedia' },
//       { value: 'sold', label: 'Habis' },
//     ]}
//     allLabel="Semua Status"
//   />
// =====================================================

import { Filter, ChevronDown } from 'lucide-react'

export default function FilterDropdown({
  label,
  value = '',
  onChange,
  options = [],
  allLabel = 'Semua',
  className = '',
}) {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Label optional di luar */}
      {label && (
        <span className="text-sm font-medium text-gray-700 mr-2">
          {label}:
        </span>
      )}

      <div className="relative inline-block">
        {/* Filter icon di kiri */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Filter className="w-4 h-4 text-[#a47352]" />
        </div>

        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#a47352]/20 focus:border-[#a47352] appearance-none cursor-pointer min-w-[160px]"
        >
          <option value="">{allLabel}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Chevron di kanan */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  )
}
