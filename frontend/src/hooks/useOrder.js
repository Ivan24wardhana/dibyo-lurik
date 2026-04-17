/**
 * useOrder
 * Hook buat order dan riwayat
 */
import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function useOrder() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  return { data, loading, error }
}
