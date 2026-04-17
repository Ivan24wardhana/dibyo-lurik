# ============================================================
# DIBYO LURIK - Setup Script
# Jalankan di PowerShell dari folder C:\dibyo-lurik
# ============================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " DIBYO LURIK - Setup File Structure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ---- Frontend: Component Folders ----
$feBase = "frontend\src"

$folders = @(
  "$feBase\components\ui",
  "$feBase\components\layout",
  "$feBase\components\dashboard",
  "$feBase\components\master-data",
  "$feBase\components\produk",
  "$feBase\components\gulungan",
  "$feBase\components\order",
  "$feBase\components\pre-order",
  "$feBase\components\rekap",
  "$feBase\components\laporan",
  "$feBase\components\profil",
  "$feBase\pages\auth",
  "$feBase\pages\dashboard",
  "$feBase\pages\produk",
  "$feBase\pages\master-data",
  "$feBase\pages\order",
  "$feBase\pages\pre-order",
  "$feBase\pages\rekap",
  "$feBase\pages\laporan",
  "$feBase\pages\profil",
  "$feBase\hooks",
  "$feBase\store",
  "$feBase\lib",
  "$feBase\assets"
)

foreach ($f in $folders) {
  if (-not (Test-Path $f)) {
    New-Item -ItemType Directory -Path $f -Force | Out-Null
  }
}
Write-Host "[OK] Frontend folders created" -ForegroundColor Green

# ---- Frontend: UI Components ----
function New-Component($path, $name, $desc) {
  $content = @"
/**
 * $name
 * $desc
 */
export default function $name() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-700">$name</h2>
      <p className="text-sm text-gray-500">$desc</p>
    </div>
  )
}
"@
  Set-Content -Path $path -Value $content -Encoding UTF8
}

function New-Page($path, $name, $title) {
  $content = @"
/**
 * $name
 * Halaman: $title
 */
export default function $name() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">$title</h1>
      <p className="text-gray-500">Halaman $title - dalam pengembangan</p>
    </div>
  )
}
"@
  Set-Content -Path $path -Value $content -Encoding UTF8
}

function New-Hook($path, $name, $desc) {
  $content = @"
/**
 * $name
 * $desc
 */
import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function $name() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  return { data, loading, error }
}
"@
  Set-Content -Path $path -Value $content -Encoding UTF8
}

# UI Components
New-Component "$feBase\components\ui\Button.jsx" "Button" "Tombol reusable dengan variant dan size"
New-Component "$feBase\components\ui\Input.jsx" "Input" "Input field dengan label dan error message"
New-Component "$feBase\components\ui\Select.jsx" "Select" "Dropdown select dengan label"
New-Component "$feBase\components\ui\Modal.jsx" "Modal" "Modal dialog reusable"
New-Component "$feBase\components\ui\ConfirmDialog.jsx" "ConfirmDialog" "Dialog konfirmasi hapus"
New-Component "$feBase\components\ui\Card.jsx" "Card" "Card wrapper reusable"
New-Component "$feBase\components\ui\Badge.jsx" "Badge" "Badge status (ready/sold/proses)"
New-Component "$feBase\components\ui\Loading.jsx" "Loading" "Loading spinner"
New-Component "$feBase\components\ui\Toast.jsx" "Toast" "Notifikasi toast"
New-Component "$feBase\components\ui\SearchBar.jsx" "SearchBar" "Search bar dengan debounce"
New-Component "$feBase\components\ui\FilterDropdown.jsx" "FilterDropdown" "Filter dropdown"
New-Component "$feBase\components\ui\Pagination.jsx" "Pagination" "Komponen pagination"
New-Component "$feBase\components\ui\EmptyState.jsx" "EmptyState" "Tampilan data kosong"

