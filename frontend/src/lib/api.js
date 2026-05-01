// =====================================================
// api.js
// Axios instance untuk semua HTTP request ke backend.
//
// Fitur:
// 1. Base URL dari env variable (VITE_API_URL)
// 2. Auto-attach token Authorization dari Supabase session
// 3. Error handler global (network error, 401 auto-logout)
// 4. Default timeout 30 detik
// 5. Khusus untuk PDF endpoint → support responseType: 'blob'
//
// Cara pakai:
//   import api from '@/lib/api'
//
//   // GET biasa
//   const { data } = await api.get('/api/produk')
//
//   // POST dengan body
//   const { data } = await api.post('/api/orders', { items: [...] })
//
//   // GET PDF (binary)
//   const blob = await api.get('/api/orders/123/struk', { responseType: 'blob' })
// =====================================================

import axios from 'axios'
import { supabase } from './supabase'

// Base URL backend (dari .env.local)
// Default ke localhost:3000 kalau tidak ada
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Bikin axios instance dengan config default
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000, // 30 detik (toleran untuk PDF generation)
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// =====================================================
// REQUEST INTERCEPTOR
// Dijalankan SEBELUM setiap request dikirim.
// Kerjanya: ambil token dari Supabase session, attach ke Authorization header.
// =====================================================
api.interceptors.request.use(
  async (config) => {
    try {
      // Ambil session dari Supabase (otomatis di-refresh kalau hampir expired)
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
      }
    } catch (err) {
      // Kalau gagal ambil session, request tetap dikirim tanpa token
      // Backend akan return 401 yang akan ditangani di response interceptor
      console.warn('[api] gagal ambil session:', err.message)
    }

    return config
  },
  (error) => Promise.reject(error)
)

// =====================================================
// RESPONSE INTERCEPTOR
// Dijalankan SETELAH response diterima (atau error terjadi).
// Kerjanya:
//   - 401 (Unauthorized) → kemungkinan token expired, sign out user
//   - Network error → kasih pesan jelas
//   - Lain-lain → forward ke caller
// =====================================================
api.interceptors.response.use(
  (response) => response, // success: pass-through

  async (error) => {
    // ===== Network error (server tidak respond) =====
    if (!error.response) {
      // Bisa karena: backend mati, internet putus, CORS, dll
      const customError = new Error(
        'Tidak bisa konek ke server. Cek koneksi internet atau pastikan backend running.'
      )
      customError.isNetworkError = true
      customError.original = error
      return Promise.reject(customError)
    }

    // ===== HTTP error responses =====
    const status = error.response.status

    // 401 Unauthorized: token invalid/expired → auto sign out
    if (status === 401) {
      // Sign out dari Supabase (clear session di localStorage)
      try {
        await supabase.auth.signOut()
      } catch (e) {
        // ignore — yang penting session di-clear
      }

      // Reload ke login page (pakai window.location agar state Zustand reset)
      // Cek dulu: kalau user MEMANG di halaman login, jangan redirect
      // (mencegah infinite loop saat login gagal)
      const currentPath = window.location.pathname
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/lupa-password')) {
        window.location.href = '/login'
      }
    }

    // Forward error ke caller dengan response data utuh
    return Promise.reject(error)
  }
)

// =====================================================
// HELPER: Download blob sebagai file (untuk PDF)
// =====================================================
/**
 * Download blob (PDF/file) dengan nama tertentu
 *
 * Cara pakai:
 *   const response = await api.get('/api/orders/123/struk', { responseType: 'blob' })
 *   downloadBlob(response.data, `struk-${nomorOrder}.pdf`)
 */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Buka blob di tab baru (preview PDF)
 *
 * Cara pakai:
 *   const response = await api.get('/api/orders/123/struk', { responseType: 'blob' })
 *   openBlobInNewTab(response.data)
 */
export function openBlobInNewTab(blob) {
  const url = window.URL.createObjectURL(blob)
  window.open(url, '_blank')
  // Note: jangan revoke URL terlalu cepat, browser butuh waktu render PDF
  setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
}

// =====================================================
// HELPER: Extract pesan error dari response
// Backend kita pakai format { success: false, error: "...", details: {...} }
// =====================================================
/**
 * Ambil pesan error dari axios error untuk ditampilkan ke user.
 *
 * Priority:
 *   1. Network error → pesan custom dari interceptor
 *   2. error.response.data.error → backend error message
 *   3. error.response.data.message → fallback (kalau ada)
 *   4. error.message → axios default message
 *   5. fallback generic
 */
export function getErrorMessage(error) {
  if (error?.isNetworkError) return error.message
  if (error?.response?.data?.error) return error.response.data.error
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.message) return error.message
  return 'Terjadi kesalahan yang tidak diketahui'
}

export default api