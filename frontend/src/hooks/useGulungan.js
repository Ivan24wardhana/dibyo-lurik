// =====================================================
// useGulungan.js
// Hook generic untuk CRUD gulungan.
//
// Note:
//   - Untuk halaman Master Gulungan (group by produk), pakai useGulunganMaster.js
//   - Untuk Detail Produk (gulungan dalam 1 produk), data sudah include
//     di /api/produk/[id] (field produk.gulungan), tidak perlu fetch terpisah
//   - Hook ini buat case lain misal: filter gulungan global, search gulungan, dll
//
// Cara pakai:
//   // List dengan filter
//   const { data, meta, loading, refetch } = useGulunganList({
//     page: 1,
//     limit: 20,
//     filters: { produk_id: '...', lebar: 70, is_active: true }
//   })
//
//   // Detail satu gulungan
//   const { data, loading } = useGulunganDetail(gulunganId)
// =====================================================

import { useState, useEffect, useCallback } from 'react'
import api, { getErrorMessage } from '../lib/api'

// =====================================================
// useGulunganList - LIST dengan filter & pagination
// =====================================================
export function useGulunganList({
  page = 1,
  limit = 20,
  filters = {},
} = {}) {
  const [data, setData] = useState([])
  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 20,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value != null) {
          params.set(key, String(value))
        }
      })

      const response = await api.get(`/api/gulungan?${params.toString()}`)
      const result = response.data?.data || {}

      const items = result.items || []
      setData(Array.isArray(items) ? items : [])

      // Backend return pagination.total_pages (snake_case)
      const pagination = result.pagination || {}
      setMeta({
        total: pagination.total || 0,
        totalPages: pagination.total_pages || 1,
        page: pagination.page || page,
        limit: pagination.limit || limit,
      })
    } catch (err) {
      setError(getErrorMessage(err))
      setData([])
    } finally {
      setLoading(false)
    }
  }, [page, limit, JSON.stringify(filters)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchList()
  }, [fetchList])

  return { data, meta, loading, error, refetch: fetchList }
}

// =====================================================
// useGulunganDetail - DETAIL satu gulungan by ID
// =====================================================
export function useGulunganDetail(id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDetail = useCallback(async () => {
    if (!id) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/api/gulungan/${id}`)
      setData(response.data?.data || null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  return { data, loading, error, refetch: fetchDetail }
}

// =====================================================
// Default export - backward compatibility
// (Kalau ada file lain yang import default dari useGulungan,
//  ini fallback supaya tidak break)
// =====================================================
export default function useGulungan(params = {}) {
  return useGulunganList(params)
}