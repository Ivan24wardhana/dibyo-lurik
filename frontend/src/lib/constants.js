export const ROLES = { OWNER: 'owner', KEPALA_PRODUKSI: 'kepala_produksi', CUSTOMER_SERVICE: 'customer_service' }
export const ROLE_LABELS = { owner: 'Owner', kepala_produksi: 'Kepala Produksi', customer_service: 'Customer Service' }

export const STATUS_PRODUK = { READY: 'ready', SOLD: 'sold' }
export const STATUS_PRODUK_LABELS = { ready: 'Ready', sold: 'Sold' }

export const STATUS_PO = { BELUM_DIPROSES: 'belum_diproses', SEDANG_DIPROSES: 'sedang_diproses', SELESAI: 'selesai' }
export const STATUS_PO_LABELS = { belum_diproses: 'Belum Diproses', sedang_diproses: 'Sedang Diproses', selesai: 'Selesai' }

export const STATUS_BAYAR = { DP: 'dp', LUNAS: 'lunas' }
export const STATUS_BAYAR_LABELS = { dp: 'DP', lunas: 'Lunas' }

export const METODE_BAYAR = { CASH: 'cash', TRANSFER: 'transfer' }
export const METODE_BAYAR_LABELS = { cash: 'Cash', transfer: 'Transfer' }

export const JENIS_PEWARNA = { SINTETIS: 'sintetis', ALAMI: 'alami' }
export const JENIS_PEWARNA_LABELS = { sintetis: 'Sintetis', alami: 'Alami' }

export const LEBAR_OPTIONS = [{ value: 70, label: '70 cm' }, { value: 110, label: '110 cm' }]

export const MENU_CONFIG = {
  kepala_produksi: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Produk', path: '/produk', icon: 'Package' },
    { label: 'Pre Order', path: '/pre-order', icon: 'ClipboardList', children: [
      { label: 'PO Reguler', path: '/pre-order/reguler' },
      { label: 'PO Custom', path: '/pre-order/custom' },
    ]},
    { label: 'Rekap Gulungan', path: '/rekap', icon: 'BarChart3' },
    { label: 'Profil', path: '/profil', icon: 'User' },
  ],
  customer_service: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Order', path: '/order', icon: 'ShoppingCart' },
    { label: 'Keranjang', path: '/keranjang', icon: 'ShoppingBag' },
    { label: 'Pre Order', path: '/pre-order', icon: 'ClipboardList', children: [
      { label: 'PO Reguler', path: '/pre-order/reguler' },
      { label: 'PO Custom', path: '/pre-order/custom' },
    ]},
    { label: 'Riwayat', path: '/riwayat', icon: 'History', children: [
      { label: 'Order', path: '/riwayat/order' },
      { label: 'PO Reguler', path: '/riwayat/po-reguler' },
      { label: 'PO Custom', path: '/riwayat/po-custom' },
    ]},
    { label: 'Profil', path: '/profil', icon: 'User' },
  ],
  owner: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Produk', path: '/produk', icon: 'Package' },
    { label: 'Rekap Gulungan', path: '/rekap', icon: 'BarChart3' },
    { label: 'Pre Order', path: '/pre-order', icon: 'ClipboardList', children: [
      { label: 'PO Reguler', path: '/pre-order/reguler' },
      { label: 'PO Custom', path: '/pre-order/custom' },
    ]},
    { label: 'Laporan', path: '/laporan', icon: 'FileText' },
    { label: 'Profil', path: '/profil', icon: 'User' },
  ],
}
