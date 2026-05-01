import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import { formatRupiah, formatTanggal } from '../../lib/formatters'

/**
 * DetailPOCModal
 * Popup detail Pre-Order Custom.
 * Berbeda dengan POR: POC tidak ada list items, tapi ada gambar custom + deskripsi.
 */
export default function DetailPOCModal({ isOpen, onClose, po }) {
  if (!po) return null

  const diskonPersen = Number(po.diskon || 0)
  const subtotal = Number(po.subtotal || po.total_harga || 0) / (1 - diskonPersen / 100 || 1)
  const diskonNominal = subtotal * (diskonPersen / 100)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Pre-Order Custom" size="lg">
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

        <div className="bg-[#a47352] rounded-2xl p-4 text-white">
          <h3 className="font-bold mb-3">Desain Custom</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-48 h-48 bg-white rounded-xl flex-shrink-0 overflow-hidden">
              {po.gambar_custom ? (
                <img src={po.gambar_custom} alt="Desain custom" className="w-full h-full object-cover" />
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
              <div>
                <p className="text-xs text-white/70 mb-1">Nomor PO</p>
                <p className="font-bold">{po.nomor_po || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-white/70 mb-1">Deskripsi Desain</p>
                <div className="bg-[#be9377]/40 rounded-lg px-3 py-2 text-sm min-h-[80px]">
                  {po.catatan || po.deskripsi || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="border border-[#caa179]/40 rounded-xl p-3">
            <p className="text-xs font-semibold text-[#8b5e3c] mb-2">Status Pembayaran</p>
            <Badge variant={po.status_pembayaran === 'lunas' ? 'lunas' : 'dp'}>{po.status_pembayaran === 'lunas' ? 'Lunas' : 'DP'}</Badge>
            {po.status_pembayaran === 'dp' && (
              <div className="mt-2 bg-[#be9377]/20 rounded-lg px-3 py-2 text-xs">
                <p className="text-[#a47352]">Nominal DP</p>
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
            <Badge variant={po.status_produksi === 'selesai' ? 'selesai' : po.status_produksi === 'sedang_diproses' ? 'sedang' : 'belum'}>
              {po.status_produksi === 'selesai' ? 'Selesai' : po.status_produksi === 'sedang_diproses' ? 'Sedang Diproses' : 'Belum Diproses'}
            </Badge>
          </div>

          <div className="rounded-xl p-3 text-white" style={{ background: 'linear-gradient(145deg, #a47352 0%, #8b5e3c 100%)' }}>
            <p className="text-xs font-semibold mb-2">Total Harga</p>
            <p className="text-lg font-bold">{formatRupiah(po.total_harga || 0)}</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
