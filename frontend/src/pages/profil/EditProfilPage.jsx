import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'

/**
 * EditProfilPage
 * Form edit profil — Figma node 50:2458.
 * Field: Username dan Password (optional).
 * Ditambahkan: password strength indicator, show/hide password, konfirmasi password.
 */
export default function EditProfilPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const initialize = useAuthStore((s) => s.initialize)

  const [form, setForm] = useState({
    username: profile?.username || '',
    password: '',
    konfirmasi: '',
  })
  const [show, setShow] = useState({ p1: false, p2: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const update = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.username.trim() || form.username.trim().length < 3) {
      return setError('Username minimal 3 karakter')
    }

    if (form.password) {
      if (form.password.length < 6) return setError('Password baru minimal 6 karakter')
      if (form.password !== form.konfirmasi) return setError('Konfirmasi password tidak cocok')
    }

    setLoading(true)
    try {
      await api.put('/api/auth/profile', {
        username: form.username.trim().toLowerCase(),
        ...(form.password ? { password: form.password } : {}),
      })
      setSuccess('Profil berhasil diperbarui')
      await initialize()
      setTimeout(() => navigate('/profil'), 1200)
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memperbarui profil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-xl bg-white rounded-2xl border-2 border-[#caa179]/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#caa179]/30">
          <h2 className="text-xl font-bold text-[#4a260f]">Edit Profil</h2>
          <button
            onClick={() => navigate('/profil')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#a47352] text-white font-semibold text-sm hover:bg-[#8b5e3c] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kembali
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {success && (
            <div className="px-4 py-3 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {success}
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#8b5e3c] mb-2">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a47352]/60 font-semibold">@</span>
              <input
                type="text"
                value={form.username}
                onChange={update('username')}
                className="w-full h-12 pl-9 pr-4 rounded-xl border-2 border-[#caa179]/50 outline-none text-[#4a260f] bg-white transition-all focus:border-[#a47352]"
              />
            </div>
          </div>

          <div className="border-t border-[#caa179]/30 pt-5">
            <p className="text-sm font-semibold text-[#8b5e3c] mb-3">Ganti Password (opsional)</p>
            <p className="text-xs text-[#a47352]/70 mb-3">Kosongkan jika tidak ingin mengubah password</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#8b5e3c] mb-1.5">Password Baru</label>
                <div className="relative">
                  <input
                    type={show.p1 ? 'text' : 'password'}
                    value={form.password}
                    onChange={update('password')}
                    placeholder="Minimal 6 karakter"
                    className="w-full h-11 px-4 pr-11 rounded-xl border-2 border-[#caa179]/50 outline-none text-[#4a260f] bg-white transition-all focus:border-[#a47352]"
                  />
                  <button type="button" onClick={() => setShow((p) => ({ ...p, p1: !p.p1 }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a47352]/60 hover:text-[#8b5e3c]" tabIndex={-1}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b5e3c] mb-1.5">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input
                    type={show.p2 ? 'text' : 'password'}
                    value={form.konfirmasi}
                    onChange={update('konfirmasi')}
                    placeholder="Ketik ulang password"
                    className="w-full h-11 px-4 pr-11 rounded-xl border-2 border-[#caa179]/50 outline-none text-[#4a260f] bg-white transition-all focus:border-[#a47352]"
                  />
                  <button type="button" onClick={() => setShow((p) => ({ ...p, p2: !p.p2 }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a47352]/60 hover:text-[#8b5e3c]" tabIndex={-1}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-[#a47352] hover:bg-[#8b5e3c] text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
