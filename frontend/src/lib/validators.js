// =====================================================
// validators.js
// Helper untuk validasi form input di frontend.
//
// Pattern: setiap function return:
//   - null kalau valid
//   - string pesan error kalau invalid
//
// Cara pakai di form:
//   const error = validateRequired(value, 'Nama')
//   if (error) setErrors({ nama: error })
//
// Untuk validasi banyak field sekaligus, pakai validateForm():
//   const errors = validateForm(formData, {
//     nama: [validateRequired, (v) => validateMinLength(v, 3)],
//     email: [validateRequired, validateEmail],
//   })
// =====================================================

// =====================================================
// VALIDATOR DASAR
// =====================================================

/**
 * Field wajib diisi (tidak kosong/null/undefined)
 */
export function validateRequired(value, fieldName = 'Field') {
  if (value === null || value === undefined) return `${fieldName} wajib diisi`
  if (typeof value === 'string' && value.trim() === '') return `${fieldName} wajib diisi`
  return null
}

/**
 * Minimal panjang string
 */
export function validateMinLength(value, minLength, fieldName = 'Field') {
  if (!value) return null // skip kalau empty (pakai validateRequired terpisah)
  if (value.length < minLength) {
    return `${fieldName} minimal ${minLength} karakter`
  }
  return null
}

/**
 * Maksimal panjang string
 */
export function validateMaxLength(value, maxLength, fieldName = 'Field') {
  if (!value) return null
  if (value.length > maxLength) {
    return `${fieldName} maksimal ${maxLength} karakter`
  }
  return null
}

/**
 * Email valid
 */
export function validateEmail(value, fieldName = 'Email') {
  if (!value) return null
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) return `${fieldName} tidak valid`
  return null
}

/**
 * Nomor HP Indonesia (mulai 08 atau +62, panjang 10-15 digit)
 */
export function validatePhone(value, fieldName = 'Nomor HP') {
  if (!value) return null
  // Hilangkan spasi & dash
  const cleaned = String(value).replace(/[\s-]/g, '')
  // Pattern: dimulai 08 atau +62 atau 62, lalu 8-13 digit
  const phoneRegex = /^(\+62|62|0)8[0-9]{8,13}$/
  if (!phoneRegex.test(cleaned)) return `${fieldName} tidak valid (contoh: 08123456789)`
  return null
}

/**
 * Number minimum
 */
export function validateMin(value, min, fieldName = 'Field') {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (isNaN(num)) return `${fieldName} harus berupa angka`
  if (num < min) return `${fieldName} minimal ${min}`
  return null
}

/**
 * Number maximum
 */
export function validateMax(value, max, fieldName = 'Field') {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (isNaN(num)) return `${fieldName} harus berupa angka`
  if (num > max) return `${fieldName} maksimal ${max}`
  return null
}

/**
 * Number valid (bukan NaN, finite)
 */
export function validateNumber(value, fieldName = 'Field') {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (isNaN(num) || !isFinite(num)) return `${fieldName} harus berupa angka`
  return null
}

/**
 * Integer (bilangan bulat)
 */
export function validateInteger(value, fieldName = 'Field') {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (!Number.isInteger(num)) return `${fieldName} harus berupa bilangan bulat`
  return null
}

/**
 * Value dalam list yang diizinkan (enum)
 */
export function validateInEnum(value, allowed, fieldName = 'Field') {
  if (value === null || value === undefined) return null
  if (!allowed.includes(value)) {
    return `${fieldName} harus salah satu dari: ${allowed.join(', ')}`
  }
  return null
}

/**
 * UUID v4 valid
 */
export function validateUUID(value, fieldName = 'ID') {
  if (!value) return null
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(value)) return `${fieldName} tidak valid`
  return null
}

/**
 * 2 password harus sama (untuk konfirmasi password)
 */
export function validateMatch(value, otherValue, fieldName = 'Konfirmasi') {
  if (value !== otherValue) return `${fieldName} tidak cocok`
  return null
}

// =====================================================
// HELPER: validate banyak field sekaligus
// =====================================================

/**
 * Validasi seluruh form sekaligus.
 *
 * @param {object} data - Data form (mis. { nama: '...', email: '...' })
 * @param {object} schema - Aturan validasi per field, format:
 *   {
 *     nama: [validateRequired, (v) => validateMinLength(v, 3, 'Nama')],
 *     email: [validateRequired, validateEmail],
 *   }
 * @returns {object} Object errors. Format: { fieldName: 'pesan error' }
 *   Empty object {} kalau semua valid.
 *
 * Contoh:
 *   const errors = validateForm(formData, {
 *     nama: [(v) => validateRequired(v, 'Nama')],
 *     email: [(v) => validateRequired(v, 'Email'), validateEmail],
 *   })
 *
 *   if (Object.keys(errors).length > 0) {
 *     setErrors(errors)
 *     return
 *   }
 *   // ... submit
 */
export function validateForm(data, schema) {
  const errors = {}

  for (const [field, validators] of Object.entries(schema)) {
    const value = data[field]
    for (const validator of validators) {
      const error = validator(value)
      if (error) {
        errors[field] = error
        break // ambil error pertama saja per field
      }
    }
  }

  return errors
}

/**
 * Cek apakah object errors kosong (semua valid)
 */
export function isFormValid(errors) {
  return Object.keys(errors).length === 0
}