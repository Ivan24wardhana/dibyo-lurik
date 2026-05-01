import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import api from '../lib/api'

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  /**
   * Dipanggil sekali di App.jsx untuk restore session dari localStorage
   */
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        set({ user: session.user, profile, loading: false })
      } else {
        set({ user: null, profile: null, loading: false })
      }
    } catch (error) {
      console.error('Auth init error:', error)
      set({ user: null, profile: null, loading: false })
    }
  },

  /**
   * Login via backend /api/auth/login
   * - Backend handle konversi username -> email
   * - Backend return session token
   * - Frontend set session ke supabase client (biar auto attach ke next requests)
   */
  login: async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password })
    const { session, user, profile } = response.data.data

    // Set session di supabase client lokal biar getSession() konsisten
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })

    set({ user, profile })
    return profile
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  hasRole: (role) => get().profile?.role === role,
}))

export default useAuthStore