# Barrel export
@"
export { default as Button } from './Button'
export { default as Input } from './Input'
export { default as Select } from './Select'
export { default as Modal } from './Modal'
export { default as ConfirmDialog } from './ConfirmDialog'
export { default as Card } from './Card'
export { default as Badge } from './Badge'
export { default as Loading } from './Loading'
export { default as Toast } from './Toast'
export { default as SearchBar } from './SearchBar'
export { default as FilterDropdown } from './FilterDropdown'
export { default as Pagination } from './Pagination'
export { default as EmptyState } from './EmptyState'
"@ | Set-Content "$feBase\components\ui\index.js" -Encoding UTF8

Write-Host "[OK] UI components created (13 files)" -ForegroundColor Green

# Layout
New-Component "$feBase\components\layout\Sidebar.jsx" "Sidebar" "Sidebar menu navigasi per role"
New-Component "$feBase\components\layout\Header.jsx" "Header" "Top bar dengan user info"
New-Component "$feBase\components\layout\MainLayout.jsx" "MainLayout" "Layout utama (sidebar + header + content)"
New-Component "$feBase\components\layout\AuthLayout.jsx" "AuthLayout" "Layout login dan register"

# Dashboard
New-Component "$feBase\components\dashboard\SummaryCard.jsx" "SummaryCard" "Card angka dashboard"
New-Component "$feBase\components\dashboard\ProdukTerlarisList.jsx" "ProdukTerlarisList" "List produk terlaris"
New-Component "$feBase\components\dashboard\PreOrderList.jsx" "PreOrderList" "List pre-order terbaru"
New-Component "$feBase\components\dashboard\GrafikPendapatan.jsx" "GrafikPendapatan" "Grafik Chart.js 3 line (owner)"

# Master Data
New-Component "$feBase\components\master-data\DataList.jsx" "DataList" "Reusable list CRUD master data"
New-Component "$feBase\components\master-data\KategoriForm.jsx" "KategoriForm" "Form tambah/edit kategori"
New-Component "$feBase\components\master-data\MotifForm.jsx" "MotifForm" "Form tambah/edit motif"
New-Component "$feBase\components\master-data\RakForm.jsx" "RakForm" "Form tambah/edit rak"
New-Component "$feBase\components\master-data\HargaForm.jsx" "HargaForm" "Form tambah/edit daftar harga"

# Produk
New-Component "$feBase\components\produk\ProdukCard.jsx" "ProdukCard" "Card produk (gambar di atas)"
New-Component "$feBase\components\produk\ProdukGrid.jsx" "ProdukGrid" "Grid 4 kolom card produk"
New-Component "$feBase\components\produk\ProdukForm.jsx" "ProdukForm" "Form tambah/edit produk"
New-Component "$feBase\components\produk\ProdukDetail.jsx" "ProdukDetail" "Detail produk + list gulungan"
New-Component "$feBase\components\produk\ProdukFilter.jsx" "ProdukFilter" "Filter kategori, status, search"

# Gulungan
New-Component "$feBase\components\gulungan\GulunganCard.jsx" "GulunganCard" "Card info gulungan"
New-Component "$feBase\components\gulungan\GulunganList.jsx" "GulunganList" "List gulungan dalam detail produk"
New-Component "$feBase\components\gulungan\GulunganForm.jsx" "GulunganForm" "Form tambah/edit gulungan"

# Order
New-Component "$feBase\components\order\OrderProdukCard.jsx" "OrderProdukCard" "Card produk + tombol beli dan PO"
New-Component "$feBase\components\order\PilihGulunganModal.jsx" "PilihGulunganModal" "Modal pilih gulungan + input panjang"
New-Component "$feBase\components\order\KeranjangItem.jsx" "KeranjangItem" "Item dalam keranjang"
New-Component "$feBase\components\order\KeranjangSummary.jsx" "KeranjangSummary" "Ringkasan keranjang + total"
New-Component "$feBase\components\order\CheckoutForm.jsx" "CheckoutForm" "Form metode bayar + diskon"
New-Component "$feBase\components\order\StrukOrder.jsx" "StrukOrder" "Struk cetak order"
New-Component "$feBase\components\order\RiwayatOrderItem.jsx" "RiwayatOrderItem" "Item di riwayat order"

