import { useState, useEffect } from 'react'
import api from '../lib/api'

/**
 * useLaporan
 * Hook untuk fetch laporan berdasarkan jenis.
 * @param {'order' | 'po-reguler' | 'po-custom'} jenis
 */
export default function useLaporan(jenis) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const endpointMap = {
    'order': '/api/orders',
    'po-reguler': '/api/pre-order-reguler',
    'po-custom': '/api/pre-order-custom',
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(endpointMap[jenis])
      setData(res.data.data || [])
    } catch (err) {
      setError(err.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [jenis])

  return { data, loading, error, refetch: fetchData }
}
