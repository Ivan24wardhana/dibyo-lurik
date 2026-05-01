import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import { formatRupiah, formatMeter, formatTanggal } from '../../lib/formatters'

/**
 * DetailPORModal
 * Popup detail Pre-Order Reguler — Figma node 130:369.
 * Menampilkan: Info Customer + List Kain + Status Pembayaran + Status Produksi + Rincian Harga
 */
export default function DetailPORModal({ isOpen, onClose, po }) {
  if (!po) return null

  const items = po.items || []
  const subtotal = items.reduce((sum, it) => sum + Number(it.subtotal || 0), 0)
  const diskonPersen = Number(po.diskon || 0)
  const diskonNominal = subtotal * (diskonPersen / 100)
  const total = subtotal - diskonNominal

  const statusProduksi = {
    belum_diproses: { label: 'Belum Diproduksi', variant: 'belum' },
    sedang_diproses: { label: 'Sedang Diproduksi', variant: 'sedang' },
    selesai: { label: 'Selesai', variant: 'selesai' },
  }[po.status_produksi] || { label: 'Belum Diproduksi', variant: 'belum' }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Pre-Order Reguler" size="xl">
      <div className="space-y-4">
        <div className="border border-[#caa179]/40 rounded-xl p-4">
          <h3 className="font-bold text-[#4a260f] mb-3">Informasi Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <p className="text-xs text-[#a47352] mb-1">Nama Customer</p>
              <p className="font-semibold text-sm text-[#4a260f]">{po.nama_customer || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#a47352] mb-1">Tanggal Order</p>
              <p className="font-semibold text-sm text-[#4a260f]">{po.tanggal_order ? formatTanggal(po.tanggal_order) : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#a47352] mb-1">No Telpon</p>
              <p className="font-semibold text-sm text-[#4a260f]">{po.kontak_customer || '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-[#a47352] mb-1">Alamat</p>
            <p className="text-sm text-[#4a260f]">{po.alamat_customer || '—'}</p>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="bg-[#a47352] rounded-2xl p-4 text-white">
              <p className="font-bold text-sm mb-2">Kain {idx === 0 ? 'Pertama' : idx === 1 ? 'Kedua' : `ke-${idx + 1}`}</p>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-20 h-20 bg-white rounded-xl flex-shrink-0 overflow-hidden">
                  {item.gambar_url ? <img src={item.gambar_url} alt="" className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center text-[#caa179]">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
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
                    { label: 'Lebar Kain', value: `${item.lebar} cm` },
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
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div className="border border-[#caa179]/40 rounded-xl p-3">
            <p className="text-xs font-semibold text-[#8b5e3c] mb-2">Status Pembayaran</p>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={po.status_pembayaran === 'lunas' ? 'lunas' : 'dp'}>{po.status_pembayaran === 'lunas' ? 'Lunas' : 'DP'}</Badge>
            </div>
            {po.status_pembayaran === 'dp' && (
              <div className="bg-[#be9377]/20 rounded-lg px-3 py-2 text-xs">
                <p className="text-[#a47352] mb-0.5">Nominal DP</p>
                <p className="font-bold text-[#4a260f]">{formatRupiah(po.total_dp || 0)}</p>
              </div>
            )}
          </div>

          <div className="border border-[#caa179]/40 rounded-xl p-3">
            <p className="text-xs font-semibold text-[#8b5e3c] mb-2">Metode Pembayaran</p>
            <Badge variant={po.metode_pembayaran === 'transfer' ? 'transfer' : po.metode_pembayaran === 'qris' ? 'qris' : 'cash'}>
              {po.metode_pembayaran === 'transfer' ? 'Transfer' : po.metode_pembayaran === 'qris' ? 'QRIS' : 'Cash'}
            </Badge>
          </div>

          <div className="border border-[#caa179]/40 rounded-xl p-3">
            <p className="text-xs font-semibold text-[#8b5e3c] mb-2">Status Produksi</p>
            <Badge variant={statusProduksi.variant}>{statusProduksi.label}</Badge>
          </div>

          <div className="rounded-xl p-3 text-white" style={{ background: 'linear-gradient(145deg, #a47352 0%, #8b5e3c 100%)' }}>
            <p className="text-xs font-semibold mb-2">Rincian Harga</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-white/80">SubTotal</span><span>{formatRupiah(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-white/80">Diskon</span><span>- {formatRupiah(diskonNominal)}</span></div>
              <div className="flex justify-between pt-1 border-t border-white/20 font-bold text-sm"><span>Total</span><span>{formatRupiah(total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
