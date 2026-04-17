import { successResponse, errorResponse, getCurrentUser } from '@/lib/helpers'

/**
 * CRUD Motif
 * Methods: GET, POST
 */

export async function GET(request) {
  try {
    const { supabase, profile } = await getCurrentUser(request)
    // TODO: implement
    return successResponse({ message: 'CRUD Motif - GET' })
  } catch (error) {
    return errorResponse(error.message, 401)
  }
}

export async function POST(request) {
  try {
    const { supabase, profile } = await getCurrentUser(request)
    const body = await request.json()
    // TODO: implement
    return successResponse({ message: 'CRUD Motif - POST' }, 201)
  } catch (error) {
    return errorResponse(error.message)
  }
}
