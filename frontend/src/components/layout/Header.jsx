// =====================================================
// Header.jsx
// Header sticky di top.
//
// Update: tambah cart icon dengan badge count untuk CS.
// Klik cart icon → navigate ke /keranjang.
//
// Props:
//   - onMenuClick: fn - dipanggil saat tombol hamburger diklik
// =====================================================

import { useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'
import { MENU_CONFIG } from '../../lib/constants'
import { SidebarToggle } from './Sidebar'

/**
 * Cari label menu yang cocok dengan pathname saat ini.
 */
function getPageTitle(pathname, role) {
  if (!role) return 'Dibyo Lurik'

  const menuItems = MENU_CONFIG[role] || []

  for (const item of menuItems) {
    if (item.children) {
      for (const child of item.children) {
        if (pathname.startsWith(child.path)) {
          return child.label
        }
      }
    }
    if (item.path && pathname.startsWith(item.path)) {
      return item.label
    }
  }

  const segment = pathname.split('/')[1]
  if (segment) {
    return segment
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ')
  }

  return 'Dashboard'
}

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const profile = useAuthStore((state) => state.profile)
  const isCS = profile?.role === 'customer_service'

  // Hitung cart badge — total gulungan dari semua cart items
  const totalGulungan = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.gulungan_selections.length, 0)
  )

  const pageTitle = getPageTitle(location.pathname, profile?.role)

  return (
    <header
      className="
        sticky top-0 z-30
        bg-white border-b border-gray-200
        h-[72px] flex items-center
        px-4 lg:px-8
        shadow-sm
      "
    >
      {/* Hamburger toggle */}
      <SidebarToggle onClick={onMenuClick} className="mr-3" />

      {/* Page title */}
      <h1 className="text-[#a47352] text-2xl lg:text-[28px] font-medium tracking-wide flex-1">
        {pageTitle}
      </h1>

      {/* Cart icon - hanya untuk CS */}
      {isCS && (
        <button
          type="button"
          id="header-cart-icon"
          onClick={() => navigate('/keranjang')}
          className="
            relative p-2.5 rounded-lg
            text-[#a47352] hover:bg-[#a47352]/10
            active:scale-95
            transition-all duration-150 ease-out
          "
          aria-label="Keranjang"
          title="Lihat keranjang"
        >
          <ShoppingCart className="w-6 h-6" strokeWidth={2} />
          {totalGulungan > 0 && (
            <span
              className="
                absolute -top-1 -right-1
                bg-[#ff695e] text-white
                text-xs font-bold
                rounded-full min-w-[20px] h-[20px]
                flex items-center justify-center px-1
                animate-[pulse_2s_ease-in-out_infinite]
              "
            >
              {totalGulungan > 99 ? '99+' : totalGulungan}
            </span>
          )}
        </button>
      )}
    </header>
  )
}