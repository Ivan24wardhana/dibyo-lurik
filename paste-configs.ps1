# ============================================================
# DIBYO LURIK - Paste Config Files
# Jalankan SETELAH setup-structure.ps1
# ============================================================

Write-Host "Menulis file konfigurasi..." -ForegroundColor Cyan

# ---- ROOT .gitignore ----
@"
node_modules/
.env
.env.local
.env.*.local
frontend/dist/
backend/.next/
backend/out/
.DS_Store
Thumbs.db
.vscode/
.idea/
npm-debug.log*
*.tgz
.vercel
"@ | Out-File -FilePath ".gitignore" -Force
Write-Host "[OK] .gitignore" -ForegroundColor Green

# ---- frontend/vite.config.js ----
@"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
"@ | Out-File -FilePath "frontend\vite.config.js" -Force
Write-Host "[OK] frontend/vite.config.js" -ForegroundColor Green

# ---- frontend/src/index.css ----
@"
@import "tailwindcss";

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
  background-color: #f8fafc;
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #f1f5f9; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

@media print {
  body * { visibility: hidden; }
  .print-area, .print-area * { visibility: visible; }
  .print-area { position: absolute; left: 0; top: 0; width: 100%; }
}
"@ | Out-File -FilePath "frontend\src\index.css" -Force
Write-Host "[OK] frontend/src/index.css" -ForegroundColor Green

# ---- frontend/src/main.jsx ----
@"
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
"@ | Out-File -FilePath "frontend\src\main.jsx" -Force
Write-Host "[OK] frontend/src/main.jsx" -ForegroundColor Green

# ---- frontend/src/App.jsx ----
@"
import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'
import router from './router'
import useAuthStore from './store/authStore'

function App() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return <RouterProvider router={router} />
}

export default App
"@ | Out-File -FilePath "frontend\src\App.jsx" -Force
Write-Host "[OK] frontend/src/App.jsx" -ForegroundColor Green

# ---- frontend/.env.local ----
@"
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOixxxxxxxx
VITE_API_URL=http://localhost:3000
"@ | Out-File -FilePath "frontend\.env.local" -Force
Write-Host "[OK] frontend/.env.local" -ForegroundColor Green

# ---- frontend/src/lib/supabase.js ----
@"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
"@ | Out-File -FilePath "frontend\src\lib\supabase.js" -Force
Write-Host "[OK] frontend/src/lib/supabase.js" -ForegroundColor Green

# ---- frontend/src/lib/api.js ----
@"
import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = 'Bearer ' + session.access_token
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
"@ | Out-File -FilePath "frontend\src\lib\api.js" -Force
Write-Host "[OK] frontend/src/lib/api.js" -ForegroundColor Green

# ---- frontend/src/lib/formatters.js ----
@"
export const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

export const formatTanggal = (dateString) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(dateString))
}

export const formatTanggalPendek = (dateString) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(dateString))
}

export const formatMeter = (value) => {
  return Number(value).toLocaleString('id-ID', { minimumFractionDigits: 1 }) + ' m'
}

export const formatPersen = (value) => Number(value) + '%'

export const hitungDiskon = (subtotal, diskon) => {
  return subtotal - (subtotal * (diskon / 100))
}
"@ | Out-File -FilePath "frontend\src\lib\formatters.js" -Force
Write-Host "[OK] frontend/src/lib/formatters.js" -ForegroundColor Green

# ---- frontend/src/lib/validators.js ----
@"
export const required = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) return fieldName + ' wajib diisi'
  return null
}

export const minLength = (value, min, fieldName) => {
  if (value && value.length < min) return fieldName + ' minimal ' + min + ' karakter'
  return null
}

export const positiveNumber = (value, fieldName) => {
  if (value !== undefined && value !== null && Number(value) <= 0) return fieldName + ' harus lebih dari 0'
  return null
}

export const phoneNumber = (value) => {
  if (value && !/^[0-9+\-() ]{8,15}$/.test(value)) return 'Format nomor telepon tidak valid'
  return null
}

export const maxPotong = (value, sisaGulungan) => {
  if (Number(value) > Number(sisaGulungan)) return 'Panjang potong melebihi sisa gulungan (' + sisaGulungan + ' m)'
  return null
}

export const validate = (rules) => {
  const errors = {}
  for (const [field, validators] of Object.entries(rules)) {
    for (const validatorFn of validators) {
      const error = validatorFn()
      if (error) { errors[field] = error; break }
    }
  }
  return errors
}
"@ | Out-File -FilePath "frontend\src\lib\validators.js" -Force
Write-Host "[OK] frontend/src/lib/validators.js" -ForegroundColor Green

# ---- frontend/src/lib/constants.js ----
@"
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
"@ | Out-File -FilePath "frontend\src\lib\constants.js" -Force
Write-Host "[OK] frontend/src/lib/constants.js" -ForegroundColor Green

