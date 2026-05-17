// =====================================================
// MotifPage.jsx
// frontend/src/pages/master-data/MotifPage.jsx
// Reuse MasterTablePage dari KategoriPage.
// =====================================================

import { MasterTablePage } from './KategoriPage'

export default function MotifPage() {
  return (
    <MasterTablePage
      title="Motif"
      endpoint="/api/motif"
      entityLabel="motif"
      columnLabel="Motif"
      inputLabel="Nama Motif"
      inputPlaceholder="contoh: Lurik Salur"
    />
  )
}