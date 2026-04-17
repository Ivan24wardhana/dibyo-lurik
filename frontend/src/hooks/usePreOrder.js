/**
 * usePreOrder
 * Hook CRUD PO reguler dan custom
 */
import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function usePreOrder() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  return { data, loading, error }
}
