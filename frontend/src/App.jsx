import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'
import { router } from './router'
import useAuthStore from './store/authStore'
import { ToastProvider } from './components/ui'


function App() {
  const initialize = useAuthStore((state) => state.initialize)
  const loading = useAuthStore((state) => state.loading)

  useEffect(() => {
    initialize()
  }, [initialize])

  // Tampilkan loading state saat auth check pertama kali jalan.
  // Mencegah halaman dashboard render sebelum tahu user login atau tidak.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-[#8b5e3c]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-[#8b5e3c] font-medium">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  ) 
}

export default App