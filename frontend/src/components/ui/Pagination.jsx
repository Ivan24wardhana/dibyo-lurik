// =====================================================
// Pagination.jsx
// Pagination control untuk list/table.
//
// Cara pakai:
//   <Pagination
//     page={page}
//     totalPages={totalPages}
//     totalItems={totalItems}
//     limit={limit}
//     onPageChange={(newPage) => setPage(newPage)}
//   />
//
// Output:
//   "Menampilkan 1-20 dari 50 data"  [<] 1 2 3 [>]
// =====================================================

import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 20,
  onPageChange,
}) {
  // Hitung range item yang sedang ditampilkan
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1
  const endItem = Math.min(page * limit, totalItems)

  // Tidak perlu render kalau cuma 1 page atau kurang
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-600">
          Menampilkan <strong>{totalItems}</strong> data
        </p>
      </div>
    )
  }

  // Generate array page numbers untuk display
  // Logic: tampilkan max 7 page (current ± 3)
  const getPageNumbers = () => {
    const pages = []
    const maxButtons = 7
    let start = Math.max(1, page - 3)
    let end = Math.min(totalPages, start + maxButtons - 1)

    // Adjust kalau end ke ujung, geser start ke kiri
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1)
    }

    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  const pageNumbers = getPageNumbers()
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
      {/* Info */}
      <p className="text-sm text-gray-600">
        Menampilkan <strong>{startItem}</strong>-<strong>{endItem}</strong> dari{' '}
        <strong>{totalItems}</strong> data
      </p>

      {/* Buttons */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          type="button"
          onClick={() => canPrev && onPageChange(page - 1)}
          disabled={!canPrev}
          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-[#a47352]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {pageNumbers[0] > 1 && (
          <>
            <PageButton page={1} isActive={false} onClick={onPageChange}>
              1
            </PageButton>
            {pageNumbers[0] > 2 && (
              <span className="px-2 text-gray-400">...</span>
            )}
          </>
        )}

        {pageNumbers.map((p) => (
          <PageButton
            key={p}
            page={p}
            isActive={p === page}
            onClick={onPageChange}
          >
            {p}
          </PageButton>
        ))}

        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="px-2 text-gray-400">...</span>
            )}
            <PageButton
              page={totalPages}
              isActive={false}
              onClick={onPageChange}
            >
              {totalPages}
            </PageButton>
          </>
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => canNext && onPageChange(page + 1)}
          disabled={!canNext}
          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-[#a47352]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Helper component untuk tombol angka page
function PageButton({ page, isActive, onClick, children }) {
  return (
    <button
      type="button"
      onClick={() => onClick(page)}
      className={`
        min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors
        ${
          isActive
            ? 'bg-[#a47352] text-white'
            : 'border border-gray-300 text-gray-700 hover:bg-[#a47352]/10'
        }
      `}
    >
      {children}
    </button>
  )
}
