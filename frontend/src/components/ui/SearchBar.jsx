// =====================================================
// SearchBar.jsx
// Input search dengan debounce - call onSearch hanya setelah
// user berhenti ngetik 300ms (mencegah spam request ke backend).
//
// Cara pakai:
//   const [query, setQuery] = useState('')
//
//   <SearchBar
//     value={query}
//     onChange={setQuery}                  ← update local state setiap keystroke
//     onSearch={(q) => fetchData(q)}        ← debounced call
//     placeholder="Cari produk..."
//   />
//
// Penjelasan: tujuan SearchBar berbeda dengan Input biasa:
// - Input biasa: setiap keystroke trigger callback
// - SearchBar: tunggu user berhenti ngetik 300ms, baru trigger search
//   (lebih efisien untuk API call)
// =====================================================

import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'

export default function SearchBar({
  value: externalValue,
  onChange,
  onSearch,
  placeholder = 'Cari...',
  debounceMs = 300,
  className = '',
}) {
  // Internal state untuk display (sync dengan external value)
  const [internalValue, setInternalValue] = useState(externalValue || '')

  // Sync external → internal saat external value berubah
  useEffect(() => {
    setInternalValue(externalValue || '')
  }, [externalValue])

  // Debounce: trigger onSearch setelah debounceMs idle
  useEffect(() => {
    if (!onSearch) return

    const timer = setTimeout(() => {
      onSearch(internalValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [internalValue, onSearch, debounceMs])

  const handleChange = (e) => {
    const val = e.target.value
    setInternalValue(val)
    onChange?.(val) // langsung update external state untuk responsiveness
  }

  const handleClear = () => {
    setInternalValue('')
    onChange?.('')
    onSearch?.('')
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search icon di kiri */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-5 h-5 text-gray-400" />
      </div>

      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#a47352]/20 focus:border-[#a47352] transition-colors"
      />

      {/* Clear button di kanan (cuma muncul kalau ada value) */}
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
