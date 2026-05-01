import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import useAuthStore from '../../store/authStore'
import { SIDEBAR_ICONS } from '../../lib/constants'

/**
 * Header
 * Match Figma design: title halaman di kiri dengan underline coklat tipis,
 * tombol Logout coklat di kanan atas.
 *
 * Title dinamis berdasarkan URL:
 * - /dashboard → "Dashboard"
 * - /produk → "Produk"
 * - /rekap/70 → "Rekap Stok Gulungan Lebar 70 cm"
 * - dst
 *
 * Logout menampilkan modal konfirmasi dulu (bukan langsung logout)
 * untuk menghindari accidental click.
 */
const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/produk': 'Produk',
  '/rekap/70': 'Rekap Stok Gulungan Lebar 70 cm',
  '/rekap/110': 'Rekap Stok Gulungan Lebar 110 cm',
  '/laporan/order': 'Laporan Order',
  '/laporan/po-reguler': 'Laporan Pre-Order Reguler',
  '/laporan/po-custom': 'Laporan Pre-Order Custom',
  '/profil': 'Profil',
  '/profil/edit': 'Edit Profil',
}

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dibyo Lurik'

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setLoggingOut(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-[#8b5e3c]">{pageTitle}</h1>
          <div className="h-0.5 w-16 bg-[#a47352] rounded-full mt-1" />
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-95"
          style={{ backgroundColor: '#a47352' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#8b5e3c')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#a47352')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d={SIDEBAR_ICONS.logout}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          Logout
        </button>
      </header>

      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !loggingOut && setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto mb-4 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#a47352]">
                <path
                  d={SIDEBAR_ICONS.logout}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-center text-gray-900 mb-1">Logout dari sistem?</h3>
            <p className="text-sm text-center text-gray-500 mb-6">
              Kamu akan keluar dari sesi ini dan perlu login ulang untuk mengakses kembali.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loggingOut}
                className="flex-1 h-11 rounded-xl font-semibold text-sm transition-colors hover:bg-gray-100 bg-gray-50 text-gray-700 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 h-11 rounded-xl font-semibold text-sm transition-all hover:shadow-md active:scale-95 text-white disabled:opacity-60"
                style={{ backgroundColor: '#a47352' }}
              >
                {loggingOut ? 'Keluar...' : 'Ya, Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
