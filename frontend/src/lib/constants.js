// =====================================================
// CONSTANTS - Dibyo Lurik
// File ini berisi semua nilai konstan yang dipakai di banyak tempat.
// Tujuannya: kalau mau ganti warna/menu, cukup edit di sini saja.
// =====================================================

// -----------------------------------------------------
// COLOR TOKENS - diambil langsung dari Figma
// -----------------------------------------------------
// Penjelasan: token = nama "alias" untuk sebuah nilai.
// Daripada hardcode #a47352 di banyak tempat, kita pakai
// COLORS.primary supaya konsisten dan gampang di-rename.
export const COLORS = {
  // Brand utama (coklat lurik)
  primary: '#a47352',
  primaryDark: '#5b2400',
  primaryHover: '#8d6044',     // sedikit lebih gelap untuk hover state
  primaryLight: '#c19478',     // sedikit lebih terang untuk disabled

  // Background lembut (untuk container card/tabel)
  accentLight: '#e3c2ac',
  accentLightSoft: 'rgba(227, 194, 172, 0.35)',

  // Badge "lebar kain"
  badgeBlue: '#798acc',     // 110 cm
  badgePurple: '#75438e',   // 70 cm

  // Badge "jenis pre-order"
  badgeCyan: '#67b1b9',     // Custom
  badgeGray: '#656961',     // Reguler

  // Badge "status pembayaran"
  badgeOrange: '#d88955',   // DP
  badgeOrangeDark: '#b85615', // Lunas

  // Status text (status order)
  statusRed: 'rgba(227, 33, 33, 0.78)',   // Belum diproses
  statusGreen: 'rgba(18, 143, 45, 0.78)', // Sedang Diproses
  statusBlue: 'rgba(27, 80, 140, 0.78)',  // Selesai

  // UI feedback
  success: '#16a34a',
  error: '#dc2626',
  warning: '#f59e0b',
  info: '#3b82f6',
}

// -----------------------------------------------------
// BADGE VARIANTS
// -----------------------------------------------------
// Mapping otomatis: nilai data → warna badge.
// Ini memudahkan komponen Badge.jsx untuk pilih warna otomatis
// berdasarkan teks/kategorinya.
export const LEBAR_BADGE_COLOR = {
  '110 cm': COLORS.badgeBlue,
  '70 cm': COLORS.badgePurple,
  // Numeric format juga support (kalau backend kirim angka)
  110: COLORS.badgeBlue,
  70: COLORS.badgePurple,
}

export const JENIS_PO_BADGE_COLOR = {
  Custom: COLORS.badgeCyan,
  Reguler: COLORS.badgeGray,
  custom: COLORS.badgeCyan,
  reguler: COLORS.badgeGray,
}

export const PEMBAYARAN_BADGE_COLOR = {
  DP: COLORS.badgeOrange,
  Lunas: COLORS.badgeOrangeDark,
  dp: COLORS.badgeOrange,
  lunas: COLORS.badgeOrangeDark,
}

export const STATUS_ORDER_TEXT_COLOR = {
  'Belum diproses': COLORS.statusRed,
  'Sedang Diproses': COLORS.statusGreen,
  'Selesai': COLORS.statusBlue,
  // Backend format (snake_case)
  'belum_diproses': COLORS.statusRed,
  'sedang_diproses': COLORS.statusGreen,
  'selesai': COLORS.statusBlue,
}

// -----------------------------------------------------
// STATUS LABELS - konversi nilai DB ke teks display
// -----------------------------------------------------
// Backend pakai snake_case, frontend tampilkan Title Case
export const STATUS_ORDER_LABEL = {
  belum_diproses: 'Belum diproses',
  sedang_diproses: 'Sedang Diproses',
  selesai: 'Selesai',
}

export const STATUS_PEMBAYARAN_LABEL = {
  dp: 'DP',
  lunas: 'Lunas',
}

export const METODE_PEMBAYARAN_LABEL = {
  cash: 'Cash',
  transfer: 'Transfer',
}

export const JENIS_PEWARNA_LABEL = {
  sintetis: 'Sintetis',
  alami: 'Alami',
}

export const STATUS_PRODUK_LABEL = {
  ready: 'Tersedia',
  sold: 'Habis',
}

