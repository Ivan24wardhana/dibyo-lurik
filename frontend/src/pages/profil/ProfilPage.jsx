import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { ROLE_LABELS } from '../../lib/constants'

/**
 * ProfilPage
 * Halaman profil user — Figma node 50:2321.
 * Tampilan card besar dengan avatar, username, role, dan tombol Edit Profil.
 * Ditambahkan info tambahan (email internal, tanggal bergabung) untuk UX lebih informatif.
 */
export default function ProfilPage() {
  const profile = useAuthStore((s) => s.profile)
  const navigate = useNavigate()

  const roleLabel = ROLE_LABELS[profile?.role] || profile?.role || '—'
  const createdAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-xl bg-white rounded-3xl border-2 border-[#caa179]/50 shadow-sm overflow-hidden">
        <div className="relative h-32" style={{ background: 'linear-gradient(145deg, #b8835e 0%, #a47352 40%, #8b5e3c 100%)' }}>
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
            <div className="w-32 h-32 rounded-full bg-[#a47352] border-4 border-white shadow-lg flex items-center justify-center text-white">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.nama} className="w-full h-full rounded-full object-cover" />
              ) : (
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" fill="currentColor" />
                  <path d="M5.338 18.32C5.994 15.528 8.776 13.5 12 13.5c3.224 0 6.006 2.028 6.662 4.82.132.56-.32 1.18-.898 1.18H6.236c-.578 0-1.03-.62-.898-1.18Z" fill="currentColor" />
                </svg>
              )}
            </div>
          </div>
        </div>

        <div className="pt-20 pb-8 px-8 text-center">
          <h2 className="text-2xl font-bold text-[#4a260f] mb-1">{profile?.nama || 'User'}</h2>
          <p className="text-sm text-[#a47352] mb-1">@{profile?.username || '—'}</p>

          <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-[#8b5e3c] text-xs font-semibold border border-[#caa179]/30 mb-6">
            {roleLabel}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6 text-left">
            <div className="bg-amber-50/50 rounded-xl px-4 py-3 border border-[#caa179]/30">
              <p className="text-xs text-[#a47352] mb-1">Username</p>
              <p className="font-semibold text-sm text-[#4a260f] truncate">@{profile?.username || '—'}</p>
            </div>
            <div className="bg-amber-50/50 rounded-xl px-4 py-3 border border-[#caa179]/30">
              <p className="text-xs text-[#a47352] mb-1">Bergabung Sejak</p>
              <p className="font-semibold text-sm text-[#4a260f]">{createdAt}</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/profil/edit')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#a47352] hover:bg-[#8b5e3c] text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Edit Profil
          </button>
        </div>
      </div>
    </div>
  )
}
