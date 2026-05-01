// =====================================================
// animations.js
// Animation tokens & helpers - iOS/Apple-style smooth motions.
//
// Filosofi:
// - Easing pakai cubic-bezier yang dipakai Apple di iOS
// - Duration pendek (200-350ms) supaya terasa snappy tapi smooth
// - Spring effect untuk popup/modal (sedikit overshoot)
// - Subtle scale untuk hover (1.02) & active (0.98)
//
// Cara pakai:
//   import { TRANSITIONS, EASE } from '@/lib/animations'
//
//   <div style={{ transition: TRANSITIONS.smooth }}>
//   <div className={ANIMATIONS.fadeIn}>
// =====================================================

// =====================================================
// CUBIC BEZIER EASINGS
// =====================================================
export const EASE = {
  // Apple/iOS standard ease-out (smoothest)
  ios: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // iOS sidebar/sheet slide (lebih cepat di awal, halus di akhir)
  iosSheet: 'cubic-bezier(0.32, 0.72, 0, 1)',

  // Spring effect - sedikit "bounce" di akhir untuk modal/popup
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',

  // Snappy - cepat, untuk button/hover
  snappy: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',

  // Linear - jarang dipakai, untuk loading bar
  linear: 'linear',
}

// =====================================================
// DURATIONS
// =====================================================
export const DURATION = {
  fast: '150ms',     // hover, button press
  normal: '250ms',   // default untuk transition
  slow: '350ms',     // modal, page transition
  slower: '450ms',   // sidebar slide
}

// =====================================================
// PRE-BUILT TRANSITIONS (untuk inline style)
// =====================================================
export const TRANSITIONS = {
  // All properties dengan duration + easing default
  smooth: `all ${DURATION.normal} ${EASE.ios}`,
  fast: `all ${DURATION.fast} ${EASE.snappy}`,
  slow: `all ${DURATION.slow} ${EASE.ios}`,

  // Khusus transform (scale, translate) - lebih cepat
  transform: `transform ${DURATION.fast} ${EASE.snappy}`,

  // Khusus opacity (fade)
  opacity: `opacity ${DURATION.normal} ${EASE.ios}`,

  // Sidebar slide
  slide: `transform ${DURATION.slower} ${EASE.iosSheet}`,

  // Spring (untuk modal, popup)
  spring: `all ${DURATION.slow} ${EASE.spring}`,
}

// =====================================================
// CSS CLASSES untuk Tailwind
// =====================================================
// Cara pakai: <div className={CLASSES.hoverScale}>
// Note: butuh definisi keyframes di index.css
export const CLASSES = {
  // Button hover - subtle scale up
  hoverScale: 'transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]',

  // Hover background
  hoverBg: 'transition-colors duration-200',

  // Card hover - lift sedikit dengan shadow
  hoverCard: 'transition-all duration-250 hover:shadow-lg hover:-translate-y-0.5',

  // Fade in saat mount
  fadeIn: 'animate-[fadeIn_250ms_ease-out]',

  // Slide up dari bawah (untuk toast, drawer)
  slideUp: 'animate-[slideUp_350ms_cubic-bezier(0.32,0.72,0,1)]',

  // Modal pop - scale dari 0.95 ke 1
  modalPop: 'animate-[modalPop_350ms_cubic-bezier(0.34,1.56,0.64,1)]',
}

// =====================================================
// CSS KEYFRAMES (untuk dimasukkan ke index.css)
// Copy block di bawah ke frontend/src/index.css
// =====================================================
export const KEYFRAMES_CSS = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes spinner {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`