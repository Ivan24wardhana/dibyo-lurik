// =====================================================
// Input.jsx
// Input field reusable dengan label & error message.
//
// Cara pakai:
//   <Input label="Nama" value={nama} onChange={e => setNama(e.target.value)} />
//   <Input label="Email" type="email" error={errors.email} />
//   <Input label="Harga" type="number" prefix="Rp" />
//   <Input label="Panjang" type="number" suffix="m" />
// =====================================================

export default function Input({
  label,
  error,
  prefix,
  suffix,
  required = false,
  type = 'text',
  className = '',
  inputClassName = '',
  ...rest
}) {
  // Border color berubah berdasarkan state (error / focus)
  const borderClass = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
    : 'border-gray-300 focus:border-[#a47352] focus:ring-[#a47352]/20'

  // Padding kiri/kanan disesuaikan kalau ada prefix/suffix
  const paddingClass = `${prefix ? 'pl-10' : 'pl-3'} ${suffix ? 'pr-10' : 'pr-3'}`

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Input wrapper - relative supaya prefix/suffix bisa absolute */}
      <div className="relative">
        {/* Prefix (mis. "Rp") */}
        {prefix && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm pointer-events-none">
            {prefix}
          </div>
        )}

        <input
          type={type}
          className={`
            w-full py-2.5 ${paddingClass}
            border ${borderClass} rounded-lg
            text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-colors
            ${inputClassName}
          `}
          {...rest}
        />

        {/* Suffix (mis. "m", "cm") */}
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 text-sm pointer-events-none">
            {suffix}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
