/**
 * useAuth
 * Hook untuk login, logout, cek role
 */
import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function useAuth() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  return { data, loading, error }
}
