// =====================================================
// validation.js
// Helper untuk validasi input dari user (request body / query params).
//
// Tujuan:
// - Cegah data invalid masuk ke database
// - Pesan error konsisten dalam bahasa Indonesia
// - Pattern reusable di semua endpoint
//
// CARA PAKAI:
//
//   import { validate, isValidUUID } from '@/lib/validation'
//   import { errorResponse } from '@/lib/response-helper'
//
//   const body = await request.json()
//
//   const errors = validate(body, {
//     nama_kategori: { type: 'string', required: true, minLength: 2 },
//     status:        { type: 'enum', required: true, values: ['ready', 'sold'] },
//     stok:          { type: 'number', required: true, min: 0 },
//   })
//
//   if (errors.length > 0) {
//     return errorResponse('Input tidak valid', 400, { errors })
//   }
// =====================================================

// =====================================================
// REGEX & PRESET
// =====================================================

// UUID v4 standard
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// =====================================================
// SIMPLE VALIDATORS — bisa dipakai standalone atau via validate()
// =====================================================

/**
 * Cek string UUID valid
 * @param {string} value
 * @returns {boolean}
 */
export function isValidUUID(value) {
  if (typeof value !== 'string') return false
  return UUID_REGEX.test(value)
}

/**
 * Cek string non-empty (setelah trim)
 * @param {any} value
 * @returns {boolean}
 */
export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Cek number valid (bukan NaN, finite)
 * @param {any} value
 * @returns {boolean}
 */
export function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * Cek nilai ada di list yang diizinkan (enum)
 * @param {any} value
 * @param {any[]} allowed
 * @returns {boolean}
 */
export function isInEnum(value, allowed) {
  return Array.isArray(allowed) && allowed.includes(value)
}

// =====================================================
// MAIN VALIDATOR — validate(data, schema)
// =====================================================

/**
 * Validate object berdasarkan schema rules.
 *
 * Schema format:
 *   {
 *     fieldName: {
 *       type: 'string' | 'number' | 'integer' | 'uuid' | 'enum' | 'boolean',
 *       required?: boolean,
 *       minLength?: number,    // untuk string
 *       maxLength?: number,    // untuk string
 *       min?: number,          // untuk number/integer
 *       max?: number,          // untuk number/integer
 *       values?: any[],        // untuk enum
 *       label?: string,        // label untuk pesan error (default: fieldName)
 *     }
 *   }
 *
 * @param {object} data - Data yang divalidasi (mis. request body)
 * @param {object} schema - Aturan validasi per field
 * @returns {string[]} Array pesan error. Kalau kosong = valid.
 */
export function validate(data, schema) {
  const errors = []

  // Pastikan data adalah object
  if (!data || typeof data !== 'object') {
    return ['Data harus berupa object']
  }

  // Loop tiap field di schema
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]
    const label = rules.label || field

    // ===== Cek required =====
    const isMissing =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '')

    if (isMissing) {
      if (rules.required) {
        errors.push(`${label} wajib diisi`)
      }
      // Kalau tidak required dan kosong, skip cek lain
      continue
    }

    // ===== Cek tipe =====
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${label} harus berupa teks`)
          break
        }
        if (rules.minLength && value.trim().length < rules.minLength) {
          errors.push(`${label} minimal ${rules.minLength} karakter`)
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${label} maksimal ${rules.maxLength} karakter`)
        }
        break

      case 'number':
        if (!isValidNumber(Number(value))) {
          errors.push(`${label} harus berupa angka`)
          break
        }
        const numValue = Number(value)
        if (rules.min !== undefined && numValue < rules.min) {
          errors.push(`${label} minimal ${rules.min}`)
        }
        if (rules.max !== undefined && numValue > rules.max) {
          errors.push(`${label} maksimal ${rules.max}`)
        }
        break

      case 'integer':
        if (!Number.isInteger(Number(value))) {
          errors.push(`${label} harus berupa bilangan bulat`)
          break
        }
        const intValue = Number(value)
        if (rules.min !== undefined && intValue < rules.min) {
          errors.push(`${label} minimal ${rules.min}`)
        }
        if (rules.max !== undefined && intValue > rules.max) {
          errors.push(`${label} maksimal ${rules.max}`)
        }
        break

      case 'uuid':
        if (!isValidUUID(value)) {
          errors.push(`${label} harus berupa UUID yang valid`)
        }
        break

      case 'enum':
        if (!isInEnum(value, rules.values)) {
          const allowed = (rules.values || []).join(', ')
          errors.push(`${label} harus salah satu dari: ${allowed}`)
        }
        break

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${label} harus berupa true/false`)
        }
        break

      default:
        errors.push(`${label}: tipe '${rules.type}' tidak dikenal`)
    }
  }

  return errors
}

/**
 * Helper: parse JSON body dari request dengan safety.
 * Return null kalau body bukan JSON yang valid.
 *
 * Kenapa perlu helper ini? Kalau body kosong / bukan JSON,
 * await request.json() akan throw exception. Helper ini
 * tangani error dengan elegant.
 *
 * @param {Request} request
 * @returns {Promise<object|null>}
 */
export async function safeParseBody(request) {
  try {
    const body = await request.json()
    return body && typeof body === 'object' ? body : null
  } catch {
    return null
  }
}