# Pre Order
New-Component "$feBase\components\pre-order\FormCustomerPOR.jsx" "FormCustomerPOR" "Form nama/kontak/alamat POR"
New-Component "$feBase\components\pre-order\ItemPreOrderReguler.jsx" "ItemPreOrderReguler" "Item POR (lebar/panjang/jumlah)"
New-Component "$feBase\components\pre-order\ListItemPOR.jsx" "ListItemPOR" "List item di form POR"
New-Component "$feBase\components\pre-order\FormPreOrderCustom.jsx" "FormPreOrderCustom" "Form flat PO custom"
New-Component "$feBase\components\pre-order\PembayaranForm.jsx" "PembayaranForm" "Reusable: metode bayar, DP/lunas, diskon"
New-Component "$feBase\components\pre-order\RiwayatPOItem.jsx" "RiwayatPOItem" "Item di riwayat PO"
New-Component "$feBase\components\pre-order\UpdateStatusPO.jsx" "UpdateStatusPO" "Dropdown update status PO"

# Rekap, Laporan, Profil
New-Component "$feBase\components\rekap\RekapGulunganTable.jsx" "RekapGulunganTable" "Tabel rekap gulungan 70/110"
New-Component "$feBase\components\laporan\LaporanFilter.jsx" "LaporanFilter" "Filter periode laporan"
New-Component "$feBase\components\laporan\LaporanTable.jsx" "LaporanTable" "Tabel laporan penjualan"
New-Component "$feBase\components\laporan\ExportButton.jsx" "ExportButton" "Tombol export PDF/Excel"
New-Component "$feBase\components\profil\ProfilDetail.jsx" "ProfilDetail" "Detail profil user"
New-Component "$feBase\components\profil\EditProfilForm.jsx" "EditProfilForm" "Form edit username dan password"

Write-Host "[OK] All components created (42 files)" -ForegroundColor Green

# ---- Pages ----
New-Page "$feBase\pages\auth\LoginPage.jsx" "LoginPage" "Login"
New-Page "$feBase\pages\auth\RegisterPage.jsx" "RegisterPage" "Register Akun Baru"
New-Page "$feBase\pages\auth\LupaPasswordPage.jsx" "LupaPasswordPage" "Lupa Password"
New-Page "$feBase\pages\dashboard\DashboardPage.jsx" "DashboardPage" "Dashboard"
New-Page "$feBase\pages\produk\ProdukPage.jsx" "ProdukPage" "Produk"
New-Page "$feBase\pages\produk\TambahProdukPage.jsx" "TambahProdukPage" "Tambah Produk"
New-Page "$feBase\pages\produk\EditProdukPage.jsx" "EditProdukPage" "Edit Produk"
New-Page "$feBase\pages\produk\DetailProdukPage.jsx" "DetailProdukPage" "Detail Produk"
New-Page "$feBase\pages\master-data\KategoriPage.jsx" "KategoriPage" "Kategori"
New-Page "$feBase\pages\master-data\MotifPage.jsx" "MotifPage" "Motif"
New-Page "$feBase\pages\master-data\RakPage.jsx" "RakPage" "Rak"
New-Page "$feBase\pages\master-data\HargaPage.jsx" "HargaPage" "Daftar Harga"
New-Page "$feBase\pages\order\OrderPage.jsx" "OrderPage" "Order"
New-Page "$feBase\pages\order\KeranjangPage.jsx" "KeranjangPage" "Keranjang"
New-Page "$feBase\pages\order\RiwayatOrderPage.jsx" "RiwayatOrderPage" "Riwayat Order"
New-Page "$feBase\pages\pre-order\PreOrderRegulerPage.jsx" "PreOrderRegulerPage" "Pre Order Reguler"
New-Page "$feBase\pages\pre-order\TambahPORPage.jsx" "TambahPORPage" "Tambah Pre Order Reguler"
New-Page "$feBase\pages\pre-order\DetailPORPage.jsx" "DetailPORPage" "Detail Pre Order Reguler"
New-Page "$feBase\pages\pre-order\PreOrderCustomPage.jsx" "PreOrderCustomPage" "Pre Order Custom"
New-Page "$feBase\pages\pre-order\TambahPOCPage.jsx" "TambahPOCPage" "Tambah Pre Order Custom"
New-Page "$feBase\pages\pre-order\DetailPOCPage.jsx" "DetailPOCPage" "Detail Pre Order Custom"
New-Page "$feBase\pages\pre-order\RiwayatPreOrderPage.jsx" "RiwayatPreOrderPage" "Riwayat Pre Order"
New-Page "$feBase\pages\rekap\RekapGulunganPage.jsx" "RekapGulunganPage" "Rekap Stok Gulungan"
New-Page "$feBase\pages\laporan\LaporanPage.jsx" "LaporanPage" "Laporan Penjualan"
New-Page "$feBase\pages\profil\ProfilPage.jsx" "ProfilPage" "Profil"

