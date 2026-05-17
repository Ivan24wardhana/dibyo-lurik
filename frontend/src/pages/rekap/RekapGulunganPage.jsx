// =====================================================
// RekapGulunganPage.jsx
// Default landing page untuk /rekap-gulungan (tanpa lebar specific).
// Otomatis redirect ke /rekap-gulungan/70 sebagai default tab.
// =====================================================

import { Navigate } from 'react-router-dom'

export default function RekapGulunganPage() {
  return <Navigate to="/rekap-gulungan/70" replace />
}