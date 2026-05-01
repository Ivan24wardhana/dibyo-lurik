// =====================================================
// auth-helper.js
// Helper untuk validasi token & ambil user+profile.
//
// Setiap endpoint yang butuh authentication akan pakai helper ini
// untuk:
//   1. Extract token dari header Authorization: "Bearer xxx"
//   2. Validate token ke Supabase Auth
//   3. Ambil profile dari tabel profiles (untuk dapat role, nama, dll)
//
// CARA PAKAI:
//
//   import { getUserFromRequest } from '@/lib/auth-helper'
//   import { unauthorizedResponse } from '@/lib/response-helper'
//
//   export async function GET(request) {
//     const auth = await getUserFromRequest(request)
//     if (!auth.success) return unauthorizedResponse(auth.error)
//
//     const { user, profile } = auth
//     // user.id, profile.role, profile.username dll bisa langsung dipakai
//   }
// =====================================================

import supabaseAdmin from './supabase-admin'

/**
 * Ekstrak token Bearer dari header Authorization
 *
 * Format header yang dikirim frontend (via axios interceptor):
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *
 * @param {Request} request - Next.js Request object
 * @returns {string|null} Token string (tanpa "Bearer ") atau null kalau tidak ada
 */
function extractBearerToken(request) {
  const authHeader = request.headers.get('authorization') || ''
  // Regex: tangkap apa pun setelah "Bearer " (case-insensitive)
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

/**
 * Validasi request & ambil user + profile yang sedang login.
 *
 * Function ini melakukan 3 hal:
 *   1. Extract token dari header
 *   2. Verifikasi token ke Supabase Auth (apakah valid & belum expired)
 *   3. Query tabel profiles untuk dapat data lengkap (role, nama, dll)
 *
 * @param {Request} request - Next.js Request object
 * @returns {Promise<{
 *   success: boolean,
 *   user?: object,
 *   profile?: object,
 *   error?: string
 * }>}
 *
 * Pattern return:
 *   - Sukses: { success: true, user: {...}, profile: {...} }
 *   - Gagal:  { success: false, error: 'pesan error' }
 *
 * Kenapa pakai pattern { success, ... } bukan throw error?
 * - Caller bisa cek `.success` lalu return sesuai konteksnya.
 * - Lebih predictable, tidak perlu try-catch berlapis di endpoint.
 */
export async function getUserFromRequest(request) {
  // ===== Step 1: Extract token =====
  const token = extractBearerToken(request)
  if (!token) {
    return {
      success: false,
      error: 'Token tidak ditemukan. Silakan login ulang.',
    }
  }

  // ===== Step 2: Verifikasi token ke Supabase Auth =====
  // supabaseAdmin.auth.getUser(token) = decode token & cek validitas.
  // Kalau token expired/invalid, akan return error.
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !userData?.user) {
    return {
      success: false,
      error: 'Sesi tidak valid atau sudah berakhir. Silakan login ulang.',
    }
  }

  const user = userData.user

  // ===== Step 3: Ambil profile (untuk dapat role, dll) =====
  // Pakai admin client supaya bypass RLS — kita sudah validasi user,
  // jadi aman untuk akses langsung profilnya.
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, username, email, nama, role, avatar_url, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      success: false,
      error: 'Profile tidak ditemukan. Akun mungkin sudah dihapus.',
    }
  }

  // ===== Sukses: return user + profile =====
  return {
    success: true,
    user,
    profile,
  }
}

/**
 * Shortcut: hanya ambil profile (tanpa data user dari Supabase Auth).
 * Berguna untuk endpoint yang cukup butuh profile saja.
 *
 * @param {Request} request
 * @returns {Promise<object|null>} profile atau null kalau gagal
 */
export async function getProfileFromRequest(request) {
  const result = await getUserFromRequest(request)
  return result.success ? result.profile : null
}