import { formatRupiah, formatMeter } from '../../lib/formatters'

/**
 * RekapTable
 * Tabel rekap gulungan reusable untuk 70cm dan 110cm.
 * Menampilkan kolom: No, Motif, Rak, Harga/m, Sisa Kain, Aksi (Lihat).
 */
export default function RekapTable({ data, onLihat }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#caa179]/30">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#a47352] text-white">
            <th className="px-4 py-3 text-left font-semibold w-12">No</th>
            <th className="px-4 py-3 text-left font-semibold">Motif Gulungan</th>
            <th className="px-4 py-3 text-left font-semibold">Rak</th>
            <th className="px-4 py-3 text-right font-semibold">Harga per Meter</th>
            <th className="px-4 py-3 text-right font-semibold">Sisa Kain</th>
            <th className="px-4 py-3 text-center font-semibold w-20">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-4 py-12 text-center text-sm text-[#a47352]/70 italic">
                Belum ada gulungan tersimpan
              </td>
            </tr>
          ) : (
            data.map((g, i) => (
              <tr key={g.id || i} className="border-t border-[#caa179]/30 hover:bg-amber-50/50 transition-colors">
                <td className="px-4 py-3 text-[#4a260f] font-semibold">{i + 1}</td>
                <td className="px-4 py-3 text-[#4a260f]">
                  <div>
                    <p className="font-semibold">{g.motif_nama || '—'}</p>
                    <p className="text-xs text-[#a47352]/70">#{g.nomor_gulungan || '—'}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#4a260f]">{g.rak_nama || '—'}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#8b5e3c]">{formatRupiah(g.harga_per_meter || 0)}</td>
                <td className="px-4 py-3 text-right text-[#4a260f]">{formatMeter(g.panjang_sisa || 0)}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onLihat(g)}
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
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
