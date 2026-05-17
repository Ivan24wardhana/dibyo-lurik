// =====================================================
// FilterDropdownPanel.jsx
// Base component untuk filter dropdown floating panel.
//
// FIX: click-outside sekarang pakai containerRef (wraps tombol + panel)
// sehingga tidak ada race condition saat klik tombol kedua kali.
//
// Cara pakai BENAR (harus dalam container relative dengan ref):
//
//   const containerRef = useRef(null)
//
//   <div className="relative" ref={containerRef}>
//     <button onClick={() => setOpen(!open)}>Filter</button>
//     <FilterDropdownPanel
//       open={open}
//       onClose={() => setOpen(false)}
//       onApply={handleApply}
//       containerRef={containerRef}   ← WAJIB untuk fix race condition
//     >
//       <FilterSection title="Kategori">...</FilterSection>
//     </FilterDropdownPanel>
//   </div>
// =====================================================

import { useEffect, useRef } from 'react'

export default function FilterDropdownPanel({
  open,
  onClose,
  onApply,
  children,
  containerRef,  // ← ref ke container yang wraps tombol + panel
}) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const handleMouseDown = (e) => {
      // Exclude container (tombol trigger + panel) dari click-outside
      const excludeRef = containerRef?.current || panelRef.current
      if (excludeRef && !excludeRef.contains(e.target)) {
        onClose?.()
      }
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.()
    }

    // Delay agar klik yang buka panel tidak langsung trigger close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown)
      document.addEventListener('keydown', handleEsc)
    }, 50)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open, onClose, containerRef])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className="
        absolute right-0 top-full mt-2 z-[200]
        bg-white rounded-[16px]
        shadow-[0px_4px_16px_0px_rgba(0,0,0,0.25)]
        min-w-[300px] w-[380px]
      "
    >
      {/* Header */}
      <div className="px-5 py-3">
        <p className="text-[#a47352] text-lg font-semibold">Pilih Filter</p>
      </div>

      {/* Separator */}
      <div className="h-px bg-[#a47352]/20" />

      {/* Content */}
      <div className="px-5 py-4 space-y-4">
        {children}
      </div>

      {/* Separator */}
      <div className="h-px bg-[#a47352]/20" />

      {/* Footer: Terapkan */}
      <div className="px-5 py-3 flex justify-end">
        <button
          type="button"
          onClick={() => {
            onApply?.()
            onClose?.()
          }}
          className="
            bg-[#a47352] hover:bg-[#8d6044]
            text-white text-sm font-medium
            rounded-[10px] px-6 py-2.5
            active:scale-[0.97]
            transition-all duration-150
          "
        >
          Terapkan
        </button>
      </div>
    </div>
  )
}

// =====================================================
// FilterSection - section dengan title
// =====================================================
export function FilterSection({ title, children }) {
  return (
    <div>
      <p className="text-[#a47352] text-sm font-medium mb-2">{title}</p>
      {children}
    </div>
  )
}

// =====================================================
// FilterChips - grid 2 kolom chip toggle
// =====================================================
export function FilterChips({ options = [], value, onChange }) {
  const isSelected = (optVal) => String(value) === String(optVal)

  const handleClick = (optVal) => {
    const strVal = String(optVal)
    // Toggle: klik chip yang aktif = unselect (kembali ke '')
    onChange(value === strVal ? '' : strVal)
  }

  if (options.length === 0) {
    return (
      <p className="text-[#a47352]/40 text-xs italic">Belum ada data</p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const selected = isSelected(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleClick(opt.value)}
            className={`
              h-11 rounded-[8px] text-sm font-medium px-3
              transition-all duration-150 ease-out active:scale-[0.97]
              ${selected
                ? 'bg-[#a47352] text-white'
                : 'bg-[rgba(227,194,172,0.35)] text-[#a47352] hover:bg-[rgba(227,194,172,0.5)]'
              }
            `}
          >
            <span className="truncate block">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}