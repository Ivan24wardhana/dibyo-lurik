import { useState, useEffect } from 'react'
import api from '../lib/api'

/**
 * useRekap
 * Hook untuk fetch data rekap gulungan berdasarkan lebar (70 atau 110).
 * @param {number} lebar - Lebar kain (70 atau 110)
 */
export default function useRekap(lebar) {
  const [data, setData] = useState([])
  const [totalSisa, setTotalSisa] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/api/rekap?lebar=${lebar}`)
      const result = res.data.data || res.data || []
      setData(result.gulungan || result || [])
      setTotalSisa(result.total_sisa || 0)
    } catch (err) {
      setError(err.message)
      setData([])
      setTotalSisa(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [lebar])

  return { data, totalSisa, loading, error, refetch: fetchData }
}
