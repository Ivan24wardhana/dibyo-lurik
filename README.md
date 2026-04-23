# Dibyo Lurik - Sistem Manajemen Internal Toko

Aplikasi web untuk mengelola operasional internal toko **Dibyo Lurik** — UMKM kain lurik tradisional.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Backend API | Next.js (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Grafik | Chart.js |
| Version Control | GitHub |

## Fitur Utama

### 3 Role User
- **Owner** — Dashboard + grafik pendapatan, laporan, rekap, kelola akun
- **Kepala Produksi** — CRUD produk & gulungan, master data, update status PO
- **Customer Service** — Order, keranjang, pre-order reguler & custom, riwayat

### Modul
- Login / Register / Lupa Password
- Dashboard (adaptif per role)
- Master Data (Kategori, Motif, Rak, Daftar Harga)
- Produk & Gulungan (auto-stok, auto-status, auto-kode produk)
- Order (keranjang, diskon, metode pembayaran, cetak struk)
- Pre Order Reguler (multi-item, DP/Lunas, auto-harga)
- Pre Order Custom (flat form, upload desain, harga manual)
- Rekap Stok Gulungan (lebar 70 & 110)
- Laporan + Export PDF/Excel
- Grafik Pendapatan Bulanan (Chart.js, 3 line)

## Struktur Folder

```
C:\dibyo-lurik\
├── frontend/          → React + Vite (SPA)
├── backend/           → Next.js (API only)
├── database/          → SQL schema & migration
├── docs/              → Dokumentasi lengkap
│   ├── arsitektur/    → Diagram arsitektur kode
│   ├── database/      → ERD + penjelasan tabel
│   ├── komponen/      → Penjelasan komponen React
│   └── user-manual/   → Panduan penggunaan
├── .gitignore
└── README.md
```

## Setup & Instalasi

### Prasyarat
- Node.js v18+
- Git
- Akun Supabase

### 1. Clone Repository
```bash
git clone https://github.com/USERNAME/dibyo-lurik.git
cd dibyo-lurik
```

### 2. Setup Frontend
```bash
cd frontend
npm install
```
Buat file `frontend/.env.local` dan isi:
```env
VITE_SUPABASE_URL=https://jflgkfxxhyvwrjfvxzlh.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=http://localhost:3000
```
Jalankan frontend:
```bash
npm run dev
```
Frontend berjalan di `http://localhost:5173`

### 3. Setup Backend
```bash
cd backend
npm install
```
Buat file `backend/.env.local` dan isi:
```env
SUPABASE_URL=https://jflgkfxxhyvwrjfvxzlh.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
FRONTEND_URL=http://localhost:5173
```
Jalankan backend:
```bash
npm run dev
```
Backend berjalan di `http://localhost:3000`

### 4. Setup Database
1. Buat project di [supabase.com](https://supabase.com)
2. Jalankan `database/001_schema.sql` di SQL Editor
3. Verifikasi 12 tabel terbuat di Table Editor

## Environment Variables

### Frontend (`frontend/.env.local`)
| Variable | Keterangan |
|----------|------------|
| `VITE_SUPABASE_URL` | URL project Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon (public) key dari Supabase |
| `VITE_API_URL` | URL backend API (default: `http://localhost:3000`) |

### Backend (`backend/.env.local`)
| Variable | Keterangan |
|----------|------------|
| `SUPABASE_URL` | URL project Supabase (sama dengan frontend) |
| `SUPABASE_ANON_KEY` | Anon (public) key dari Supabase (sama dengan frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (RAHASIA, hanya untuk backend) |
| `FRONTEND_URL` | URL frontend untuk CORS (default: `http://localhost:5173`) |

> **Catatan:** File `.env.local` sudah masuk `.gitignore` dan tidak akan ter-commit ke GitHub. Jangan pernah share `SUPABASE_SERVICE_ROLE_KEY` karena bisa bypass semua keamanan database.

## Tim Pengembang

- **Ivan Kusuma Wardhana** — Sistem Informasi — 242103008

## Lisensi

Project ini dibuat untuk keperluan akademik.