// -----------------------------------------------------
// MENU CONFIG - dipakai oleh Sidebar.jsx
// -----------------------------------------------------
// Setiap role punya menu sendiri. Sidebar render menu ini
// berdasarkan profile.role yang sedang login.
//
// Format setiap item:
//   { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' }
// `icon` adalah nama icon dari library lucide-react.
//
// Kalau item punya `children`, dia jadi parent menu yang bisa di-expand.
export const MENU_CONFIG = {
  // ==========================
  // OWNER - lihat semua + export PDF
  // ==========================
  owner: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Produk', path: '/produk', icon: 'Package' },
    {
      label: 'Rekap Stok Gulungan',
      icon: 'Layers',
      children: [
        { label: 'Lebar 70', path: '/rekap-gulungan/70' },
        { label: 'Lebar 110', path: '/rekap-gulungan/110' },
      ],
    },
    {
      label: 'Pre-Order',
      icon: 'ShoppingBag',
      children: [
        { label: 'Pre-Order Reguler', path: '/pre-order/reguler' },
        { label: 'Pre-Order Custom', path: '/pre-order/custom' },
      ],
    },
    {
      label: 'Laporan',
      icon: 'FileBarChart',
      children: [
        { label: 'Order', path: '/laporan/order' },
        { label: 'Pre-Order Reguler', path: '/laporan/pre-order-reguler' },
        { label: 'Pre-Order Custom', path: '/laporan/pre-order-custom' },
      ],
    },
    { label: 'Profil', path: '/profil', icon: 'UserCircle' },
  ],

  // ==========================
  // KEPALA PRODUKSI - master data + produksi PO
  // ==========================
  kepala_produksi: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    {
      label: 'Master Data',
      icon: 'Database',
      children: [
        { label: 'Kategori', path: '/master-data/kategori' },
        { label: 'Motif', path: '/master-data/motif' },
        { label: 'Rak', path: '/master-data/rak' },
        { label: 'Daftar Harga', path: '/master-data/harga' },
      ],
    },
    { label: 'Produk', path: '/produk', icon: 'Package' },
    {
      label: 'Pre-Order',
      icon: 'ShoppingBag',
      children: [
        { label: 'Pre-Order Reguler', path: '/pre-order/reguler' },
        { label: 'Pre-Order Custom', path: '/pre-order/custom' },
      ],
    },
    {
      label: 'Rekap Stok Gulungan',
      icon: 'Layers',
      children: [
        { label: 'Lebar 70', path: '/rekap-gulungan/70' },
        { label: 'Lebar 110', path: '/rekap-gulungan/110' },
      ],
    },
    { label: 'Profil', path: '/profil', icon: 'UserCircle' },
  ],

  // ==========================
  // CUSTOMER SERVICE - jualan + input PO
  // ==========================
  customer_service: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Order', path: '/order', icon: 'ShoppingCart' },
    { label: 'Keranjang', path: '/keranjang', icon: 'ShoppingBasket' },
    {
      label: 'Pre-Order',
      icon: 'ShoppingBag',
      children: [
        { label: 'Pre-Order Reguler', path: '/pre-order/reguler' },
        { label: 'Pre-Order Custom', path: '/pre-order/custom' },
      ],
    },
    { label: 'Riwayat', path: '/riwayat', icon: 'History' },
    { label: 'Profil', path: '/profil', icon: 'UserCircle' },
  ],
}

// -----------------------------------------------------
// ROLE LABELS - untuk display di UI
// -----------------------------------------------------
export const ROLE_LABELS = {
  owner: 'Owner',
  kepala_produksi: 'Kepala Produksi',
  customer_service: 'Customer Service',
}

// -----------------------------------------------------
// PAGINATION DEFAULTS
// -----------------------------------------------------
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  LIMIT_OPTIONS: [10, 20, 50, 100],
}

// -----------------------------------------------------
// ENUM VALUES - untuk dropdown form
// -----------------------------------------------------
export const ENUM_OPTIONS = {
  jenis_pewarna: [
    { value: 'sintetis', label: 'Sintetis' },
    { value: 'alami', label: 'Alami' },
  ],
  lebar: [
    { value: 70, label: '70 cm' },
    { value: 110, label: '110 cm' },
  ],
  metode_pembayaran: [
    { value: 'cash', label: 'Cash' },
    { value: 'transfer', label: 'Transfer' },
  ],
  status_pembayaran: [
    { value: 'dp', label: 'DP' },
    { value: 'lunas', label: 'Lunas' },
  ],
  status_order: [
    { value: 'belum_diproses', label: 'Belum diproses' },
    { value: 'sedang_diproses', label: 'Sedang Diproses' },
    { value: 'selesai', label: 'Selesai' },
  ],
}