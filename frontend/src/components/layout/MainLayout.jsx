// =====================================================
// MainLayout.jsx
// Layout utama dengan sidebar collapsable.
//
// Behavior:
//   - State sidebarOpen di-persist ke localStorage
//   - Default: desktop (≥1024px) terbuka, mobile tertutup
//   - Klik hamburger di Header → toggle
//   - Sidebar slide in/out smooth 450ms iOS easing
//   - Main content margin auto-adjust:
//       sidebar open  → ml-[280px]
//       sidebar close → ml-0 (full width)
//     Transition margin sync sama timing sidebar
// =====================================================

import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const STORAGE_KEY = 'dibyo:sidebarOpen'

/**
 * Tentukan initial state sidebar:
 *   1. Cek localStorage dulu (preference user yang persisted)
 *   2. Kalau belum ada, default berdasarkan layar:
 *      - Desktop (≥1024px) → terbuka
 *      - Mobile             → tertutup
 */
function getInitialSidebarState() {
  if (typeof window === 'undefined') return true // SSR safe

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      return saved === 'true'
    }
  } catch (e) {
    // localStorage might be disabled
  }

  return window.innerWidth >= 1024
}

export default function MainLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(getInitialSidebarState)

  // Persist state ke localStorage setiap kali berubah
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(sidebarOpen))
    } catch (e) {
      // localStorage might be disabled
    }
  }, [sidebarOpen])

  // Auto-close sidebar saat ganti halaman di MOBILE
  // (UX: setelah pilih menu, sidebar nutup biar lihat content)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - fixed position, controlled by isOpen */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main content area - margin menyesuaikan state sidebar */}
      <div
        className={`
          flex flex-col min-h-screen
          transition-[margin] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]
          ${sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-0'}
        `}
      >
        {/* Header sticky di top - tombol hamburger toggle sidebar */}
        <Header onMenuClick={toggleSidebar} />

        {/* Page content - fade-in saat ganti page */}
        <main
          key={location.pathname}
          className="flex-1 p-4 lg:p-8 animate-fade-in"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}