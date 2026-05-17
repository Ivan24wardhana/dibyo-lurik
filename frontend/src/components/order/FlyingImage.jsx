// =====================================================
// FlyingImage.jsx — BOUNCE & DROP STYLE
//
// Animasi gambar produk terbang ke cart icon dengan efek
// physics-based bounce. Fase:
//
//   1. RISE (0-45%) — melompat naik tinggi overshoot cart icon
//      scale 1.0 → 1.15 + rotate wobble -12°
//   2. HANG (45-55%) — illusion of weightlessness di puncak
//   3. DROP (55-100%) — jatuh berat ke cart icon (gravity)
//      scale 1.15 → 0.3 + rotate balik ke 0°
//
// Saat sampai cart icon: bounce + shake + glow ring effect.
// Total duration: 800ms.
// =====================================================

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function FlyingImage() {
  const [flights, setFlights] = useState([])
  const idCounter = useRef(0)

  useEffect(() => {
    const handler = (e) => {
      const { imageUrl, sourceEl, onComplete } = e.detail || {}

      if (!sourceEl) return

      const sourceRect = sourceEl.getBoundingClientRect()
      const cartIcon = document.getElementById('header-cart-icon')
      if (!cartIcon) {
        onComplete?.()
        return
      }

      const cartRect = cartIcon.getBoundingClientRect()

      const id = ++idCounter.current

      // Peak position - overshoot 80px di atas cart icon
      // pakai X cart icon (bukan midpoint) supaya jatuh persis ke cart
      const peakX = cartRect.left + cartRect.width / 2 - 30
      const peakY = cartRect.top - 80

      const flight = {
        id,
        imageUrl: imageUrl || null,
        startX: sourceRect.left + sourceRect.width / 2 - 30,
        startY: sourceRect.top + sourceRect.height / 2 - 30,
        peakX,
        peakY,
        endX: cartRect.left + cartRect.width / 2 - 30,
        endY: cartRect.top + cartRect.height / 2 - 30,
        onComplete,
      }

      setFlights((prev) => [...prev, flight])

      setTimeout(() => {
        setFlights((prev) => prev.filter((f) => f.id !== id))
        cartIcon.classList.add('cart-bounce-drop')
        setTimeout(() => cartIcon.classList.remove('cart-bounce-drop'), 500)
        onComplete?.()
      }, 800)
    }

    window.addEventListener('flying-to-cart', handler)
    return () => window.removeEventListener('flying-to-cart', handler)
  }, [])

  if (typeof window === 'undefined') return null

  return createPortal(
    <>
      {/* Global keyframes untuk cart icon bounce + shake + glow saat barang sampai */}
      <style>{`
        @keyframes cart-bounce-drop-anim {
          0%   { transform: scale(1) rotate(0deg); }
          15%  { transform: scale(1.35) rotate(-8deg); }
          30%  { transform: scale(0.9) rotate(6deg); }
          45%  { transform: scale(1.15) rotate(-4deg); }
          60%  { transform: scale(0.95) rotate(2deg); }
          80%  { transform: scale(1.05) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes cart-glow-ring {
          0%   { box-shadow: 0 0 0 0 rgba(76, 208, 177, 0.7); }
          100% { box-shadow: 0 0 0 24px rgba(76, 208, 177, 0); }
        }
        .cart-bounce-drop {
          animation:
            cart-bounce-drop-anim 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
            cart-glow-ring 0.6s ease-out;
          border-radius: 50%;
        }
      `}</style>

      {flights.map((f) => (
        <div
          key={f.id}
          className="fixed top-0 left-0 z-[10000] pointer-events-none"
          style={{
            animation: `fly-bounce-${f.id} 0.8s forwards`,
          }}
        >
          <style>{`
            @keyframes fly-bounce-${f.id} {
              /* === FASE 1: RISE (0-45%) — melompat naik tinggi === */
              0% {
                transform:
                  translate(${f.startX}px, ${f.startY}px)
                  scale(1)
                  rotate(0deg);
                opacity: 1;
              }
              30% {
                transform:
                  translate(${(f.startX + f.peakX) / 2}px, ${f.peakY + 30}px)
                  scale(1.1)
                  rotate(-12deg);
                opacity: 1;
              }
              45% {
                transform:
                  translate(${f.peakX}px, ${f.peakY}px)
                  scale(1.15)
                  rotate(-10deg);
                opacity: 1;
              }

              /* === FASE 2: HANG (45-55%) — weightlessness === */
              55% {
                transform:
                  translate(${f.peakX + 5}px, ${f.peakY - 5}px)
                  scale(1.12)
                  rotate(-5deg);
                opacity: 0.95;
              }

              /* === FASE 3: DROP (55-100%) — jatuh berat ke cart === */
              75% {
                transform:
                  translate(${(f.peakX + f.endX) / 2 + 5}px, ${(f.peakY + f.endY) / 2}px)
                  scale(0.8)
                  rotate(8deg);
                opacity: 0.85;
              }
              100% {
                transform:
                  translate(${f.endX}px, ${f.endY}px)
                  scale(0.3)
                  rotate(0deg);
                opacity: 0.4;
              }
            }
          `}</style>

          <div
            className="
              w-[60px] h-[60px] rounded-2xl overflow-hidden
              bg-gradient-to-br from-[#e3c2ac] to-[#a47352]
              shadow-[0_8px_20px_rgba(164,115,82,0.5)]
              border-2 border-white
            "
          >
            {f.imageUrl ? (
              <img src={f.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-2xl">
                📦
              </div>
            )}
          </div>
        </div>
      ))}
    </>,
    document.body
  )
}

// =====================================================
// Helper function - dipanggil dari komponen lain
// =====================================================
export function triggerFlyingToCart(imageUrl, sourceEl, onComplete) {
  window.dispatchEvent(
    new CustomEvent('flying-to-cart', {
      detail: { imageUrl, sourceEl, onComplete },
    })
  )
}