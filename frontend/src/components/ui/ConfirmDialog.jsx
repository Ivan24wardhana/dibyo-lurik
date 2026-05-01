// =====================================================
// ConfirmDialog.jsx
// Dialog konfirmasi untuk destructive action (delete, dll).
//
// Cara pakai:
//   const [confirmOpen, setConfirmOpen] = useState(false)
//   const [loading, setLoading] = useState(false)
//
//   <ConfirmDialog
//     open={confirmOpen}
//     onClose={() => setConfirmOpen(false)}
//     onConfirm={async () => {
//       setLoading(true)
//       await handleDelete()
//       setLoading(false)
//       setConfirmOpen(false)
//     }}
//     title="Hapus Produk?"
//     message="Produk ini akan dihapus permanen. Lanjutkan?"
//     loading={loading}
//   />
// =====================================================

import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger', // danger / primary
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnBackdrop={!loading}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        {variant === 'danger' && (
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  )
}
