/**
 * useLaporan
 * Hook fetch laporan dan export
 */
import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function useLaporan() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  return { data, loading, error }
}