Write-Host "[OK] All pages created (25 files)" -ForegroundColor Green

# ---- Hooks ----
New-Hook "$feBase\hooks\useAuth.js" "useAuth" "Hook untuk login, logout, cek role"
New-Hook "$feBase\hooks\useProduk.js" "useProduk" "Hook CRUD produk"
New-Hook "$feBase\hooks\useGulungan.js" "useGulungan" "Hook CRUD gulungan"
New-Hook "$feBase\hooks\useOrder.js" "useOrder" "Hook buat order dan riwayat"
New-Hook "$feBase\hooks\usePreOrder.js" "usePreOrder" "Hook CRUD PO reguler dan custom"
New-Hook "$feBase\hooks\useMasterData.js" "useMasterData" "Hook CRUD kategori, motif, rak, harga"
New-Hook "$feBase\hooks\useDashboard.js" "useDashboard" "Hook fetch summary dan produk terlaris"
New-Hook "$feBase\hooks\useLaporan.js" "useLaporan" "Hook fetch laporan dan export"

Write-Host "[OK] All hooks created (8 files)" -ForegroundColor Green

# ---- Backend: API Route Folders ----
$beBase = "backend\src\app\api"

$beFolders = @(
  "$beBase\auth\login",
  "$beBase\auth\register",
  "$beBase\auth\forgot-password",
  "$beBase\auth\profile",
  "$beBase\kategori",
  "$beBase\motif",
  "$beBase\rak",
  "$beBase\daftar-harga",
  "$beBase\produk\[id]",
  "$beBase\gulungan\[id]",
  "$beBase\orders\[id]",
  "$beBase\pre-order-reguler\[id]",
  "$beBase\pre-order-custom\[id]",
  "$beBase\dashboard",
  "$beBase\rekap",
  "$beBase\laporan\export",
  "backend\src\lib"
)

foreach ($f in $beFolders) {
  if (-not (Test-Path $f)) {
    New-Item -ItemType Directory -Path $f -Force | Out-Null
  }
}

# Backend API route helper
function New-Route($path, $methods, $desc) {
  $content = @"
import { successResponse, errorResponse, getCurrentUser } from '@/lib/helpers'

/**
 * $desc
 * Methods: $methods
 */

export async function GET(request) {
  try {
    const { supabase, profile } = await getCurrentUser(request)
    // TODO: implement
    return successResponse({ message: '$desc - GET' })
  } catch (error) {
    return errorResponse(error.message, 401)
  }
}

export async function POST(request) {
  try {
    const { supabase, profile } = await getCurrentUser(request)
    const body = await request.json()
    // TODO: implement
    return successResponse({ message: '$desc - POST' }, 201)
  } catch (error) {
    return errorResponse(error.message)
  }
}
"@
  Set-Content -Path $path -Value $content -Encoding UTF8
}

