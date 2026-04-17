/**
 * useDashboard
 * Hook fetch summary dan produk terlaris
 */
import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function useDashboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  return { data, loading, error }
}
