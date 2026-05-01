// =====================================================
// role-helper.js
// Helper untuk validasi hak akses berdasarkan role.
//
// 3 role yang ada (sesuai schema profiles):
//   - owner            (akses semua, terutama laporan & finansial)
//   - kepala_produksi  (master data, produk, gulungan, PO)
//   - customer_service (orders, pre-order, riwayat)
//
// CARA PAKAI:
//
//   import { hasRole, requireRole } from '@/lib/role-helper'
//   import { forbiddenResponse } from '@/lib/response-helper'
//
//   // Cara 1: cek manual
//   if (!hasRole(profile, ['kepala_produksi', 'owner'])) {
//     return forbiddenResponse('Hanya kepala produksi atau owner')
//   }
//
//   // Cara 2: pakai requireRole (return early kalau gagal)
//   const guard = requireRole(profile, ['owner'])
//   if (guard) return guard  // ← sudah berisi response 403, langsung return
// =====================================================

import { forbiddenResponse } from './response-helper'

// =====================================================
// CONSTANT — Definisi role
// Pakai constant supaya typo terdeteksi (vs string literal)
// =====================================================
export const ROLES = {
  OWNER: 'owner',
  KEPALA_PRODUKSI: 'kepala_produksi',
  CUSTOMER_SERVICE: 'customer_service',
}

// =====================================================
// PRESET role groups
// Sering dipakai, jadi kita bikin shortcut.
// Ini mencerminkan RLS policies di schema.
// =====================================================

/** Hanya owner */
export const OWNER_ONLY = [ROLES.OWNER]

/** Master data (kategori, motif, rak, harga, produk, gulungan) - sesuai RLS */
export const PRODUCTION_ROLES = [ROLES.KEPALA_PRODUKSI, ROLES.OWNER]

/** Bisa input pre-order (CS atau kepala produksi) - sesuai RLS por_insert/poc_insert */
export const PRE_ORDER_INPUT_ROLES = [ROLES.CUSTOMER_SERVICE, ROLES.KEPALA_PRODUKSI]

/** Bisa update status pre-order (kepala produksi atau owner) - sesuai RLS por_update/poc_update */
export const PRE_ORDER_UPDATE_ROLES = [ROLES.KEPALA_PRODUKSI, ROLES.OWNER]

/** Hanya CS (untuk insert orders) - sesuai RLS orders_insert */
export const ORDER_INPUT_ROLES = [ROLES.CUSTOMER_SERVICE]

/** Semua role yang sudah login */
export const ALL_ROLES = [ROLES.OWNER, ROLES.KEPALA_PRODUKSI, ROLES.CUSTOMER_SERVICE]

// =====================================================
// FUNCTIONS
// =====================================================

/**
 * Cek apakah profile punya salah satu role yang diizinkan.
 *
 * @param {object} profile - Object profile dari getUserFromRequest()
 * @param {string[]} allowedRoles - Array role yang diizinkan, mis. ['owner']
 * @returns {boolean} true kalau role profile ada di list, false kalau tidak
 *
 * Contoh:
 *   hasRole(profile, ['owner'])              // true kalau owner
 *   hasRole(profile, OWNER_ONLY)             // sama dengan di atas
 *   hasRole(profile, PRODUCTION_ROLES)       // true kalau kepala_produksi atau owner
 */
export function hasRole(profile, allowedRoles) {
  if (!profile?.role) return false
  if (!Array.isArray(allowedRoles)) return false
  return allowedRoles.includes(profile.role)
}

/**
 * Guard: kalau profile TIDAK punya role yang diizinkan, return response 403.
 * Kalau OK, return null (caller bisa lanjut).
 *
 * Pattern "guard return": idiomatic untuk Next.js route handlers.
 * Caller cukup tulis 1 baris:
 *   const guard = requireRole(profile, OWNER_ONLY)
 *   if (guard) return guard
 *
 * @param {object} profile
 * @param {string[]} allowedRoles
 * @param {string} [customMessage] - Pesan custom (opsional)
 * @returns {NextResponse|null} Response 403 jika gagal, null jika OK
 */
export function requireRole(profile, allowedRoles, customMessage) {
  if (hasRole(profile, allowedRoles)) {
    return null // sukses, lanjut
  }

  // Bangun pesan default yang informatif
  const roleLabels = {
    owner: 'Owner',
    kepala_produksi: 'Kepala Produksi',
    customer_service: 'Customer Service',
  }
  const allowed = allowedRoles.map((r) => roleLabels[r] || r).join(' atau ')
  const message = customMessage || `Operasi ini hanya untuk ${allowed}`

  return forbiddenResponse(message)
}

/**
 * Shortcut: cek apakah owner
 * @param {object} profile
 * @returns {boolean}
 */
export function isOwner(profile) {
  return profile?.role === ROLES.OWNER
}

/**
 * Shortcut: cek apakah kepala produksi
 * @param {object} profile
 * @returns {boolean}
 */
export function isKepalaProduksi(profile) {
  return profile?.role === ROLES.KEPALA_PRODUKSI
}

/**
 * Shortcut: cek apakah customer service
 * @param {object} profile
 * @returns {boolean}
 */
export function isCustomerService(profile) {
  return profile?.role === ROLES.CUSTOMER_SERVICE
}