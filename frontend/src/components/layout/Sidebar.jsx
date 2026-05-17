// =====================================================
// Sidebar.jsx
// Sidebar navigation dengan toggle hide/show di SEMUA breakpoint.
//
// Cara close sidebar:
//   1. Klik X close button di header sidebar
//   2. Klik backdrop (mobile only)
//   3. Klik hamburger di Header (outer)
//   4. Press ESC key (keyboard shortcut, mobile only)
//   5. Klik menu item (auto-close di mobile)
// =====================================================

import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Layers,
  FileBarChart,
  UserCircle,
  ShoppingBag,
  ShoppingCart,
  ShoppingBasket,
  History,
  Database,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { MENU_CONFIG, ROLE_LABELS } from '../../lib/constants'

// Brand color - hardcode supaya tidak depend on COLORS export
const BRAND_PRIMARY = '#a47352'

const ICON_MAP = {
  LayoutDashboard,
  Package,
  Layers,
  FileBarChart,
  UserCircle,
  ShoppingBag,
  ShoppingCart,
  ShoppingBasket,
  History,
  Database,
}

export default function Sidebar({ isOpen = true, onClose }) {
  const profile = useAuthStore((state) => state.profile)
  const logout = useAuthStore((state) => state.logout)
  const location = useLocation()
  const navigate = useNavigate()

  const [expandedMenus, setExpandedMenus] = useState({})

  // Auto-expand submenu yang berisi current path
  useEffect(() => {
    if (!profile?.role) return
    const menuItems = MENU_CONFIG[profile.role] || []
    const newExpanded = {}

    menuItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) =>
          location.pathname.startsWith(child.path)
        )
        if (hasActiveChild) newExpanded[item.label] = true
      }
    })
    setExpandedMenus(newExpanded)
  }, [location.pathname, profile?.role])

  // ESC key listener (mobile only)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && typeof window !== 'undefined' && window.innerWidth < 1024) {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!profile?.role) return null

  const menuItems = MENU_CONFIG[profile.role] || []

  const toggleSubmenu = (label) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose?.()
    }
  }

  // Helper untuk render label role - safe kalau ROLE_LABELS undefined
  const roleLabel = (role) => {
    if (ROLE_LABELS && ROLE_LABELS[role]) return ROLE_LABELS[role]
    // Fallback mapping kalau ROLE_LABELS belum di-export
    const fallback = {
      owner: 'Owner',
      kepala_produksi: 'Kepala Produksi',
      customer_service: 'Customer Service',
    }
    return fallback[role] || role
  }

  return (
    <>
      {/* Backdrop - hanya di mobile */}
      <div
        className={`
          fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden
          transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Sidebar container */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-[280px] z-50
          flex flex-col
          shadow-xl
          transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ backgroundColor: BRAND_PRIMARY }}
      >
        {/* Header / Logo + Close Button */}
        <div className="px-6 py-6 border-b border-white/10 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-xl font-bold tracking-wide truncate">
              Dibyo Lurik
            </h1>
            <p className="text-white/70 text-xs mt-0.5 truncate">
              Sistem Manajemen Toko
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex-shrink-0 p-1.5 rounded-lg -mr-1 -mt-1
              text-white/70 hover:text-white
              hover:bg-white/10
              active:scale-90
              transition-all duration-150 ease-out
            "
            aria-label="Tutup sidebar"
            title="Tutup sidebar (ESC)"
          >
            <X className="w-5 h-5" strokeWidth={2.2} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard

            if (item.children) {
              const isExpanded = expandedMenus[item.label]
              const hasActiveChild = item.children.some((child) =>
                location.pathname.startsWith(child.path)
              )

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleSubmenu(item.label)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                      text-left text-white/90 hover:text-white
                      hover:bg-white/10
                      transition-colors duration-150 ease-out
                      ${hasActiveChild ? 'bg-white/15' : ''}
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.8} />
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <ChevronDown
                      className={`
                        w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                        ${isExpanded ? 'rotate-180' : 'rotate-0'}
                      `}
                    />
                  </button>

                  <div
                    className={`
                      overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                      ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <div className="pl-10 pr-2 py-1 space-y-0.5">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={handleNavClick}
                          className={({ isActive }) => `
                            block px-3 py-2 rounded-md text-sm
                            transition-colors duration-150 ease-out
                            ${
                              isActive
                                ? 'bg-white/25 text-white font-medium'
                                : 'text-white/75 hover:text-white hover:bg-white/10'
                            }
                          `}
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-colors duration-150 ease-out
                  ${
                    isActive
                      ? 'bg-white/25 text-white font-medium'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.8} />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer: User info + Logout */}
        <div className="border-t border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {profile.nama?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {profile.nama}
              </p>
              <p className="text-white/60 text-xs truncate">
                {roleLabel(profile.role)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full flex items-center gap-2 px-3 py-2 rounded-lg
              text-white/80 hover:text-white hover:bg-white/10
              transition-colors duration-150 text-sm
            "
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  )
}

// =====================================================
// SidebarToggle - hamburger button untuk Header outer
// =====================================================
export function SidebarToggle({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        p-2 rounded-lg
        text-[#a47352] hover:bg-[#a47352]/10
        active:scale-95
        transition-all duration-150 ease-out
        ${className}
      `}
      aria-label="Buka sidebar"
      title="Buka/tutup sidebar"
    >
      <Menu className="w-6 h-6" />
    </button>
  )
}