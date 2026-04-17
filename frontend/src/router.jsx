import { createBrowserRouter } from 'react-router-dom'

// Layouts
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import LupaPasswordPage from './pages/auth/LupaPasswordPage'

// Main Pages
import DashboardPage from './pages/dashboard/DashboardPage'
import ProdukPage from './pages/produk/ProdukPage'
import TambahProdukPage from './pages/produk/TambahProdukPage'
import EditProdukPage from './pages/produk/EditProdukPage'
import DetailProdukPage from './pages/produk/DetailProdukPage'
import KategoriPage from './pages/master-data/KategoriPage'
import MotifPage from './pages/master-data/MotifPage'
import RakPage from './pages/master-data/RakPage'
import HargaPage from './pages/master-data/HargaPage'
import OrderPage from './pages/order/OrderPage'
import KeranjangPage from './pages/order/KeranjangPage'
import RiwayatOrderPage from './pages/order/RiwayatOrderPage'
import PreOrderRegulerPage from './pages/pre-order/PreOrderRegulerPage'
import TambahPORPage from './pages/pre-order/TambahPORPage'
import DetailPORPage from './pages/pre-order/DetailPORPage'
import PreOrderCustomPage from './pages/pre-order/PreOrderCustomPage'
import TambahPOCPage from './pages/pre-order/TambahPOCPage'
import DetailPOCPage from './pages/pre-order/DetailPOCPage'
import RiwayatPreOrderPage from './pages/pre-order/RiwayatPreOrderPage'
import RekapGulunganPage from './pages/rekap/RekapGulunganPage'
import LaporanPage from './pages/laporan/LaporanPage'
import ProfilPage from './pages/profil/ProfilPage'

const router = createBrowserRouter([
  // Auth routes (tanpa sidebar)
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/lupa-password', element: <LupaPasswordPage /> },
    ],
  },

  // Main routes (dengan sidebar + header)
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/dashboard', element: <DashboardPage /> },

      // Produk
      { path: '/produk', element: <ProdukPage /> },
      { path: '/produk/tambah', element: <TambahProdukPage /> },
      { path: '/produk/edit/:id', element: <EditProdukPage /> },
      { path: '/produk/:id', element: <DetailProdukPage /> },

      // Master Data (Kepala Produksi)
      { path: '/kategori', element: <KategoriPage /> },
      { path: '/motif', element: <MotifPage /> },
      { path: '/rak', element: <RakPage /> },
      { path: '/harga', element: <HargaPage /> },

      // Order (CS)
      { path: '/order', element: <OrderPage /> },
      { path: '/keranjang', element: <KeranjangPage /> },

      // Pre Order
      { path: '/pre-order/reguler', element: <PreOrderRegulerPage /> },
      { path: '/pre-order/reguler/tambah', element: <TambahPORPage /> },
      { path: '/pre-order/reguler/:id', element: <DetailPORPage /> },
      { path: '/pre-order/custom', element: <PreOrderCustomPage /> },
      { path: '/pre-order/custom/tambah', element: <TambahPOCPage /> },
      { path: '/pre-order/custom/:id', element: <DetailPOCPage /> },

      // Riwayat
      { path: '/riwayat/order', element: <RiwayatOrderPage /> },
      { path: '/riwayat/po-reguler', element: <RiwayatPreOrderPage /> },
      { path: '/riwayat/po-custom', element: <RiwayatPreOrderPage /> },

      // Rekap & Laporan
      { path: '/rekap', element: <RekapGulunganPage /> },
      { path: '/laporan', element: <LaporanPage /> },

      // Profil
      { path: '/profil', element: <ProfilPage /> },
    ],
  },
])

export default router
