import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

/**
 * LoginPage
 * Halaman login dengan desain Apple-soft:
 * - Card gradient coklat khas Dibyo Lurik
 * - Avatar bulat di atas
 * - Input transparan dengan border putih
 * - Show/hide password toggle
 * - Menampilkan success message dari halaman lain (via location.state)
 */
export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message)
      window.history.replaceState({}, document.title)
      setTimeout(() => setSuccess(''), 5000)
    }
  }, [location.state])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) return setError('Username wajib diisi')
    if (!password) return setError('Password wajib diisi')

    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Username atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {success && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {success}
        </div>
      )}

      <div
        className="rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(145deg, #b8835e 0%, #a47352 40%, #8b5e3c 100%)' }}
      >
        <div className="flex flex-col items-center pt-10 pb-6">
          <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 ring-4 ring-white/30">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="text-white">
              <circle cx="12" cy="8" r="4" fill="currentColor" />
              <path d="M5.338 18.32C5.994 15.528 8.776 13.5 12 13.5c3.224 0 6.006 2.028 6.662 4.82.132.56-.32 1.18-.898 1.18H6.236c-.578 0-1.03-.62-.898-1.18Z" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-wide text-white">Dibyo Lurik</h1>
          <p className="text-sm mt-1 text-white/70">Sistem Manajemen Internal</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-red-500/20 text-red-100 backdrop-blur-sm">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium mb-2 text-white/90">Username</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full h-12 px-4 pr-11 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/40 outline-none transition-all duration-200 focus:border-white/60 focus:bg-white/15"
                autoComplete="username"
                autoFocus
              />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M6 21v-1a6 6 0 0 1 12 0v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium mb-2 text-white/90">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full h-12 px-4 pr-12 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/40 outline-none transition-all duration-200 focus:border-white/60 focus:bg-white/15"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end mb-6">
            <Link to="/lupa-password" className="text-xs font-medium text-white/60 hover:text-white/90 transition-colors">
              Lupa Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-semibold text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98] bg-white text-[#8b5e3c]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memproses...
              </span>
            ) : (
              'Masuk Sekarang'
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-xs mt-6 text-[#a47352]">
        &copy; 2026 Dibyo Lurik. All rights reserved.
      </p>
    </div>
  )
}