// =====================================================
// proxy.js (Next.js 16+)
// CORS handler untuk semua API request.
//
// FIX: OPTIONS di-cek SEBELUM NextResponse.next()
// Supaya route handler tidak sempat return 405.
//
// Lokasi: backend/src/proxy.js
// =====================================================

import { NextResponse } from 'next/server'

export function proxy(request) {
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173'

  // ⭐ Cek OPTIONS DULU sebelum next() - INI KUNCINYA
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
      },
    })
  }

  // Request normal (GET, POST, PATCH, DELETE, dll)
  const response = NextResponse.next()
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Allow-Credentials', 'true')

  return response
}

export const config = { matcher: '/api/:path*' }