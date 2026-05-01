import { successResponse, errorResponse } from '@/lib/helpers'
import supabaseAdmin from '@/lib/supabase-admin'
import supabasePublic from '@/lib/supabase-public'

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Return: { session, user, profile }
 *
 * Flow:
 * 1. Cari email di tabel profiles berdasarkan username (pakai admin, bypass RLS)
 * 2. signInWithPassword(email, password) pakai public client
 * 3. Return session token + profile lengkap
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return errorResponse('Username dan password wajib diisi', 400)
    }

    // Step 1: cari profile by username
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, email, nama, role, avatar_url')
      .eq('username', username)
      .single()

    if (profileError || !profile) {
      return errorResponse('Username atau password salah', 401)
    }

    // Step 2: sign in dengan email
    const { data: authData, error: authError } = await supabasePublic.auth.signInWithPassword({
      email: profile.email,
      password: password,
    })

    if (authError || !authData.session) {
      return errorResponse('Username atau password salah', 401)
    }

    // Step 3: return session + profile
    return successResponse({
      session: authData.session,
      user: authData.user,
      profile: profile,
    })
  } catch (error) {
    return errorResponse(error.message, 500)
  }
}