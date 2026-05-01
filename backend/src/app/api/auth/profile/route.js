// =====================================================
// /api/auth/profile
// GET   - profil user yang sedang login
// PATCH - update profil sendiri (nama, username, avatar_url)
//
// Catatan keamanan:
// - User hanya boleh update DIRINYA SENDIRI (sesuai RLS policy)
// - Email TIDAK bisa diubah lewat sini (pakai flow lupa password)
// - Role TIDAK bisa diubah (akun fix 3 role)
// - Password TIDAK diubah lewat sini (pakai /api/auth/forgot-password)
// =====================================================

import { withAuth } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  conflictResponse,
} from '@/lib/response-helper'
import { validate, safeParseBody } from '@/lib/validation'
import supabaseAdmin from '@/lib/supabase-admin'

// =====================================================
// GET - profil user sendiri
// =====================================================
export const GET = withAuth(async ({ profile }) => {
  // Profile sudah ter-fetch oleh withAuth, langsung return
  return successResponse(profile)
})

// =====================================================
// PATCH - update profil sendiri
// =====================================================
export const PATCH = withAuth(async ({ request, user, profile }) => {
  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body request tidak valid', 400)

  const errors = validate(body, {
    nama: {
      type: 'string',
      minLength: 2,
      maxLength: 255,
      label: 'Nama',
    },
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 100,
      label: 'Username',
    },
    avatar_url: {
      type: 'string',
      maxLength: 500,
      label: 'Avatar URL',
    },
  })
  if (errors.length) return errorResponse(errors[0], 400, { errors })

  // Cek username unique (kalau diubah)
  if (body.username && body.username.trim() !== profile.username) {
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', body.username.trim())
      .neq('id', user.id)
      .maybeSingle()

    if (existing) return conflictResponse('Username sudah dipakai')
  }

  // Build updates
  const updates = { updated_at: new Date().toISOString() }
  if (body.nama !== undefined) updates.nama = body.nama.trim()
  if (body.username !== undefined) updates.username = body.username.trim()
  if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url

  if (Object.keys(updates).length === 1) {
    return errorResponse('Tidak ada field yang diupdate', 400)
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('id, username, email, nama, role, avatar_url, created_at, updated_at')
    .single()

  if (error) return errorResponse('Gagal update profil: ' + error.message, 500)

  return successResponse(data, 'Profil berhasil diperbarui')
})