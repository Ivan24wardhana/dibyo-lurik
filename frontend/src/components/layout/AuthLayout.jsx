import { Outlet, Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

/**
 * AuthLayout
 * Wrapper untuk halaman Login, Register, LupaPassword.
 * - Gradient warm background dengan blur decorations
 * - Redirect ke /dashboard jika sudah login
 * - Tidak membatasi max-width (biar tiap page bebas set sendiri)
 *
 * Login & LupaPassword: max-w-md (narrow)
 * Register: max-w-5xl (split layout, wider)
 */
export default function AuthLayout() {
  const profile = useAuthStore((s) => s.profile)
  const loading = useAuthStore((s) => s.loading)

  if (!loading && profile) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-100/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full relative z-10 flex justify-center">
        <Outlet />
      </div>
    </div>
  )
}
