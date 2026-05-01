import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import { formatRupiah, formatMeter } from '../../lib/formatters'

/**
 * DetailOrderModal
 * Popup detail order — Figma node 130:355.
 * Menampilkan daftar item kain + metode pembayaran + rincian harga.
 */
export default function DetailOrderModal({ isOpen, onClose, order }) {
  if (!order) return null

  const items = order.items || []
  const subtotal = items.reduce((sum, it) => sum + Number(it.subtotal || 0), 0)
  const diskonPersen = Number(order.diskon || 0)
  const diskonNominal = subtotal * (diskonPersen / 100)
  const total = subtotal - diskonNominal

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Order" size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#caa179]/30">
          <div>
            <p className="text-xs text-[#a47352] mb-0.5">Nomor Order</p>
            <p className="font-bold text-[#4a260f]">{order.nomor_order || '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#a47352] mb-0.5">Tanggal</p>
            <p className="font-semibold text-sm text-[#4a260f]">
              {order.tanggal_order ? new Date(order.tanggal_order).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-[#a47352]/70 italic py-4 text-center">Tidak ada item</p>
          ) : (
            items.map((item, idx) => (
              <div key={item.id || idx} className="bg-[#a47352] rounded-2xl p-4 text-white">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-24 h-24 bg-white rounded-xl flex-shrink-0 overflow-hidden">
                    {item.gambar_url ? (
                      <img src={item.gambar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#caa179]">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1 text-sm">
                    <p><span className="text-white/70">Kode Produk:</span> <strong>{item.kode_produk || '—'}</strong></p>
                    <p><span className="text-white/70">Kategori:</span> <strong>{item.kategori_nama || '—'}</strong></p>
                    <p><span className="text-white/70">Motif:</span> <strong>{item.motif_nama || '—'}</strong></p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:w-96">
                    {[
                      { label: 'Lebar Kain', value: `${item.lebar || '—'} cm` },
                      { label: 'Panjang Kain', value: formatMeter(item.panjang || 0) },
                      { label: 'Harga', value: formatRupiah(item.subtotal || 0) },
                    ].map((f) => (
                      <div key={f.label}>
                        <p className="text-xs text-white/70 mb-1">{f.label}</p>
                        <div className="bg-[#be9377]/50 rounded-lg px-3 py-2 text-xs font-semibold">{f.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 pt-2">
          <div className="flex-1 border border-[#caa179]/40 rounded-xl p-4">
            <p className="text-sm font-semibold text-[#8b5e3c] mb-2">Metode Pembayaran</p>
            <Badge variant={order.metode_pembayaran === 'transfer' ? 'transfer' : order.metode_pembayaran === 'qris' ? 'qris' : 'cash'} size="lg">
              {order.metode_pembayaran === 'transfer' ? 'Transfer' : order.metode_pembayaran === 'qris' ? 'QRIS' : 'Cash'}
            </Badge>
          </div>

          <div className="flex-1 rounded-xl p-4 text-white" style={{ background: 'linear-gradient(145deg, #a47352 0%, #8b5e3c 100%)' }}>
            <p className="text-sm font-semibold mb-3">Rincian Harga</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-white/80">SubTotal</span>
                <span className="font-semibold">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Diskon ({diskonPersen}%)</span>
                <span className="font-semibold">- {formatRupiah(diskonNominal)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/20 text-base">
                <span>Total Harga</span>
                <span className="font-bold">{formatRupiah(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
