/**
 * useGulungan
 * Hook CRUD gulungan
 */
import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function useGulungan() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  return { data, loading, error }
}
