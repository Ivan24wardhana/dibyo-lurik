// =====================================================
// Toast.jsx
// Sistem notifikasi flash message (toast).
//
// Cara setup:
// 1. Wrap App.jsx dengan <ToastProvider>
// 2. Pakai hook useToast() di komponen mana saja
//
// Cara pakai:
//   import { useToast } from '@/components/ui/Toast'
//
//   function MyComponent() {
//     const toast = useToast()
//
//     const handleClick = async () => {
//       try {
//         await api.post(...)
//         toast.success('Data berhasil disimpan')
//       } catch (err) {
//         toast.error('Gagal menyimpan: ' + err.message)
//       }
//     }
//   }
//
// Setup di App.jsx:
//   import { ToastProvider } from '@/components/ui/Toast'
//
//   function App() {
//     return (
//       <ToastProvider>
//         <YourApp />
//       </ToastProvider>
//     )
//   }
// =====================================================

import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// =====================================================
// CONTEXT
// =====================================================
const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast harus dipakai dalam <ToastProvider>')
  }
  return ctx
}

// =====================================================
// PROVIDER
// =====================================================
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  // Fungsi untuk add toast baru
  const addToast = useCallback((type, message, duration = 4000) => {
    const id = Date.now() + Math.random()
    const toast = { id, type, message }

    setToasts((prev) => [...prev, toast])

    // Auto-dismiss setelah duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  // Manual dismiss
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Shortcuts untuk tipe spesifik
  const value = {
    success: (msg, duration) => addToast('success', msg, duration),
    error: (msg, duration) => addToast('error', msg, duration ?? 6000), // error lebih lama
    warning: (msg, duration) => addToast('warning', msg, duration),
    info: (msg, duration) => addToast('info', msg, duration),
    dismiss: removeToast,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// =====================================================
// CONTAINER (render position)
// =====================================================
function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

// =====================================================
// ITEM (1 toast)
// =====================================================
const TOAST_CONFIG = {
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    iconColor: 'text-green-600',
    textColor: 'text-green-900',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    iconColor: 'text-red-600',
    textColor: 'text-red-900',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-500',
    iconColor: 'text-amber-600',
    textColor: 'text-amber-900',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-900',
  },
}

function ToastItem({ toast, onRemove }) {
  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info
  const Icon = config.icon

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        flex items-start gap-3 px-4 py-3
        border-l-4 rounded-lg shadow-lg
        animate-in slide-in-from-right
        min-w-[320px]
      `}
      role="alert"
    >
      <Icon className={`${config.iconColor} w-5 h-5 flex-shrink-0 mt-0.5`} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className={`${config.iconColor} hover:opacity-70 flex-shrink-0`}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
