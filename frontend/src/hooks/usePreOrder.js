// =====================================================
// usePreOrder.js
// Hook untuk fetch list & detail Pre-Order (Reguler atau Custom).
//
// Cara pakai:
//   // List PO Reguler dengan search & filter
//   const { data, meta, loading, refetch } = usePreOrderList('reguler', {
//     page: 1, limit: 10, search: 'Nusa',
//     filters: { status: 'sedang_diproses', status_pembayaran: 'dp' }
//   })
//
//   // Detail satu PO
//   const { data: poDetail, loading } = usePreOrderDetail('reguler', poId)
//
// Param 'tipe': 'reguler' | 'custom'
//   → menentukan endpoint backend yang dipanggil
// =====================================================

import { useState, useEffect, useCallback } from 'react'
import api, { getErrorMessage } from '../lib/api'

const ENDPOINTS = {
  reguler: '/api/pre-order-reguler',
  custom: '/api/pre-order-custom',
}

// =====================================================
// usePreOrderList - LIST dengan pagination, search, filter
// =====================================================
export function usePreOrderList(
  tipe = 'reguler',
  { page = 1, limit = 10, search = '', filters = {} } = {}
) {
  const [data, setData] = useState([])
  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 10,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const endpoint = ENDPOINTS[tipe] || ENDPOINTS.reguler

  const fetchList = useCallback(async () => {
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

      const response = await api.get(`${endpoint}?${params.toString()}`)
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
  }, [endpoint, page, limit, search, JSON.stringify(filters)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchList()
  }, [fetchList])

  return { data, meta, loading, error, refetch: fetchList }
}

// =====================================================
// usePreOrderDetail - DETAIL satu PO + items (kalau reguler)
// =====================================================
export function usePreOrderDetail(tipe = 'reguler', id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const endpoint = ENDPOINTS[tipe] || ENDPOINTS.reguler

  const fetchDetail = useCallback(async () => {
    if (!id) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`${endpoint}/${id}`)
      setData(response.data?.data || null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [endpoint, id])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  return { data, loading, error, refetch: fetchDetail }
}