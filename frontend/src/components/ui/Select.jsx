// =====================================================
// Select.jsx
// Dropdown select reusable.
//
// Cara pakai:
//   <Select
//     label="Kategori"
//     value={kategoriId}
//     onChange={e => setKategoriId(e.target.value)}
//     options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]}
//     placeholder="Pilih kategori..."
//   />
//
//   // Atau pakai children kalau butuh kontrol manual:
//   <Select label="Status">
//     <option value="ready">Tersedia</option>
//     <option value="sold">Habis</option>
//   </Select>
// =====================================================

import { ChevronDown } from 'lucide-react'

export default function Select({
  label,
  error,
  required = false,
  options,
  placeholder = 'Pilih...',
  children,
  className = '',
  selectClassName = '',
  ...rest
}) {
  const borderClass = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
    : 'border-gray-300 focus:border-[#a47352] focus:ring-[#a47352]/20'

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          className={`
            w-full py-2.5 pl-3 pr-10
            border ${borderClass} rounded-lg
            bg-white text-gray-900
            focus:outline-none focus:ring-2
            disabled:bg-gray-100 disabled:cursor-not-allowed
            appearance-none
            transition-colors
            ${selectClassName}
          `}
          {...rest}
        >
          {/* Placeholder option */}
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {/* Render options dari prop atau children */}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {/* Chevron icon di kanan */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  )
}
