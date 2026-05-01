import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../lib/api'

/**
 * LupaPasswordPage
 * Flow:
 * 1. User pilih role (owner / kepala produksi / CS)
 * 2. Email auto-muncul (readonly) berdasarkan role
 * 3. Form username & password baru jadi aktif (sebelumnya disabled)
 * 4. User isi minimal salah satu, submit -> update database
 *
 * Tombol submit DISABLED sampai minimal 1 field (username/password) diisi.
 */

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'kepala_produksi', label: 'Kepala Produksi' },
  { value: 'customer_service', label: 'Customer Service' },
]

export default function LupaPasswordPage() {
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  // Auto-fetch email setiap role berubah
  useEffect(() => {
    if (!role) {
      setEmail('')
      return
    }

    const fetchEmail = async () => {
      setEmailLoading(true)
      setError('')
      try {
        const res = await api.get(`/api/auth/forgot-password?role=${role}`)
        setEmail(res.data.data.email)
      } catch (err) {
        setError(err.response?.data?.error || 'Gagal mengambil email')
        setEmail('')
      } finally {
        setEmailLoading(false)
      }
    }
    fetchEmail()
  }, [role])

  // Reset form saat role berubah
  useEffect(() => {
    setNewUsername('')
    setNewPassword('')
    setError('')
  }, [role])

  const formEnabled = role && email && !emailLoading
  const hasUsername = newUsername.trim().length > 0
  const hasPassword = newPassword.length > 0
  const canSubmit = formEnabled && (hasUsername || hasPassword) && !submitting

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return

    if (hasPassword && newPassword.length < 6) {
      return setError('Password minimal 6 karakter')
    }
    if (hasUsername && newUsername.trim().length < 3) {
      return setError('Username minimal 3 karakter')
    }

    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/auth/forgot-password', {
        role,
        newUsername: hasUsername ? newUsername.trim() : undefined,
        newPassword: hasPassword ? newPassword : undefined,
      })

      const updated = []
      if (hasUsername) updated.push('username')
      if (hasPassword) updated.push('password')
      const msg = `${updated.join(' & ')} berhasil diperbarui. Silakan login.`

      navigate('/login', { state: { message: msg.charAt(0).toUpperCase() + msg.slice(1) } })
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memperbarui akun')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div
        className="rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(145deg, #b8835e 0%, #a47352 40%, #8b5e3c 100%)' }}
      >
        <div className="flex flex-col items-center pt-10 pb-5">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 ring-4 ring-white/30">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-white">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-wide text-white">Lupa Password</h1>
          <p className="text-xs mt-1 text-white/70 text-center px-6">
            Pilih role kamu, lalu ubah username atau password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-red-500/20 text-red-100 backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* ROLE */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-white/90">
              Role <span className="text-white/60">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white outline-none transition-all duration-200 focus:border-white/60 focus:bg-white/15 cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '18px',
                paddingRight: '3rem',
              }}
            >
              <option value="" className="text-gray-700">-- Pilih role --</option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-gray-700">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* EMAIL (auto-muncul) */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-white/90">Email Terdaftar</label>
            <div className="relative">
              <input
                type="text"
                value={emailLoading ? 'Memuat...' : email}
                readOnly
                placeholder="Pilih role dulu"
                className="w-full h-12 px-4 pr-11 rounded-xl border-2 border-white/30 bg-white/5 text-white/80 placeholder-white/30 outline-none cursor-not-allowed"
              />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="m3 7 9 6 9-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-xs text-white/60 font-medium">Ubah salah satu atau keduanya</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* USERNAME BARU */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-white/90">
              Username Baru <span className="text-white/50 text-xs">(opsional)</span>
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              disabled={!formEnabled}
              placeholder={formEnabled ? 'Kosongkan jika tidak ingin diubah' : 'Pilih role dulu'}
              className="w-full h-12 px-4 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/40 outline-none transition-all duration-200 focus:border-white/60 focus:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* PASSWORD BARU */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-white/90">
              Password Baru <span className="text-white/50 text-xs">(opsional)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={!formEnabled}
                placeholder={formEnabled ? 'Min. 6 karakter' : 'Pilih role dulu'}
                className="w-full h-12 px-4 pr-12 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/40 outline-none transition-all duration-200 focus:border-white/60 focus:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={!formEnabled}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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

          {/* SUBMIT BUTTON - disabled sampai minimal 1 field diisi */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-12 rounded-xl font-semibold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:shadow-lg enabled:active:scale-[0.98] bg-white text-[#8b5e3c]"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Menyimpan...
              </span>
            ) : (
              'Simpan Perubahan'
            )}
          </button>

          <p className="text-center text-sm mt-6 text-white/70">
            Ingat password kamu?{' '}
            <Link to="/login" className="font-semibold underline underline-offset-2 text-[#4a260f] hover:text-white transition-colors">
              Masuk Sekarang
            </Link>
          </p>
        </form>
      </div>

      <p className="text-center text-xs mt-6 text-[#a47352]">
        &copy; 2026 Dibyo Lurik. All rights reserved.
      </p>
    </div>
  )
}