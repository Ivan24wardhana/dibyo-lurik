import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import { formatRupiah, formatMeter } from '../../lib/formatters'

/**
 * DetailProdukModal
 * Popup detail produk — Figma node 95:18.
 * Menampilkan gambar + info dasar + list gulungan (No, Motif, Rak, Lebar, Panjang, Jenis Pewarna, Harga).
 */
export default function DetailProdukModal({ isOpen, onClose, produk }) {
  if (!produk) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Produk" size="lg">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-48 aspect-square bg-amber-50 rounded-2xl overflow-hidden flex-shrink-0 border border-[#caa179]/30">
            {produk.gambar_url ? (
              <img src={produk.gambar_url} alt={produk.kode_produk} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#caa179]">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                  <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-[#4a260f]">{produk.kode_produk}</h3>
              <Badge variant={produk.status === 'ready' ? 'ready' : 'sold'} dot>
                {produk.status === 'ready' ? 'Ready' : 'Sold'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Kategori', value: produk.kategori_nama },
                { label: 'Motif', value: produk.motif_nama },
                { label: 'Rak', value: produk.rak_nama },
                { label: 'Jenis Pewarna', value: produk.jenis_pewarna === 'sintetis' ? 'Sintetis' : 'Alami' },
                { label: 'Stok Gulungan', value: `${produk.stok || 0} gulungan` },
                { label: 'Total Terjual', value: `${produk.terjual || 0} m` },
              ].map((item) => (
                <div key={item.label} className="bg-amber-50/50 rounded-lg px-3 py-2 border border-[#caa179]/30">
                  <p className="text-xs text-[#a47352] mb-0.5">{item.label}</p>
                  <p className="font-semibold text-sm text-[#4a260f]">{item.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold text-[#4a260f] mb-3">List Gulungan</h4>
          {!produk.gulungan || produk.gulungan.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#a47352]/70 bg-amber-50/30 rounded-xl border border-[#caa179]/30">
              Belum ada gulungan untuk produk ini
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#caa179]/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#a47352] text-white">
                    <th className="px-3 py-2.5 text-left font-semibold">No</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Motif</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Rak</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Lebar</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Panjang Sisa</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Jenis Pewarna</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Harga/m</th>
                  </tr>
                </thead>
                <tbody>
                  {produk.gulungan.map((g, i) => (
                    <tr key={g.id || i} className="border-t border-[#caa179]/30 hover:bg-amber-50/30">
                      <td className="px-3 py-2.5 text-[#4a260f]">{i + 1}</td>
                      <td className="px-3 py-2.5 text-[#4a260f]">{g.motif_nama || produk.motif_nama}</td>
                      <td className="px-3 py-2.5 text-[#4a260f]">{g.rak_nama || produk.rak_nama}</td>
                      <td className="px-3 py-2.5 text-[#4a260f]">{g.lebar} cm</td>
                      <td className="px-3 py-2.5 text-[#4a260f]">{formatMeter(g.panjang_sisa || 0)}</td>
                      <td className="px-3 py-2.5 text-[#4a260f] capitalize">{g.jenis_pewarna || produk.jenis_pewarna}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-[#8b5e3c]">{formatRupiah(g.harga_per_meter || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