# ---- frontend/src/store/authStore.js ----
@"
import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        set({ user: session.user, profile, loading: false })
      } else {
        set({ user: null, profile: null, loading: false })
      }
    } catch (error) {
      console.error('Auth init error:', error)
      set({ user: null, profile: null, loading: false })
    }
  },

  login: async (username, password) => {
    const email = username + '@dibyo.local'
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    set({ user: data.user, profile })
    return profile
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  hasRole: (role) => get().profile?.role === role,
}))

export default useAuthStore
"@ | Out-File -FilePath "frontend\src\store\authStore.js" -Force
Write-Host "[OK] frontend/src/store/authStore.js" -ForegroundColor Green

# ---- frontend/src/store/cartStore.js ----
@"
import { create } from 'zustand'

const useCartStore = create((set, get) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, { ...item, id: Date.now() }] })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  updateItem: (id, u) => set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, ...u } : i) })),
  getSubtotal: () => get().items.reduce((t, i) => t + i.subtotal, 0),
  getTotal: (diskon = 0) => { const s = get().getSubtotal(); return s - s * (diskon / 100) },
  clearCart: () => set({ items: [] }),
  getItemCount: () => get().items.length,
}))

export default useCartStore
"@ | Out-File -FilePath "frontend\src\store\cartStore.js" -Force
Write-Host "[OK] frontend/src/store/cartStore.js" -ForegroundColor Green

# ---- frontend/src/store/preOrderStore.js ----
@"
import { create } from 'zustand'

const usePreOrderStore = create((set, get) => ({
  customer: { nama_customer: '', kontak_customer: '', alamat_customer: '' },
  items: [],
  setCustomer: (d) => set({ customer: { ...get().customer, ...d } }),
  addItem: (item) => set((s) => ({ items: [...s.items, { ...item, id: Date.now() }] })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  updateItem: (id, u) => set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, ...u } : i) })),
  getSubtotal: () => get().items.reduce((t, i) => t + i.subtotal, 0),
  resetPreOrder: () => set({ customer: { nama_customer: '', kontak_customer: '', alamat_customer: '' }, items: [] }),
}))

export default usePreOrderStore
"@ | Out-File -FilePath "frontend\src\store\preOrderStore.js" -Force
Write-Host "[OK] frontend/src/store/preOrderStore.js" -ForegroundColor Green

# ---- frontend/src/store/uiStore.js ----
@"
import { create } from 'zustand'

const useUiStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toast: null,
  showToast: (message, type = 'success') => {
    set({ toast: { message, type } })
    setTimeout(() => set({ toast: null }), 3000)
  },
  hideToast: () => set({ toast: null }),
}))

export default useUiStore
"@ | Out-File -FilePath "frontend\src\store\uiStore.js" -Force
Write-Host "[OK] frontend/src/store/uiStore.js" -ForegroundColor Green

# ---- backend/.env.local ----
@"
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOixxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOixxxxxxxx
FRONTEND_URL=http://localhost:5173
"@ | Out-File -FilePath "backend\.env.local" -Force
Write-Host "[OK] backend/.env.local" -ForegroundColor Green

# ---- backend/src/lib/supabase-server.js ----
@"
import { createClient } from '@supabase/supabase-js'

export function createSupabaseServer(authToken) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: 'Bearer ' + authToken } } }
  )
}
"@ | Out-File -FilePath "backend\src\lib\supabase-server.js" -Force
Write-Host "[OK] backend/src/lib/supabase-server.js" -ForegroundColor Green

# ---- backend/src/lib/supabase-admin.js ----
@"
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default supabaseAdmin
"@ | Out-File -FilePath "backend\src\lib\supabase-admin.js" -Force
Write-Host "[OK] backend/src/lib/supabase-admin.js" -ForegroundColor Green

# ---- backend/src/lib/helpers.js ----
@"
import { NextResponse } from 'next/server'
import { createSupabaseServer } from './supabase-server'

export function successResponse(data, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function getAuthToken(request) {
  const h = request.headers.get('Authorization')
  if (!h || !h.startsWith('Bearer ')) return null
  return h.split(' ')[1]
}

export function getSupabaseFromRequest(request) {
  const token = getAuthToken(request)
  if (!token) throw new Error('Unauthorized: token tidak ditemukan')
  return { supabase: createSupabaseServer(token), token }
}

export async function getCurrentUser(request) {
  const { supabase } = getSupabaseFromRequest(request)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized: user tidak valid')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return { user, profile, supabase }
}
"@ | Out-File -FilePath "backend\src\lib\helpers.js" -Force
Write-Host "[OK] backend/src/lib/helpers.js" -ForegroundColor Green

# ---- backend/src/middleware.js ----
@"
import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173'
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers })
  }
  return response
}

export const config = { matcher: '/api/:path*' }
"@ | Out-File -FilePath "backend\src\middleware.js" -Force
Write-Host "[OK] backend/src/middleware.js" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SEMUA CONFIG FILES BERHASIL DITULIS!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PENTING: Edit .env.local di frontend dan backend" -ForegroundColor Yellow
Write-Host "Ganti xxxxx dengan Supabase URL dan API keys kamu" -ForegroundColor Yellow
