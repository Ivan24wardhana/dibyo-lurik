// =====================================================
// Textarea.jsx
// Textarea reusable - input multi-line dengan label & error.
//
// Cara pakai:
//   <Textarea label="Catatan" rows={4} value={...} onChange={...} />
//   <Textarea label="Alamat" placeholder="Masukkan alamat lengkap" />
// =====================================================

export default function Textarea({
  label,
  error,
  required = false,
  rows = 4,
  className = '',
  textareaClassName = '',
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

      <textarea
        rows={rows}
        className={`
          w-full px-3 py-2.5
          border ${borderClass} rounded-lg
          text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2
          disabled:bg-gray-100 disabled:cursor-not-allowed
          resize-vertical
          transition-colors
          ${textareaClassName}
        `}
        {...rest}
      />

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  )
}
