import Badge from '../ui/Badge'

/**
 * ProdukCard
 * Card produk untuk grid view. Gambar + info + tombol Detail.
 */
export default function ProdukCard({ produk, onDetail }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-[#caa179]/50 overflow-hidden hover:shadow-lg hover:border-[#a47352] transition-all group">
      <div className="relative aspect-[4/3] bg-amber-50 overflow-hidden">
        {produk.gambar_url ? (
          <img src={produk.gambar_url} alt={produk.kode_produk} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#caa179]">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={produk.status === 'ready' ? 'ready' : 'sold'} size="sm" dot>
            {produk.status === 'ready' ? 'Ready' : 'Sold'}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <p className="font-bold text-sm text-[#4a260f] truncate mb-1">{produk.kode_produk}</p>
        <div className="flex items-center gap-1.5 text-xs text-[#a47352] mb-3">
          <span className="truncate">{produk.kategori_nama || '—'}</span>
          <span className="text-[#caa179]">•</span>
          <span className="truncate">{produk.motif_nama || '—'}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-[#8b5e3c] mb-3">
          <span>Stok: <strong>{produk.stok || 0}</strong></span>
          <span>Terjual: <strong>{produk.terjual || 0}</strong></span>
        </div>

        <button
          onClick={() => onDetail(produk)}
          className="w-full h-10 rounded-xl font-semibold text-sm transition-all hover:shadow-md active:scale-[0.98] bg-[#a47352] hover:bg-[#8b5e3c] text-white"
        >
          Detail
        </button>
      </div>
    </div>
  )
}
