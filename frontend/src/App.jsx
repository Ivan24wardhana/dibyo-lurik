// =====================================================
// App.jsx
// Root component.
//
// Update: tambah <FlyingImage /> di root supaya animasi
// terbang-ke-keranjang bisa di-trigger dari halaman manapun.
// =====================================================

import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'
import { router } from './router'
import useAuthStore from './store/authStore'
import { ToastProvider, Loading } from './components/ui'
import FlyingImage from './components/order/FlyingImage'

function App() {
  const initialize = useAuthStore((state) => state.initialize)
  const loading = useAuthStore((state) => state.loading)

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return <Loading variant="fullscreen" message="Memuat..." />
  }

  return (
    <ToastProvider>
      <RouterProvider router={router} />
      {/* FlyingImage di-mount global supaya bisa trigger dari halaman manapun */}
      <FlyingImage />
    </ToastProvider>
  )
}

export default App