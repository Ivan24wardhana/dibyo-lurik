// =====================================================
// Sidebar.jsx
// Sidebar kiri dengan:
// - Toggle hide/show (smooth slide)
// - Expandable submenu (untuk parent menu dengan children)
// - Role-based menu dari MENU_CONFIG
// - Active state highlight
// - Logout di bawah
//
// Animation:
// - Sidebar slide: translateX dengan iOS easing (450ms)
// - Submenu expand: max-height transition
// - Menu item hover: subtle background fade
// =====================================================

import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Layers,
  FileBarChart,
  UserCircle,
  ShoppingBag,
  ShoppingCart,
  ShoppingBasket,
  Sparkles,
  History,
  LogOut,
  ChevronDown,
  Database,
  Menu,
  X,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { MENU_CONFIG } from '../../lib/constants'

// -----------------------------------------------------
// Mapping nama icon (string) → component icon dari lucide-react.
// -----------------------------------------------------
const ICON_MAP = {
  LayoutDashboard,
  Package,
  Layers,
  FileBarChart,
  UserCircle,
  ShoppingBag,
  ShoppingCart,
  ShoppingBasket,
  Sparkles,
  History,
  Database,
}

/**
 * Props:
 * - isOpen: boolean - apakah sidebar sedang terbuka (mobile responsive)
 * - onClose: callback close sidebar (untuk mobile)
 */
export default function Sidebar({ isOpen = true, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const profile = useAuthStore((s) => s.profile)
  const logout = useAuthStore((s) => s.logout)

  // State untuk track submenu mana yang sedang expand
  // Format: { 'Pre-Order': true, 'Laporan': false }
  const [expandedMenus, setExpandedMenus] = useState({})

  // Auto-expand submenu yang berisi current path
  useEffect(() => {
    if (!profile?.role) return
    const menus = MENU_CONFIG[profile.role] || []
    const newExpanded = {}

    for (const item of menus) {
      if (item.children) {
        const hasActiveChild = item.children.some((child) =>
          location.pathname.startsWith(child.path)
        )
        if (hasActiveChild) newExpanded[item.label] = true
      }
    }

    setExpandedMenus((prev) => ({ ...prev, ...newExpanded }))
  }, [location.pathname, profile?.role])

  const menus = profile?.role ? MENU_CONFIG[profile.role] || [] : []

  const toggleSubmenu = (label) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile backdrop - hanya muncul saat sidebar open di mobile */}
      <div
        className={`
          fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden
          transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Sidebar - desktop fixed, mobile slide */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-[280px] bg-[#a47352] text-white
          flex flex-col z-40 no-select
          transition-transform duration-[450ms]
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Logo + Close button (mobile) */}
        <div className="flex items-center justify-between px-8 pt-10 pb-6">
          <h1 className="text-[28px] font-medium leading-tight tracking-wide">
            Dibyo Lurik
          </h1>
          {/* Close button - hanya muncul di mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-white/15 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Garis pemisah */}
        <div className="border-t border-white/20 mx-0" />

        {/* Menu (scrollable) */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {menus.map((item) => {
              const Icon = ICON_MAP[item.icon] || Package
              const hasChildren = item.children && item.children.length > 0
              const isExpanded = expandedMenus[item.label]

              // Cek apakah parent menu ini "active" (ada child yang match)
              const isParentActive =
                hasChildren &&
                item.children.some((c) =>
                  location.pathname.startsWith(c.path)
                )

              if (hasChildren) {
                return (
                  <li key={item.label}>
                    {/* Parent menu (clickable to expand) */}
                    <button
                      type="button"
                      onClick={() => toggleSubmenu(item.label)}
                      className={`
                        w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg
                        transition-all duration-200
                        ${isParentActive ? 'bg-white/15' : 'hover:bg-white/10'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="text-[15px] leading-tight">
                          {item.label}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        style={{
                          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </button>

                    {/* Submenu - expand/collapse with smooth height */}
                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        maxHeight: isExpanded ? `${item.children.length * 44}px` : '0',
                        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <ul className="pl-3 mt-1 space-y-0.5">
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              onClick={onClose}
                              className={({ isActive }) => `
                                flex items-center gap-3 pl-8 pr-4 py-2 rounded-lg
                                text-[14px] transition-all duration-200
                                ${
                                  isActive
                                    ? 'bg-white/25 font-medium'
                                    : 'hover:bg-white/10'
                                }
                              `}
                            >
                              <span className="w-1 h-1 rounded-full bg-white/60" />
                              {child.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                )
              }

              // Menu single (no children)
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-2.5 rounded-lg
                      transition-all duration-200
                      ${
                        isActive
                          ? 'bg-white/25 font-medium'
                          : 'hover:bg-white/10'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-[15px] leading-tight">
                      {item.label}
                    </span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-white/20 px-3 py-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/15 active:bg-white/25 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="text-[15px] font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

/**
 * Sidebar Toggle Button - dipakai di Header untuk mobile/responsive.
 * Export terpisah supaya bisa dipakai di MainLayout.
 */
export function SidebarToggle({ onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`
        lg:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200
        transition-colors duration-200
        ${className}
      `}
      aria-label="Toggle sidebar"
    >
      <Menu className="w-6 h-6 text-[#a47352]" />
    </button>
  )
}