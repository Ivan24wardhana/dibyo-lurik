// =====================================================
// constants.js
// Konstanta global untuk seluruh aplikasi.
// =====================================================

// =====================================================
// COLOR PALETTE (Brand)
// =====================================================
export const COLORS = {
  primary: '#a47352',
  primaryDark: '#5b2400',
  primaryLight: '#e3c2ac',
  primaryLightSoft: 'rgba(227, 194, 172, 0.35)',

  badgeBlue: '#798acc',
  badgePurple: '#75438e',
  badgeCyan: '#67b1b9',
  badgeGray: '#656961',
  badgeOrange: '#d88955',
  badgeOrangeDark: '#b85615',
  badgeProdukReady: '#76cbf9',
  badgeProdukSold: '#999999',

  statusRed: '#a63636',
  statusYellow: '#b99e5f',
  statusGreen: '#91b960',

  detailGreen: '#4cd0b1',

  white: '#ffffff',
  bgGray: '#f5f5f5',
}

// =====================================================
// LEBAR KAIN
// =====================================================
export const LEBAR_OPTIONS = [
  { value: 70, label: '70 cm' },
  { value: 110, label: '110 cm' },
]

export const LEBAR_BADGE_COLOR = {
  70: '#75438e',
  110: '#798acc',
}

// =====================================================
// JENIS PEWARNA
// =====================================================
export const JENIS_PEWARNA_OPTIONS = [
  { value: 'sintetis', label: 'Sintetis' },
  { value: 'alami', label: 'Alami' },
]

export const JENIS_PEWARNA_LABEL = {
  sintetis: 'Sintetis',
  alami: 'Alami',
}

// =====================================================
// JENIS PO
// =====================================================
export const JENIS_PO_BADGE_COLOR = {
  reguler: '#656961',
  custom: '#67b1b9',
}

export const JENIS_PO_LABEL = {
  reguler: 'Reguler',
  custom: 'Custom',
}

// =====================================================
// STATUS PRODUK
// =====================================================
export const STATUS_PRODUK_LABEL = {
  ready: 'Ready',
  sold: 'Sold',
}

export const STATUS_PRODUK_BADGE_COLOR = {
  ready: '#76cbf9',
  sold: '#999999',
}

// =====================================================
// STATUS PRODUKSI (PO)
// =====================================================
export const STATUS_PRODUKSI_BADGE_COLOR = {
  belum_diproses: '#a63636',
  sedang_diproses: '#b99e5f',
  selesai: '#91b960',
}

export const STATUS_PRODUKSI_LABEL = {
  belum_diproses: 'Belum diproses',
  sedang_diproses: 'Sedang diproses',
  selesai: 'Selesai diproses',
}

export const STATUS_PRODUKSI_OPTIONS = [
  { value: 'belum_diproses', label: 'Belum diproses' },
  { value: 'sedang_diproses', label: 'Sedang diproses' },
  { value: 'selesai', label: 'Selesai diproses' },
]

// =====================================================
// STATUS ORDER
// =====================================================
export const STATUS_ORDER_LABEL = {
  belum_diproses: 'Belum diproses',
  sedang_diproses: 'Sedang diproses',
  selesai: 'Selesai',
}

export const STATUS_ORDER_TEXT_COLOR = {
  belum_diproses: '#a63636',
  sedang_diproses: '#b99e5f',
  selesai: '#91b960',
}

// =====================================================
// STATUS PEMBAYARAN
// =====================================================
export const STATUS_PEMBAYARAN_LABEL = {
  dp: 'DP',
  lunas: 'Lunas',
}

export const PEMBAYARAN_BADGE_COLOR = {
  dp: '#d88955',
  lunas: '#b85615',
}

export const STATUS_PEMBAYARAN_OPTIONS = [
  { value: 'dp', label: 'DP' },
  { value: 'lunas', label: 'Lunas' },
]

// =====================================================
// METODE PEMBAYARAN
// =====================================================
export const METODE_PEMBAYARAN_LABEL = {
  cash: 'Cash',
  transfer: 'Transfer',
}

export const METODE_PEMBAYARAN_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'transfer', label: 'Transfer' },
]

// =====================================================
// ROLE
// =====================================================
export const ROLES = {
  OWNER: 'owner',
  KEPALA_PRODUKSI: 'kepala_produksi',
  CUSTOMER_SERVICE: 'customer_service',
}

export const ROLE_LABELS = {
  owner: 'Owner',
  kepala_produksi: 'Kepala Produksi',
  customer_service: 'Customer Service',
}

// =====================================================
// MENU CONFIG (sidebar) - by role
// =====================================================
export const MENU_CONFIG = {
  // -------------------- OWNER --------------------
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
      icon: 'ShoppingCart',
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

  // -------------------- KEPALA PRODUKSI --------------------
  kepala_produksi: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Produk', path: '/produk', icon: 'Package' },
    {
      label: 'Master Data',
      icon: 'Database',
      children: [
        { label: 'Kategori', path: '/master-data/kategori' },
        { label: 'Motif', path: '/master-data/motif' },
        { label: 'Rak', path: '/master-data/rak' },
        { label: 'Gulungan', path: '/master-data/gulungan' },
        { label: 'Daftar Harga', path: '/master-data/harga' },
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
    {
      label: 'Pre-Order',
      icon: 'ShoppingCart',
      children: [
        { label: 'Pre-Order Reguler', path: '/pre-order/reguler' },
        { label: 'Pre-Order Custom', path: '/pre-order/custom' },
      ],
    },
    { label: 'Profil', path: '/profil', icon: 'UserCircle' },
  ],

  // -------------------- CUSTOMER SERVICE --------------------
  customer_service: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Order', path: '/order', icon: 'ShoppingBag' },
    { label: 'Keranjang', path: '/keranjang', icon: 'ShoppingBasket' },
    {
      label: 'Pre-Order',
      icon: 'ShoppingCart',
      children: [
        { label: 'Pre-Order Reguler', path: '/pre-order/reguler' },
        { label: 'Pre-Order Custom', path: '/pre-order/custom' },
      ],
    },
    {
      label: 'Riwayat',
      icon: 'History',
      children: [
        { label: 'Riwayat Order', path: '/riwayat/order' },
        { label: 'Riwayat Pre-Order Reguler', path: '/riwayat/pre-order-reguler' },
        { label: 'Riwayat Pre-Order Custom', path: '/riwayat/pre-order-custom' },
      ],
    },
    { label: 'Profil', path: '/profil', icon: 'UserCircle' },
  ],
}

// =====================================================
// PAGINATION
// =====================================================
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  PRODUK_LIMIT: 12,
  PO_LIMIT: 10,
  ORDER_LIMIT: 15,
}

// =====================================================
// ENUM OPTIONS
// =====================================================
export const ENUM_OPTIONS = {
  lebar: LEBAR_OPTIONS,
  jenis_pewarna: JENIS_PEWARNA_OPTIONS,
  status_produksi: STATUS_PRODUKSI_OPTIONS,
  status_pembayaran: STATUS_PEMBAYARAN_OPTIONS,
  metode_pembayaran: METODE_PEMBAYARAN_OPTIONS,
}