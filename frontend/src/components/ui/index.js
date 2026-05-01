// =====================================================
// index.js - Barrel Export untuk UI components
//
// Tujuan: import yang lebih clean.
//
// Sebelum:
//   import Button from '@/components/ui/Button'
//   import Input from '@/components/ui/Input'
//   import Modal from '@/components/ui/Modal'
//
// Sesudah:
//   import { Button, Input, Modal } from '@/components/ui'
//
// Note: ToastProvider & useToast diexport sebagai named export
// karena dipakai untuk setup di App.jsx (bukan komponen biasa).
// =====================================================

// Default exports → re-export sebagai named
export { default as Badge } from './Badge'
export { default as Button } from './Button'
export { default as Card } from './Card'
export { default as ConfirmDialog } from './ConfirmDialog'
export { default as EmptyState } from './EmptyState'
export { default as FilterDropdown } from './FilterDropdown'
export { default as Input } from './Input'
export { default as Loading } from './Loading'
export { default as Modal } from './Modal'
export { default as Pagination } from './Pagination'
export { default as SearchBar } from './SearchBar'
export { default as Select } from './Select'
export { default as Textarea } from './Textarea'

// Toast: butuh provider + hook
export { ToastProvider, useToast } from './Toast'
