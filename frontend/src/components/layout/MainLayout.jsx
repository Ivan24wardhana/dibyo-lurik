// =====================================================
// MainLayout.jsx
// "Bingkai" yang dipakai semua halaman setelah login:
//   ┌──────┬─────────────────────────────────┐
//   │      │   Header (judul halaman)        │
//   │ Side ├─────────────────────────────────┤
//   │ bar  │                                 │
//   │      │   Outlet (konten halaman)       │
//   │      │                                 │
//   └──────┴─────────────────────────────────┘
//
// `<Outlet />` adalah dari react-router-dom: tempat dimana
// halaman child (DashboardPage, ProdukPage, dll) di-render.
// =====================================================

import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import useAuthStore from '../../store/authStore'
import { MENU_CONFIG } from '../../lib/constants'

// Helper: cari label menu berdasarkan path saat ini
// (dipakai untuk show judul di header otomatis).
function findPageTitle(role, pathname) {
  if (!role) return ''
  const menus = MENU_CONFIG[role] || []
  const match = menus.find((m) => pathname.startsWith(m.path))
  return match?.label || 'Dashboard'
}

export default function MainLayout() {
  const profile = useAuthStore((s) => s.profile)
  const location = useLocation()
  const pageTitle = findPageTitle(profile?.role, location.pathname)

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />

      {/* Konten utama: dimulai setelah lebar sidebar (280px) */}
      <div className="ml-[280px] flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-[72px] flex items-center px-8">
          <h2 className="text-[28px] font-medium text-[#a47352] tracking-wide">
            {pageTitle}
          </h2>
        </header>

        {/* Konten halaman */}
        <main className="flex-1 p-8 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  )
}