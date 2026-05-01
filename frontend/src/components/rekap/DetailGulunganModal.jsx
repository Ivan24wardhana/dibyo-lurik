import Modal from '../ui/Modal'
import { formatRupiah, formatMeter } from '../../lib/formatters'

/**
 * DetailGulunganModal
 * Popup detail 1 gulungan — Figma node 112:44 (70cm) dan 130:449 (110cm).
 * Struktur sama untuk kedua lebar, hanya title yang beda.
 * Read-only view dengan info ditampilkan dalam field-style.
 */
export default function DetailGulunganModal({ isOpen, onClose, gulungan, lebar }) {
  if (!gulungan) return null

  const fields = [
    { label: 'Motif Gulungan', value: gulungan.motif_nama || '—' },
    { label: 'Rak', value: gulungan.rak_nama || '—' },
    { label: 'No Gulungan', value: gulungan.nomor_gulungan || '—' },
    { label: 'Jenis Pewarna', value: gulungan.jenis_pewarna === 'sintetis' ? 'Sintetis' : 'Alami' },
    { label: 'Lebar Gulungan', value: `${gulungan.lebar} cm`, fullWidth: true },
    { label: 'Panjang Sisa', value: formatMeter(gulungan.panjang_sisa || 0), fullWidth: true },
    { label: 'Panjang Awal', value: formatMeter(gulungan.panjang_total || 0), fullWidth: true },
    { label: 'Harga per Meter', value: formatRupiah(gulungan.harga_per_meter || 0), fullWidth: true },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detail Gulungan ${lebar} cm`} size="md">
      <div className="space-y-5">
        <div className="w-full aspect-video bg-amber-50 rounded-2xl overflow-hidden border border-[#caa179]/30">
          {gulungan.gambar_url || gulungan.produk_gambar ? (
            <img src={gulungan.gambar_url || gulungan.produk_gambar} alt="Gulungan" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#caa179]">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.label} className={f.fullWidth ? 'col-span-2' : ''}>
              <p className="text-sm font-semibold text-[#8b5e3c] mb-1">{f.label}</p>
              <div className="w-full h-11 px-4 rounded-xl border-2 border-[#caa179]/50 bg-[#be9377]/20 flex items-center font-medium text-[#4a260f]">
                {f.value}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#caa179]/30 flex items-center justify-between">
          <span className="text-sm text-[#a47352]">Kode Produk</span>
          <span className="font-semibold text-sm text-[#4a260f]">{gulungan.kode_produk || '—'}</span>
        </div>
      </div>
    </Modal>
  )
}