function New-RouteCrud($path, $desc) {
  $content = @"
import { successResponse, errorResponse, getCurrentUser } from '@/lib/helpers'

/**
 * $desc
 * Methods: GET (by id), PUT, DELETE
 */

export async function GET(request, { params }) {
  try {
    const { supabase } = await getCurrentUser(request)
    const { id } = await params
    // TODO: implement
    return successResponse({ message: '$desc - GET by id', id })
  } catch (error) {
    return errorResponse(error.message, 401)
  }
}

export async function PUT(request, { params }) {
  try {
    const { supabase } = await getCurrentUser(request)
    const { id } = await params
    const body = await request.json()
    // TODO: implement
    return successResponse({ message: '$desc - PUT', id })
  } catch (error) {
    return errorResponse(error.message)
  }
}

export async function DELETE(request, { params }) {
  try {
    const { supabase } = await getCurrentUser(request)
    const { id } = await params
    // TODO: implement
    return successResponse({ message: '$desc - DELETE', id })
  } catch (error) {
    return errorResponse(error.message)
  }
}
"@
  Set-Content -Path $path -Value $content -Encoding UTF8
}

# Create all API routes
New-Route "$beBase\auth\login\route.js" "POST" "Login user"
New-Route "$beBase\auth\register\route.js" "POST" "Register user baru (owner only)"
New-Route "$beBase\auth\forgot-password\route.js" "POST" "Reset password"
New-Route "$beBase\auth\profile\route.js" "GET, PUT" "Get dan update profil"
New-Route "$beBase\kategori\route.js" "GET, POST" "CRUD Kategori"
New-Route "$beBase\motif\route.js" "GET, POST" "CRUD Motif"
New-Route "$beBase\rak\route.js" "GET, POST" "CRUD Rak"
New-Route "$beBase\daftar-harga\route.js" "GET, POST" "CRUD Daftar Harga"
New-Route "$beBase\produk\route.js" "GET, POST" "List dan tambah Produk"
New-RouteCrud "$beBase\produk\[id]\route.js" "Detail, edit, hapus Produk"
New-Route "$beBase\gulungan\route.js" "GET, POST" "List dan tambah Gulungan"
New-RouteCrud "$beBase\gulungan\[id]\route.js" "Detail, edit, hapus Gulungan"
New-Route "$beBase\orders\route.js" "GET, POST" "Riwayat dan checkout Order"
New-RouteCrud "$beBase\orders\[id]\route.js" "Detail order + items"
New-Route "$beBase\pre-order-reguler\route.js" "GET, POST" "List dan tambah PO Reguler"
New-RouteCrud "$beBase\pre-order-reguler\[id]\route.js" "Detail dan update PO Reguler"
New-Route "$beBase\pre-order-custom\route.js" "GET, POST" "List dan tambah PO Custom"
New-RouteCrud "$beBase\pre-order-custom\[id]\route.js" "Detail dan update PO Custom"
New-Route "$beBase\dashboard\route.js" "GET" "Dashboard summary"
New-Route "$beBase\rekap\route.js" "GET" "Rekap stok gulungan"
New-Route "$beBase\laporan\route.js" "GET" "Laporan penjualan"
New-Route "$beBase\laporan\export\route.js" "GET" "Export PDF/Excel"

Write-Host "[OK] All backend API routes created (22 files)" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SETUP SELESAI!" -ForegroundColor Cyan
Write-Host " Total: 130+ files created" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next step: download file konfigurasi dari Claude" -ForegroundColor Yellow
Write-Host "(vite.config.js, .env.local, lib/, store/, router.jsx, dll)" -ForegroundColor Yellow
