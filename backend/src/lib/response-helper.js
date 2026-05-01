// =====================================================
// response-helper.js
// Standar format response untuk SEMUA endpoint API.
//
// Tujuan:
// - Format response konsisten di semua endpoint
// - Frontend gampang parse: cek `success`, kalau true ambil `data`,
//   kalau false tampilkan `error`
// - HTTP status code yang sesuai
//
// KONTRAK FORMAT:
//
// SUCCESS:
//   HTTP 200/201
//   { success: true, data: <payload>, message?: "..." }
//
// ERROR:
//   HTTP 400/401/403/404/500
//   { success: false, error: "Pesan error untuk user", details?: {...} }
//
// Contoh pemakaian di route.js:
//   import { successResponse, errorResponse } from '@/lib/response-helper'
//
//   export async function GET(request) {
//     try {
//       const data = await fetchSomething()
//       return successResponse(data)
//     } catch (err) {
//       return errorResponse('Gagal load data', 500)
//     }
//   }
// =====================================================

import { NextResponse } from 'next/server'

/**
 * Response sukses
 *
 * @param {any} data - Payload yang akan dikirim ke frontend
 * @param {string} [message] - Pesan tambahan (opsional, mis. "Data berhasil disimpan")
 * @param {number} [status=200] - HTTP status code (200 OK, 201 Created)
 *
 * @returns {NextResponse} Response dengan format { success: true, data, message? }
 */
export function successResponse(data, message, status = 200) {
  // Bangun body response
  const body = { success: true, data }
  // message hanya ditambahkan kalau ada (tidak undefined-kan field)
  if (message) body.message = message

  return NextResponse.json(body, { status })
}

/**
 * Response error
 *
 * @param {string} error - Pesan error untuk user (bahasa Indonesia, sopan)
 * @param {number} [status=400] - HTTP status code
 *   - 400 = Bad Request (input user salah)
 *   - 401 = Unauthorized (belum login / token invalid)
 *   - 403 = Forbidden (login tapi tidak punya hak)
 *   - 404 = Not Found (data tidak ditemukan)
 *   - 409 = Conflict (mis. username sudah dipakai)
 *   - 500 = Internal Server Error (bug di backend / DB error)
 * @param {object} [details] - Detail tambahan untuk debugging (opsional)
 *
 * @returns {NextResponse} Response dengan format { success: false, error, details? }
 */
export function errorResponse(error, status = 400, details) {
  const body = { success: false, error }
  if (details) body.details = details

  return NextResponse.json(body, { status })
}

// =====================================================
// SHORTCUT untuk error yang sering dipakai
// Tujuan: kode lebih ringkas dan eksplisit di endpoint
// =====================================================

/** Belum login / token tidak valid */
export function unauthorizedResponse(message = 'Silakan login terlebih dahulu') {
  return errorResponse(message, 401)
}

/** Login tapi role tidak punya akses */
export function forbiddenResponse(message = 'Anda tidak memiliki akses untuk operasi ini') {
  return errorResponse(message, 403)
}

/** Data tidak ditemukan */
export function notFoundResponse(message = 'Data tidak ditemukan') {
  return errorResponse(message, 404)
}

/** Konflik data (mis. duplikasi unique field) */
export function conflictResponse(message = 'Data sudah ada') {
  return errorResponse(message, 409)
}

/** Server error (catch-all untuk exception tak terduga) */
export function serverErrorResponse(error) {
  // Kalau error berupa Error object, ambil message-nya
  const message = error?.message || 'Terjadi kesalahan pada server'
  // Log error lengkap di server (kelihatan di terminal backend)
  console.error('[ServerError]', error)
  return errorResponse(message, 500)
}