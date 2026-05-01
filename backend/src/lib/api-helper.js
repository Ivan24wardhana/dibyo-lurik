// =====================================================
// api-helper.js
// Combo helper yang bungkus pattern auth+role+error-handling
// jadi 1 baris di endpoint.
//
// Ini opsional — kamu bisa pakai helper individual (auth-helper,
// role-helper, response-helper) langsung. Tapi pakai withAuth/withAuthAndRole
// bikin kode endpoint jauh lebih ringkas.
//
// PERBANDINGAN:
//
// TANPA wrapper (verbose, 15+ baris boilerplate per endpoint):
//   export async function GET(request) {
//     try {
//       const auth = await getUserFromRequest(request)
//       if (!auth.success) return unauthorizedResponse(auth.error)
//       const guard = requireRole(auth.profile, OWNER_ONLY)
//       if (guard) return guard
//
//       const data = await fetchSomething()
//       return successResponse(data)
//     } catch (err) {
//       return serverErrorResponse(err)
//     }
//   }
//
// PAKAI wrapper (1-2 baris per endpoint):
//   export const GET = withAuthAndRole(OWNER_ONLY, async ({ profile }) => {
//     const data = await fetchSomething()
//     return successResponse(data)
//   })
// =====================================================

import { getUserFromRequest } from './auth-helper'
import { requireRole } from './role-helper'
import {
  unauthorizedResponse,
  serverErrorResponse,
} from './response-helper'

/**
 * Wrap handler dengan validasi auth (login required).
 *
 * Handler akan dipanggil dengan parameter:
 *   { request, user, profile }
 *
 * @param {Function} handler - async function ({ request, user, profile }) => Response
 * @returns {Function} Next.js route handler (async (request) => Response)
 *
 * Contoh:
 *   export const GET = withAuth(async ({ profile }) => {
 *     return successResponse({ greeting: `Halo ${profile.nama}` })
 *   })
 */
export function withAuth(handler) {
  return async (request, context) => {
    try {
      // Validasi auth
      const auth = await getUserFromRequest(request)
      if (!auth.success) {
        return unauthorizedResponse(auth.error)
      }

      // Panggil handler dengan context yang sudah include user+profile
      return await handler({
        request,
        user: auth.user,
        profile: auth.profile,
        // params dari Next.js dynamic route (mis. [id])
        params: context?.params,
      })
    } catch (err) {
      return serverErrorResponse(err)
    }
  }
}

/**
 * Wrap handler dengan validasi auth + role check.
 *
 * @param {string[]} allowedRoles - Array role yang diizinkan
 * @param {Function} handler - async function ({ request, user, profile, params }) => Response
 * @returns {Function} Next.js route handler
 *
 * Contoh:
 *   import { OWNER_ONLY } from '@/lib/role-helper'
 *
 *   export const DELETE = withAuthAndRole(OWNER_ONLY, async ({ profile, params }) => {
 *     await deleteSomething(params.id)
 *     return successResponse(null, 'Berhasil dihapus')
 *   })
 */
export function withAuthAndRole(allowedRoles, handler) {
  return async (request, context) => {
    try {
      // Validasi auth
      const auth = await getUserFromRequest(request)
      if (!auth.success) {
        return unauthorizedResponse(auth.error)
      }

      // Validasi role
      const guard = requireRole(auth.profile, allowedRoles)
      if (guard) return guard

      // Panggil handler
      return await handler({
        request,
        user: auth.user,
        profile: auth.profile,
        params: context?.params,
      })
    } catch (err) {
      return serverErrorResponse(err)
    }
  }
}