// =====================================================
// RakPage.jsx
// frontend/src/pages/master-data/RakPage.jsx
// Reuse MasterTablePage dari KategoriPage.
// =====================================================

import { MasterTablePage } from './KategoriPage'

export default function RakPage() {
  return (
    <MasterTablePage
      title="Rak"
      endpoint="/api/rak"
      entityLabel="rak"
      columnLabel="Rak"
      inputLabel="Nama Rak"
      inputPlaceholder="contoh: A"
    />
  )
}