// =====================================================
// EmptyState.jsx
// Komponen untuk tampilan "data kosong" / "no results".
// HANYA icon + title + message + action button (opsional).
//
// Cara pakai:
//   <EmptyState message="Belum ada data" />
//
//   <EmptyState
//     icon={Package}
//     title="Belum ada produk"
//     message="Tambahkan produk pertama untuk memulai"
//     action={<Button onClick={...}>Tambah Produk</Button>}
//   />
// =====================================================

import { Inbox } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  message = 'Belum ada data',
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-[#a47352]/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#a47352]" strokeWidth={1.5} />
      </div>

      {title && (
        <h3 className="text-lg font-semibold text-[#a47352] mb-1">{title}</h3>
      )}

      <p className="text-sm text-[#a47352]/60 max-w-md">{message}</p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  )
} 