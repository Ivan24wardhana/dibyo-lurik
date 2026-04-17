/**
 * useProduk
 * Hook CRUD produk
 */
import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function useProduk() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  return { data, loading, error }
}
