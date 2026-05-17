// =====================================================
// router.jsx
// React Router setup.
//
// Update: tambah route /keranjang/checkout (CheckoutPage)
// dan /struk/:id (StrukPage - standalone, no layout).
// =====================================================

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import useAuthStore from './store/authStore'

// ===== Layouts =====
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'

// ===== Auth Pages =====
import LoginPage from './pages/auth/LoginPage'
import LupaPasswordPage from './pages/auth/LupaPasswordPage'

// ===== Dashboard =====
import DashboardPage from './pages/dashboard/DashboardPage'

// ===== Produk =====
import ProdukPage from './pages/produk/ProdukPage'
import TambahProdukPage from './pages/produk/TambahProdukPage'
import EditProdukPage from './pages/produk/EditProdukPage'
import DetailProdukPage from './pages/produk/DetailProdukPage'

// ===== Master Data (Kepala Produksi) =====
import KategoriPage from './pages/master-data/KategoriPage'
import MotifPage from './pages/master-data/MotifPage'
import RakPage from './pages/master-data/RakPage'
import HargaPage from './pages/master-data/HargaPage'
import GulunganMasterPage from './pages/master-data/GulunganMasterPage'

// ===== Order (Customer Service) =====
import OrderPage from './pages/order/OrderPage'
import KeranjangPage from './pages/order/KeranjangPage'
import CheckoutPage from './pages/order/CheckoutPage'  // ← NEW
import StrukPage from './pages/order/StrukPage'        // ← NEW
import RiwayatOrderPage from './pages/order/RiwayatOrderPage'

// ===== Pre-Order =====
import PreOrderRegulerPage from './pages/pre-order/PreOrderRegulerPage'
import TambahPORPage from './pages/pre-order/TambahPORPage'
import PreOrderCustomPage from './pages/pre-order/PreOrderCustomPage'
import TambahPOCPage from './pages/pre-order/TambahPOCPage'
import RiwayatPreOrderPage from './pages/pre-order/RiwayatPreOrderPage'

// ===== Rekap Gulungan =====
import RekapGulunganPage from './pages/rekap/RekapGulunganPage'
import RekapGulungan70Page from './pages/rekap/RekapGulungan70Page'
import RekapGulungan110Page from './pages/rekap/RekapGulungan110Page'

// ===== Laporan (Owner) =====
import LaporanPage from './pages/laporan/LaporanPage'
import LaporanOrderPage from './pages/laporan/LaporanOrderPage'
import LaporanPORegulerPage from './pages/laporan/LaporanPORegulerPage'
import LaporanPOCustomPage from './pages/laporan/LaporanPOCustomPage'

// ===== Profil =====
import ProfilPage from './pages/profil/ProfilPage'
import EditProfilPage from './pages/profil/EditProfilPage'

// =====================================================
// GUARD COMPONENTS
// =====================================================
function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function PublicRoute() {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

// =====================================================
// ROUTER CONFIG
// =====================================================
export const router = createBrowserRouter([
  // PUBLIC ROUTES
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/lupa-password', element: <LupaPasswordPage /> },
        ],
      },
    ],
  },

  // ===== STANDALONE STRUK (no layout, untuk print) =====
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/struk/:id', element: <StrukPage /> },
    ],
  },

  // ===== PROTECTED MAIN ROUTES =====
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },

          // Dashboard
          { path: '/dashboard', element: <DashboardPage /> },

          // Produk
          { path: '/produk', element: <ProdukPage /> },
          { path: '/produk/tambah', element: <TambahProdukPage /> },
          { path: '/produk/edit/:id', element: <EditProdukPage /> },
          { path: '/produk/:id', element: <DetailProdukPage /> },

          // Master Data
          { path: '/master-data/kategori', element: <KategoriPage /> },
          { path: '/master-data/motif', element: <MotifPage /> },
          { path: '/master-data/rak', element: <RakPage /> },
          { path: '/master-data/gulungan', element: <GulunganMasterPage /> },
          { path: '/master-data/harga', element: <HargaPage /> },

          // Order (CS) - flow lengkap
          { path: '/order', element: <OrderPage /> },
          { path: '/keranjang', element: <KeranjangPage /> },
          { path: '/keranjang/checkout', element: <CheckoutPage /> },  // ← NEW
          { path: '/riwayat-order', element: <RiwayatOrderPage /> },

          // Pre-Order
          { path: '/pre-order/reguler', element: <PreOrderRegulerPage /> },
          { path: '/pre-order/reguler/tambah', element: <TambahPORPage /> },
          { path: '/pre-order/custom', element: <PreOrderCustomPage /> },
          { path: '/pre-order/custom/tambah', element: <TambahPOCPage /> },

          // Riwayat
          { path: '/riwayat', element: <RiwayatPreOrderPage /> },

          // Rekap
          { path: '/rekap-gulungan', element: <RekapGulunganPage /> },
          { path: '/rekap-gulungan/70', element: <RekapGulungan70Page /> },
          { path: '/rekap-gulungan/110', element: <RekapGulungan110Page /> },

          // Laporan
          { path: '/laporan', element: <LaporanPage /> },
          { path: '/laporan/order', element: <LaporanOrderPage /> },
          { path: '/laporan/pre-order-reguler', element: <LaporanPORegulerPage /> },
          { path: '/laporan/pre-order-custom', element: <LaporanPOCustomPage /> },

          // Profil
          { path: '/profil', element: <ProfilPage /> },
          { path: '/profil/edit', element: <EditProfilPage /> },
        ],
      },
    ],
  },

  // CATCH-ALL: 404 → redirect dashboard
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])

export default router