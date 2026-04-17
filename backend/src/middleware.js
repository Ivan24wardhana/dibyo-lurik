import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173'
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers })
  }
  return response
}

export const config = { matcher: '/api/:path*' }
