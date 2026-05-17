// =====================================================
// useProduk.js
// Hook untuk fetch list produk + CRUD operations.
// =====================================================

import { useState, useEffect, useCallback } from 'react'
import api, { getErrorMessage } from '../lib/api'

export default function useProduk({
  page = 1,
  limit = 12,
  search = '',
  filters = {},
} = {}) {
  const [data, setData] = useState([])
  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 12,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProduk = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value != null) {
          params.set(key, String(value))
        }
      })

      const response = await api.get(`/api/produk?${params.toString()}`)
      const result = response.data?.data || {}

      const items = result.items || result.data || []
      setData(Array.isArray(items) ? items : [])

      setMeta({
        total: result.total || 0,
        totalPages: result.totalPages || 1,
        page: result.page || page,
        limit: result.limit || limit,
      })
    } catch (err) {
      setError(getErrorMessage(err))
      setData([])
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, JSON.stringify(filters)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProduk()
  }, [fetchProduk])

  return { data, meta, loading, error, refetch: fetchProduk }
}

// =====================================================
// useProdukDetail
// =====================================================
export function useProdukDetail(id) {
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
      const response = await api.get(`/api/produk/${id}`)
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
// CRUD Mutations (untuk Kepala Produksi)
// =====================================================

/**
 * Create produk baru.
 * @param {Object} payload - { kategori_id, motif_id, rak_id, jenis_pewarna, gambar_url? }
 * @returns {Promise<Object>} produk yang dibuat
 */
export async function createProduk(payload) {
  const response = await api.post('/api/produk', payload)
  return response.data?.data
}

/**
 * Update produk.
 * @param {string} id
 * @param {Object} payload - field yang mau diupdate
 * @returns {Promise<Object>}
 */
export async function updateProduk(id, payload) {
  const response = await api.patch(`/api/produk/${id}`, payload)
  return response.data?.data
}

/**
 * Hapus produk. Throw error kalau ada FK (gulungan, item PO).
 * @param {string} id
 */
export async function deleteProduk(id) {
  const response = await api.delete(`/api/produk/${id}`)
  return response.data?.data
}