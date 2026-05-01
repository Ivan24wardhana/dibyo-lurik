// =====================================================
// DashboardPage.jsx
// Halaman Dashboard utama. Menggabungkan semua komponen:
//   1. 4 SummaryCard (Produk Tersedia, Sold, Belum/Sedang Diproses)
//   2. GrafikPendapatan (bar chart 12 bulan)
//   3. ProdukTerlarisTable
//   4. PreOrderTerbaruTable
//
// Strategi role-based:
// - Konten DASAR (summary + tabel) → semua role lihat
// - Grafik Pendapatan → khusus owner (data finansial)
// =====================================================

import {
  Package,
  ShoppingBag,
  RefreshCw,
  ClipboardList,
} from 'lucide-react'
import SummaryCard from '../../components/dashboard/SummaryCard'
import GrafikPendapatan from '../../components/dashboard/GrafikPendapatan'
import ProdukTerlarisTable from '../../components/dashboard/ProdukTerlarisTable'
import PreOrderTerbaruTable from '../../components/dashboard/PreOrderTerbaruTable'
import { useDashboard } from '../../hooks/useDashboard'
import useAuthStore from '../../store/authStore'

export default function DashboardPage() {
  const profile = useAuthStore((s) => s.profile)
  const { data, loading, error } = useDashboard()

  // Cek role untuk conditional render
  const isOwner = profile?.role === 'owner'

  // Loading state - tampilkan skeleton/spinner sederhana
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[#a47352] text-lg">Memuat data dashboard...</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        <p className="font-medium">Gagal memuat data dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  // Destructure dengan default agar tidak crash
  const summary = data?.summary || {}
  const grafikPendapatan = data?.grafikPendapatan || []
  const produkTerlaris = data?.produkTerlaris || []
  const preOrderTerbaru = data?.preOrderTerbaru || []

  return (
    <div className="space-y-6">
      {/* ============================== */}
      {/* BARIS 1: 4 Summary Cards */}
      {/* ============================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <SummaryCard
          label="Produk Tersedia"
          value={summary.produkTersedia}
          icon={Package}
        />
        <SummaryCard
          label="Produk Sold"
          value={summary.produkSold}
          icon={ShoppingBag}
        />
        <SummaryCard
          label="Produk Belum di Proses"
          value={summary.poBelumDiproses}
          icon={RefreshCw}
        />
        <SummaryCard
          label="Produk Sedang di Proses"
          value={summary.poSedangDiproses}
          icon={ClipboardList}
        />
      </div>

      {/* ============================== */}
      {/* BARIS 2: Grafik Pendapatan (owner only) */}
      {/* ============================== */}
      {isOwner && <GrafikPendapatan data={grafikPendapatan} />}

      {/* ============================== */}
      {/* BARIS 3: Produk Terlaris */}
      {/* ============================== */}
      <ProdukTerlarisTable data={produkTerlaris} />

      {/* ============================== */}
      {/* BARIS 4: Pre-Order Terbaru */}
      {/* ============================== */}
      <PreOrderTerbaruTable data={preOrderTerbaru} />
    </div>
  )
}