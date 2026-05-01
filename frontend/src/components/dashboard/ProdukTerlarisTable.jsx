// =====================================================
// ProdukTerlarisTable.jsx
// Tabel "Produk Terlaris" di halaman Dashboard.
// Kolom: No, Kode Produk, Motif, Katagori, Lebar (badge), Jumlah Pesanan
//
// Container: background #e3c2ac, border #5b2400 + shadow.
// Header tabel: background #a47352, teks putih.
// Row tabel: background putih.
//
// CATATAN PENTING tentang data dari backend:
// - `lebar` saat ini diisi '-' karena schema produk tidak punya kolom lebar
//   (lebar ada di tabel gulungan/item_pre_order_reguler).
//   Kalau dapat '-', kita render text biasa, BUKAN badge biru.
// - `jumlah_pesanan` = total meter terjual (dari kolom `terjual` di DB).
//   Bisa decimal (mis. 30.5), kita format pakai locale ID.
// =====================================================

import Badge from '../ui/Badge'

/**
 * Helper: format angka meter ke string ID
 * 30 → "30"
 * 30.5 → "30,5"
 * Pakai locale id-ID supaya pemisah desimal pakai koma (sesuai standar Indonesia).
 */
function formatMeter(value) {
  if (value == null || value === '-') return '-'
  const num = Number(value)
  if (isNaN(num)) return '-'
  // Hilangkan trailing .00 untuk angka bulat (30.00 → 30)
  // tapi tetap tampilkan desimal kalau ada (30.5 → 30,5)
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Props:
 * - data: array of object dengan field:
 *   { kode_produk, motif, kategori, lebar, jumlah_pesanan }
 *
 *   `lebar` bisa berupa:
 *     - "110 cm" / "70 cm" → render Badge biru/ungu
 *     - "-" → render dash biasa (no badge)
 *
 *   `jumlah_pesanan` = number (total meter terjual)
 */
export default function ProdukTerlarisTable({ data = [] }) {
  return (
    <div
      className="rounded-[10px] border border-[#5b2400] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] overflow-hidden"
      style={{ backgroundColor: '#e3c2ac' }}
    >
      {/* Judul section */}
      <h3 className="text-[#a47352] text-[22px] font-medium px-6 pt-5 pb-3">
        Produk Terlaris
      </h3>

      {/* Tabel */}
      <div className="px-3 pb-3">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead>
            <tr className="bg-[#a47352] text-white">
              <th className="text-left px-4 py-3 text-[16px] font-medium w-[60px]">
                No
              </th>
              <th className="text-left px-4 py-3 text-[16px] font-medium">
                Kode Produk
              </th>
              <th className="text-left px-4 py-3 text-[16px] font-medium">
                Motif
              </th>
              <th className="text-left px-4 py-3 text-[16px] font-medium">
                Katagori
              </th>
              <th className="text-center px-4 py-3 text-[16px] font-medium">
                Lebar
              </th>
              <th className="text-center px-4 py-3 text-[16px] font-medium">
                Jumlah Terjual
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.length === 0 ? (
              <tr className="bg-white">
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Belum ada data produk terlaris
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                // Cek apakah lebar valid (ada angka) atau "-" (tidak ada data)
                const lebarValid = row.lebar && row.lebar !== '-'

                return (
                  <tr
                    key={row.kode_produk || idx}
                    className="bg-white border-b border-gray-100 last:border-0"
                  >
                    <td className="px-4 py-3 text-[15px] text-black">
                      {idx + 1}.
                    </td>
                    <td className="px-4 py-3 text-[15px] text-black font-medium">
                      {row.kode_produk}
                    </td>
                    <td className="px-4 py-3 text-[15px] text-black">
                      {row.motif}
                    </td>
                    <td className="px-4 py-3 text-[15px] text-black">
                      {row.kategori}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {lebarValid ? (
                        // Lebar valid: render badge sesuai aturan warna
                        <Badge variant="lebar" value={row.lebar} />
                      ) : (
                        // Lebar tidak ada: render dash biasa, jangan badge
                        <span className="text-[15px] text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-[15px] text-black">
                      {/*
                        Format angka + tambah satuan "m" (meter) supaya jelas.
                        Misal: "30 m" atau "30,5 m".
                      */}
                      {formatMeter(row.jumlah_pesanan)} m
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}