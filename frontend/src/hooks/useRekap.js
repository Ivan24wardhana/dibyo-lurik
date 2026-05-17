// =====================================================
// useRekap.js
// Hook untuk fetch rekap gulungan, group by rak.
//
// Cara pakai:
//   const { data, loading, error, refetch } = useRekap(70)
//
// Output struktur:
//   data = {
//     groups: [
//       { rak_id, rak_nama, items: [...gulungan], total: 38 },
//       { rak_id, rak_nama, items: [...gulungan], total: 24 },
//     ],
//     totalAll: 62  // total keseluruhan panjang sisa dari semua rak
//   }
// =====================================================

import { useState, useEffect, useCallback } from 'react'
import api, { getErrorMessage } from '../lib/api'

export default function useRekap(lebar) {
  const [data, setData] = useState({ groups: [], totalAll: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRekap = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (lebar) params.set('lebar', String(lebar))

      const response = await api.get(`/api/rekap-gulungan?${params.toString()}`)
      const payload = response.data?.data || {}

      // Backend kemungkinan return:
      //   { items: [...] } atau
      //   { data: [...] } atau
      //   array langsung
      const items = Array.isArray(payload)
        ? payload
        : payload.items || payload.data || []

      // Group by rak_id di frontend
      const grouped = {}
      let totalAll = 0

      items.forEach((g) => {
        const rakId = g.rak_id || g.rak?.id || 'no-rak'
        const rakNama = g.rak_nama || g.rak?.nama || 'Tanpa Rak'

        if (!grouped[rakId]) {
          grouped[rakId] = {
            rak_id: rakId,
            rak_nama: rakNama,
            items: [],
            total: 0,
          }
        }

        grouped[rakId].items.push(g)
        const sisa = Number(g.panjang_sisa || 0)
        grouped[rakId].total += sisa
        totalAll += sisa
      })

      // Sort: rak nama A-Z
      const groups = Object.values(grouped).sort((a, b) =>
        a.rak_nama.localeCompare(b.rak_nama)
      )

      setData({ groups, totalAll })
    } catch (err) {
      setError(getErrorMessage(err))
      setData({ groups: [], totalAll: 0 })
    } finally {
      setLoading(false)
    }
  }, [lebar])

  useEffect(() => {
    fetchRekap()
  }, [fetchRekap])

  return { data, loading, error, refetch: fetchRekap }
}