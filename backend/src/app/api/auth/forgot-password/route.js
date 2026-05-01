import { successResponse, errorResponse } from '@/lib/helpers'
import supabaseAdmin from '@/lib/supabase-admin'

/**
 * GET /api/auth/forgot-password?role=owner
 * Return email yang ter-associate dengan role tersebut.
 *
 * Dipakai frontend untuk auto-fill email setelah user pilih role.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    if (!role) {
      return errorResponse('Parameter role wajib diisi', 400)
    }

    const validRoles = ['owner', 'kepala_produksi', 'customer_service']
    if (!validRoles.includes(role)) {
      return errorResponse('Role tidak valid', 400)
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('email, role, username')
      .eq('role', role)
      .single()

    if (error || !profile) {
      return errorResponse('Akun untuk role ini tidak ditemukan', 404)
    }

    return successResponse({
      email: profile.email,
      role: profile.role,
      username: profile.username,
    })
  } catch (error) {
    return errorResponse(error.message, 500)
  }
}

/**
 * POST /api/auth/forgot-password
 * Body: { role, newUsername?, newPassword? }
 *
 * Update username dan/atau password untuk akun dengan role tertentu.
 * Minimal salah satu (newUsername atau newPassword) WAJIB diisi.
 *
 * Operasi:
 * - Update username -> tabel profiles
 * - Update password -> auth.users via supabaseAdmin.auth.admin.updateUserById
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { role, newUsername, newPassword } = body

    if (!role) {
      return errorResponse('Role wajib diisi', 400)
    }

    const validRoles = ['owner', 'kepala_produksi', 'customer_service']
    if (!validRoles.includes(role)) {
      return errorResponse('Role tidak valid', 400)
    }

    // Minimal salah satu harus diisi
    const hasUsername = newUsername && newUsername.trim().length > 0
    const hasPassword = newPassword && newPassword.length > 0
    if (!hasUsername && !hasPassword) {
      return errorResponse('Minimal isi username atau password baru', 400)
    }

    // Validasi password jika diisi
    if (hasPassword && newPassword.length < 6) {
      return errorResponse('Password minimal 6 karakter', 400)
    }

    // Validasi username jika diisi
    if (hasUsername && newUsername.trim().length < 3) {
      return errorResponse('Username minimal 3 karakter', 400)
    }

    // Cari profile by role untuk dapat user ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, email, role')
      .eq('role', role)
      .single()

    if (profileError || !profile) {
      return errorResponse('Akun untuk role ini tidak ditemukan', 404)
    }

    // Update username (kalau diisi)
    if (hasUsername) {
      const trimmedUsername = newUsername.trim()

      // Cek apakah username baru sudah dipakai user lain
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', trimmedUsername)
        .neq('id', profile.id)
        .maybeSingle()

      if (existing) {
        return errorResponse('Username sudah dipakai akun lain', 409)
      }

      const { error: updateUsernameError } = await supabaseAdmin
        .from('profiles')
        .update({ username: trimmedUsername, updated_at: new Date().toISOString() })
        .eq('id', profile.id)

      if (updateUsernameError) {
        return errorResponse('Gagal update username: ' + updateUsernameError.message, 500)
      }
    }

    // Update password (kalau diisi)
    if (hasPassword) {
      const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.id,
        { password: newPassword }
      )

      if (updatePasswordError) {
        return errorResponse('Gagal update password: ' + updatePasswordError.message, 500)
      }
    }

    return successResponse({
      message: 'Akun berhasil diperbarui',
      updated: {
        username: hasUsername,
        password: hasPassword,
      },
    })
  } catch (error) {
    return errorResponse(error.message, 500)
  }
}