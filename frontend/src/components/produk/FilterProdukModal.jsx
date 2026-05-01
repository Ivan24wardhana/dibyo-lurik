import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'

/**
 * FilterProdukModal
 * Popup filter produk. Chip-style multi-select untuk kategori,
 * single-select untuk status dan jenis pewarna.
 * Figma node 95:19 — diperbaiki dengan reset button + filter count.
 */
export default function FilterProdukModal({ isOpen, onClose, onApply, initialFilters, kategoriList }) {
  const [selectedKategori, setSelectedKategori] = useState([])
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [selectedPewarna, setSelectedPewarna] = useState(null)

  useEffect(() => {
    if (isOpen && initialFilters) {
      setSelectedKategori(initialFilters.kategori || [])
      setSelectedStatus(initialFilters.status)
      setSelectedPewarna(initialFilters.jenisPewarna)
    }
  }, [isOpen, initialFilters])

  const toggleKategori = (id) => {
    setSelectedKategori((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    )
  }

  const handleReset = () => {
    setSelectedKategori([])
    setSelectedStatus(null)
    setSelectedPewarna(null)
  }

  const handleApply = () => {
    onApply({
      kategori: selectedKategori,
      status: selectedStatus,
      jenisPewarna: selectedPewarna,
    })
    onClose()
  }

  const totalSelected = selectedKategori.length + (selectedStatus ? 1 : 0) + (selectedPewarna ? 1 : 0)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Produk"
      size="sm"
      footer={
        <>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl text-[#8b5e3c] hover:bg-amber-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-[#a47352] hover:bg-[#8b5e3c] transition-all active:scale-[0.98]"
          >
            Terapkan {totalSelected > 0 && `(${totalSelected})`}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-[#8b5e3c] mb-2">Kategori</p>
          {kategoriList.length === 0 ? (
            <p className="text-xs text-[#a47352]/70 italic">Belum ada data kategori</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {kategoriList.map((k) => {
                const isActive = selectedKategori.includes(k.id)
                return (
                  <button
                    key={k.id}
                    onClick={() => toggleKategori(k.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#a47352] text-white'
                        : 'bg-[#be9377]/20 text-[#8b5e3c] hover:bg-[#be9377]/30'
                    }`}
                  >
                    {isActive && (
                      <svg className="inline-block mr-1" width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {k.nama_kategori}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-[#8b5e3c] mb-2">Status</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'ready', label: 'Ready' },
              { value: 'sold', label: 'Sold' },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => setSelectedStatus(selectedStatus === s.value ? null : s.value)}
                className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                  selectedStatus === s.value
                    ? 'bg-[#a47352] text-white border-[#a47352]'
                    : 'bg-white text-[#8b5e3c] border-[#caa179]/50 hover:border-[#a47352]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[#8b5e3c] mb-2">Jenis Pewarna</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'sintetis', label: 'Sintetis' },
              { value: 'alami', label: 'Alami' },
            ].map((j) => (
              <button
                key={j.value}
                onClick={() => setSelectedPewarna(selectedPewarna === j.value ? null : j.value)}
                className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                  selectedPewarna === j.value
                    ? 'bg-[#a47352] text-white border-[#a47352]'
                    : 'bg-white text-[#8b5e3c] border-[#caa179]/50 hover:border-[#a47352]'
                }`}
              >
                {j.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
