import { useState, useEffect, useMemo } from 'react'
import api from '../lib/api'

/**
 * useProduk
 * Hook untuk mengelola data produk: fetch, search, filter, refetch.
 * Filter supported: kategori[], status, jenisPewarna
 */
export default function useProduk() {
  const [produk, setProduk] = useState([])
  const [kategoriList, setKategoriList] = useState([])
  const [motifList, setMotifList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    kategori: [],
    status: null,
    jenisPewarna: null,
  })

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [produkRes, kategoriRes, motifRes] = await Promise.all([
        api.get('/api/produk'),
        api.get('/api/kategori'),
        api.get('/api/motif'),
      ])
      setProduk(produkRes.data.data || [])
      setKategoriList(kategoriRes.data.data || [])
      setMotifList(motifRes.data.data || [])
    } catch (err) {
      setError(err.message)
      setProduk([])
      setKategoriList([])
      setMotifList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filteredProduk = useMemo(() => {
    let result = [...produk]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.kode_produk?.toLowerCase().includes(q) ||
          p.kategori_nama?.toLowerCase().includes(q) ||
          p.motif_nama?.toLowerCase().includes(q)
      )
    }

    if (filters.kategori.length > 0) {
      result = result.filter((p) => filters.kategori.includes(p.kategori_id))
    }

    if (filters.status) {
      result = result.filter((p) => p.status === filters.status)
    }

    if (filters.jenisPewarna) {
      result = result.filter((p) => p.jenis_pewarna === filters.jenisPewarna)
    }

    return result
  }, [produk, search, filters])

  const activeFilterCount =
    filters.kategori.length +
    (filters.status ? 1 : 0) +
    (filters.jenisPewarna ? 1 : 0)

  return {
    produk: filteredProduk,
    allProduk: produk,
    kategoriList,
    motifList,
    loading,
    error,
    search, setSearch,
    filters, setFilters,
    activeFilterCount,
    refetch: fetchData,
  }
}
