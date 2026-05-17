// =====================================================
// useGulunganMaster.js
// HOOK file - PURE JAVASCRIPT, NO JSX, NO HTML TAGS
// Lokasi: frontend/src/hooks/useGulunganMaster.js
//
// Fetch SEMUA gulungan dengan filter (rak, lebar) dan
// GROUP BY produk_id di frontend.
// =====================================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import api, { getErrorMessage } from '../lib/api'

export default function useGulunganMaster({ search = '', filters = {} } = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('limit', '100')

      if (filters.lebar) params.set('lebar', String(filters.lebar))

      const res = await api.get(`/api/gulungan?${params.toString()}`)
      const result = res.data?.data || {}
      const items = result.items || []

      setData(Array.isArray(items) ? items : [])
    } catch (err) {
      setError(getErrorMessage(err))
      setData([])
    } finally {
      setLoading(false)
    }
  }, [filters.lebar])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Frontend grouping by produk
  const groups = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return []

    const groupedMap = {}

    data.forEach((g) => {
      const produkId = g.produk_id
      const produk = g.produk
      if (!produk) return

      // Filter by rak (di frontend karena rak ada di produk parent)
      if (filters.rak_id && produk.rak?.id !== filters.rak_id) {
        return
      }

      // Filter by search (kode produk atau motif)
      if (search) {
        const searchLower = search.toLowerCase()
        const kodeMatch = produk.kode_produk?.toLowerCase().includes(searchLower)
        const motifMatch = produk.motif?.nama?.toLowerCase().includes(searchLower)
        if (!kodeMatch && !motifMatch) return
      }

      if (!groupedMap[produkId]) {
        groupedMap[produkId] = {
          produk,
          gulungan: [],
        }
      }
      groupedMap[produkId].gulungan.push(g)
    })

    return Object.values(groupedMap)
      .map((group) => ({
        ...group,
        gulungan: group.gulungan.sort(
          (a, b) => (a.nomor_gulungan || 0) - (b.nomor_gulungan || 0)
        ),
      }))
      .sort((a, b) =>
        (a.produk.kode_produk || '').localeCompare(b.produk.kode_produk || '')
      )
  }, [data, filters.rak_id, search])

  return {
    groups,
    total: groups.length,
    totalGulungan: data.length,
    loading,
    error,
    refetch: fetchData,
  }
}