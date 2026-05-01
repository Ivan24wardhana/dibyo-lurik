// =====================================================
// useDashboard.js
// Custom hook untuk fetch data dashboard dari backend.
//
// Konsep "custom hook" di React:
// - Hook adalah function yang namanya diawali "use".
// - Custom hook = bungkus logika reusable supaya bisa dipakai
//   di banyak komponen tanpa duplikasi.
// - Di sini, hook ini meng-handle: fetch data, loading state,
//   error state. Komponen tinggal pakai: const { data, loading } = useDashboard()
// =====================================================

import { useState, useEffect } from 'react'
import api from '../lib/api'

// -----------------------------------------------------
// Default data agar UI tidak crash saat data belum ada.
// Struktur ini WAJIB sama dengan response backend.
// -----------------------------------------------------
const EMPTY_DATA = {
  summary: {
    produkTersedia: 0,
    produkSold: 0,
    poBelumDiproses: 0,
    poSedangDiproses: 0,
  },
  grafikPendapatan: Array(12).fill(0), // 12 bulan, semua 0
  produkTerlaris: [],
  preOrderTerbaru: [],
}

export function useDashboard() {
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true // flag untuk hindari setState setelah unmount

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const res = await api.get('/api/dashboard')

        if (mounted) {
          // Merge response dengan default supaya field yang missing
          // tetap ada (mencegah undefined error di komponen).
          setData({
            ...EMPTY_DATA,
            ...res.data,
            summary: { ...EMPTY_DATA.summary, ...(res.data?.summary || {}) },
          })
        }
      } catch (err) {
        if (mounted) {
          const msg = err.response?.data?.error || err.message || 'Unknown error'
          setError(msg)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()

    // Cleanup: kalau komponen unmount sebelum fetch selesai,
    // jangan setState (mencegah memory leak warning).
    return () => {
      mounted = false
    }
  }, [])

  return { data, loading, error }
}