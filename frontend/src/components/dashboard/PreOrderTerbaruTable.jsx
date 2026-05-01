// =====================================================
// PreOrderTerbaruTable.jsx
// Tabel "Pre-Order Terbaru" di halaman Dashboard.
// Kolom: No, Id Pre-order, Nama Pelanggan, Qty, Jenis Pre-Order (badge),
//        Status Pembayaran (badge kecil), Tanggal Pemesanan, Status (text warna)
//
// CATATAN PENTING tentang data dari backend:
// - `id_preorder` sekarang berisi nomor_po lengkap (mis. "POR-20260428-001")
//   Jadi JANGAN tambah prefix "ID" lagi — sudah punya prefix POR/POC sendiri.
// - `qty` bisa number (dari SUM items reguler) atau '-' (untuk Custom).
//
// Status text warna:
// - "Belum diproses" → merah
// - "Sedang Diproses" → hijau
// - "Selesai" → biru
// =====================================================

import Badge from '../ui/Badge'
import { STATUS_ORDER_TEXT_COLOR } from '../../lib/constants'
import { formatTanggalID } from '../../lib/formatCurrency'

/**
 * Props:
 * - data: array of object dengan field:
 *   { id_preorder (string POR-/POC- ...),
 *     nama_pelanggan, qty (number or '-'),
 *     jenis ('Custom'|'Reguler'),
 *     status_pembayaran ('DP'|'Lunas'),
 *     tanggal_pemesanan (string ISO),
 *     status_order ('Belum diproses'|'Sedang Diproses'|'Selesai') }
 */
export default function PreOrderTerbaruTable({ data = [] }) {
  return (
    <div
      className="rounded-[10px] border border-[#5b2400] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] overflow-hidden"
      style={{ backgroundColor: '#e3c2ac' }}
    >
      {/* Judul section */}
      <h3 className="text-[#a47352] text-[22px] font-medium px-6 pt-5 pb-3">
        Pre-Order Terbaru
      </h3>

      {/* Tabel (overflow-x-auto supaya bisa di-scroll horizontal di layar kecil) */}
      <div className="px-3 pb-3 overflow-x-auto">
        <table className="w-full border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-[#a47352] text-white">
              <th className="text-left px-3 py-3 text-[15px] font-medium w-[50px]">
                No
              </th>
              <th className="text-left px-3 py-3 text-[15px] font-medium">
                Id Pre-order
              </th>
              <th className="text-left px-3 py-3 text-[15px] font-medium">
                Nama Pelanggan
              </th>
              <th className="text-center px-3 py-3 text-[15px] font-medium w-[60px]">
                Qty
              </th>
              <th className="text-center px-3 py-3 text-[15px] font-medium">
                Jenis Pre-Order
              </th>
              <th className="text-center px-3 py-3 text-[15px] font-medium">
                Status Pembayaran
              </th>
              <th className="text-center px-3 py-3 text-[15px] font-medium">
                Tanggal Pemesanan
              </th>
              <th className="text-center px-3 py-3 text-[15px] font-medium">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr className="bg-white">
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Belum ada pre-order
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                // Resolve warna status dari mapping
                const statusColor =
                  STATUS_ORDER_TEXT_COLOR[row.status_order] ||
                  'rgba(0, 0, 0, 0.6)'

                return (
                  <tr
                    key={row.id_preorder || idx}
                    className="bg-white border-b border-gray-100 last:border-0"
                  >
                    <td className="px-3 py-3 text-[15px] text-black">
                      {idx + 1}.
                    </td>
                    {/*
                      Tampilkan nomor_po langsung (mis. "POR-20260428-001").
                      Sebelumnya pakai "ID {row.id_preorder}" → jadi
                      "ID POR-20260428-001" (double prefix, jelek).
                    */}
                    <td className="px-3 py-3 text-[15px] text-black font-medium">
                      {row.id_preorder || '-'}
                    </td>
                    <td className="px-3 py-3 text-[15px] text-black">
                      {row.nama_pelanggan || '-'}
                    </td>
                    <td className="px-3 py-3 text-center text-[15px] text-black">
                      {/*
                        Qty bisa number (Reguler) atau '-' (Custom).
                        Render apa adanya — kalau '-', tampil dash.
                      */}
                      {row.qty !== null && row.qty !== undefined ? row.qty : '-'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant="jenis" value={row.jenis} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge
                        variant="pembayaran"
                        value={row.status_pembayaran}
                        size="sm"
                      />
                    </td>
                    <td className="px-3 py-3 text-center text-[15px] text-black">
                      {formatTanggalID(row.tanggal_pemesanan)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className="text-[15px] font-semibold"
                        style={{ color: statusColor }}
                      >
                        {row.status_order}
                      </span>
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