import Badge from '../ui/Badge'
import { formatRupiah, formatTanggalPendek } from '../../lib/formatters'

/**
 * LaporanTable
 * Tabel reusable untuk list Order/POR/POC.
 * Kolom: No, Nama Customer, Tanggal, Jumlah Kain, Total Harga, Status, Metode, Aksi
 */
export default function LaporanTable({ data, onLihat, jenis }) {
  const statusMap = {
    belum_diproses: { label: 'Belum Diproses', variant: 'belum' },
    sedang_diproses: { label: 'Sedang Diproses', variant: 'sedang' },
    selesai: { label: 'Selesai', variant: 'selesai' },
  }

  const metodeMap = {
    cash: { label: 'Cash', variant: 'cash' },
    transfer: { label: 'Transfer', variant: 'transfer' },
    qris: { label: 'QRIS', variant: 'qris' },
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#caa179]/30">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#a47352] text-white">
            <th className="px-3 py-3 text-left font-semibold w-12">No</th>
            <th className="px-3 py-3 text-left font-semibold">Nama Customer</th>
            <th className="px-3 py-3 text-left font-semibold">Tanggal</th>
            <th className="px-3 py-3 text-center font-semibold">Jumlah Kain</th>
            <th className="px-3 py-3 text-right font-semibold">Total Harga</th>
            {jenis !== 'order' && <th className="px-3 py-3 text-center font-semibold">Status Produksi</th>}
            <th className="px-3 py-3 text-center font-semibold">Metode Bayar</th>
            <th className="px-3 py-3 text-center font-semibold w-20">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={jenis !== 'order' ? 8 : 7} className="px-4 py-12 text-center text-sm text-[#a47352]/70 italic">
                Belum ada data transaksi
              </td>
            </tr>
          ) : (
            data.map((item, i) => {
              const s = statusMap[item.status_produksi] || statusMap.belum_diproses
              const m = metodeMap[item.metode_pembayaran] || { label: item.metode_pembayaran, variant: 'cash' }
              return (
                <tr key={item.id || i} className="border-t border-[#caa179]/30 hover:bg-amber-50/50 transition-colors">
                  <td className="px-3 py-3 text-[#4a260f] font-semibold">{i + 1}</td>
                  <td className="px-3 py-3 text-[#4a260f]">
                    <div>
                      <p className="font-semibold">{item.nama_customer || item.customer_nama || '—'}</p>
                      <p className="text-xs text-[#a47352]/70">{item.nomor_order || item.nomor_po || '—'}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[#4a260f]">{formatTanggalPendek(item.tanggal_order || item.created_at)}</td>
                  <td className="px-3 py-3 text-center text-[#4a260f]">{item.jumlah_kain || item.items_count || 0}</td>
                  <td className="px-3 py-3 text-right font-semibold text-[#8b5e3c]">{formatRupiah(item.total_harga || 0)}</td>
                  {jenis !== 'order' && (
                    <td className="px-3 py-3 text-center">
                      <Badge variant={s.variant} size="sm">{s.label}</Badge>
                    </td>
                  )}
                  <td className="px-3 py-3 text-center">
                    <Badge variant={m.variant} size="sm">{m.label}</Badge>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => onLihat(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a47352] text-white text-xs font-semibold hover:bg-[#8b5e3c] transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      Lihat
                    </button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
