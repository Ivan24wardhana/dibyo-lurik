import { successResponse, errorResponse, getCurrentUser } from '@/lib/helpers'

/**
 * Laporan penjualan
 * Methods: GET
 */

export async function GET(request) {
  try {
    const { supabase, profile } = await getCurrentUser(request)
    // TODO: implement
    return successResponse({ message: 'Laporan penjualan - GET' })
  } catch (error) {
    return errorResponse(error.message, 401)
  }
}

export async function POST(request) {
  try {
    const { supabase, profile } = await getCurrentUser(request)
    const body = await request.json()
    // TODO: implement
    return successResponse({ message: 'Laporan penjualan - POST' }, 201)
  } catch (error) {
    return errorResponse(error.message)
  }
}
