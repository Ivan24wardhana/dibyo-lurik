// =====================================================
// useMasterData.js
// Hook untuk fetch master data (kategori, motif, rak)
// untuk dipakai di dropdown form.
//
// Cara pakai:
//   const { kategoriList, motifList, rakList, loading } = useMasterData()
// =====================================================

import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function useMasterData() {
  const [kategoriList, setKategoriList] = useState([])
  const [motifList, setMotifList] = useState([])
  const [rakList, setRakList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchAll = async () => {
      try {
        // Fetch parallel - lebih cepat
        const [kategoriRes, motifRes, rakRes] = await Promise.all([
          api.get('/api/kategori?limit=100'),
          api.get('/api/motif?limit=100'),
          api.get('/api/rak?limit=100'),
        ])

        if (!mounted) return

        const extractItems = (res) => {
          const data = res.data?.data
          return data?.items || data?.data || data || []
        }

        setKategoriList(extractItems(kategoriRes))
        setMotifList(extractItems(motifRes))
        setRakList(extractItems(rakRes))
      } catch (err) {
        console.error('[useMasterData] error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchAll()
    return () => {
      mounted = false
    }
  }, [])

  return { kategoriList, motifList, rakList, loading }
}