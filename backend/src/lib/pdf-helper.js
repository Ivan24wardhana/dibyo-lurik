// =====================================================
// PATCH untuk pdf-helper.js
// =====================================================
// Tambahkan function ini ke file:
// /backend/src/lib/pdf-helper.js
//
// Tambahkan import yang sudah ada di atas file (jangan duplikasi):
// - PDFDocument dari pdfkit
// - format helpers (formatRupiahShort, dll - lihat function existing)
//
// Lalu tambahkan function ini di bawah function lain, di atas baris export.
// Pastikan juga export function ini di bagian export.
// =====================================================

/**
 * Generate PDF laporan rekap gulungan per rak.
 * Format: A4 portrait, satu rak satu section dengan tabel di dalamnya.
 *
 * @param {Object} params
 * @param {number} params.lebar - 70 atau 110
 * @param {Array} params.groups - [{ rak_nama, items: [...], total }, ...]
 * @param {number} params.totalAll - total panjang sisa keseluruhan
 * @param {Date} params.generatedAt - waktu generate
 * @returns {Promise<Buffer>} - PDF buffer
 */
export async function generateLaporanRekapGulungan({
  lebar,
  groups,
  totalAll,
  generatedAt = new Date(),
}) {
  return new Promise((resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit')
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Laporan Rekap Gulungan ${lebar}cm`,
          Author: 'Dibyo Lurik',
        },
      })

      const buffers = []
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)

      // ===== Header =====
      doc
        .fillColor('#a47352')
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('DIBYO LURIK', { align: 'center' })

      doc
        .moveDown(0.2)
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#666666')
        .text('Sistem Manajemen Toko Kain Lurik', { align: 'center' })

      doc.moveDown(0.8)

      // Garis horizontal
      doc
        .strokeColor('#a47352')
        .lineWidth(1.5)
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .stroke()

      doc.moveDown(0.8)

      // Title laporan
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#a47352')
        .text(`Laporan Rekap Stok Gulungan - Lebar ${lebar} cm`, {
          align: 'center',
        })

      doc.moveDown(0.3)

      // Tanggal generate
      const tanggalStr = formatTanggalLong(generatedAt)
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#666666')
        .text(`Dicetak pada: ${tanggalStr}`, { align: 'center' })

      doc.moveDown(1)

      // ===== Total Keseluruhan box =====
      const totalBoxY = doc.y
      doc
        .roundedRect(40, totalBoxY, 515, 40, 6)
        .fillAndStroke('#f5e6d8', '#a47352')

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#a47352')
        .text(
          `Total Keseluruhan: ${formatMeterPDF(totalAll)}`,
          50,
          totalBoxY + 13,
          { width: 495, align: 'center' }
        )

      doc.y = totalBoxY + 50

      // ===== Empty state =====
      if (groups.length === 0) {
        doc.moveDown(2)
        doc
          .font('Helvetica')
          .fontSize(12)
          .fillColor('#999999')
          .text(`Belum ada gulungan dengan lebar ${lebar} cm`, {
            align: 'center',
          })
        doc.end()
        return
      }

      // ===== Render per Rak =====
      groups.forEach((rak, idx) => {
        // Cek apakah perlu page break (kira-kira tabel butuh 100px+ space)
        if (doc.y > 700) {
          doc.addPage()
        }

        // Section header per rak
        doc
          .moveDown(0.5)
          .font('Helvetica-Bold')
          .fontSize(14)
          .fillColor('#a47352')
          .text(`Rak ${rak.rak_nama}`, 40, doc.y)

        doc.moveDown(0.3)

        // ===== Tabel =====
        const tableTop = doc.y
        const tableLeft = 40
        const tableWidth = 515

        // Kolom (lebar dalam pt)
        const cols = {
          no: { x: tableLeft, w: 30, align: 'center' },
          kode: { x: tableLeft + 30, w: 90, align: 'left' },
          motif: { x: tableLeft + 120, w: 130, align: 'left' },
          kategori: { x: tableLeft + 250, w: 110, align: 'left' },
          pewarna: { x: tableLeft + 360, w: 70, align: 'center' },
          sisa: { x: tableLeft + 430, w: 85, align: 'right' },
        }

        // Header row
        const headerHeight = 22
        doc
          .rect(tableLeft, tableTop, tableWidth, headerHeight)
          .fill('#a47352')

        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#ffffff')

        const headerY = tableTop + 7
        doc.text('No.', cols.no.x, headerY, { width: cols.no.w, align: 'center' })
        doc.text('Kode Produk', cols.kode.x + 5, headerY, { width: cols.kode.w - 10 })
        doc.text('Motif', cols.motif.x + 5, headerY, { width: cols.motif.w - 10 })
        doc.text('Kategori', cols.kategori.x + 5, headerY, { width: cols.kategori.w - 10 })
        doc.text('Pewarna', cols.pewarna.x, headerY, { width: cols.pewarna.w, align: 'center' })
        doc.text('Panjang Sisa', cols.sisa.x, headerY, { width: cols.sisa.w - 5, align: 'right' })

        // Data rows
        let currentY = tableTop + headerHeight
        const rowHeight = 20

        rak.items.forEach((g, rowIdx) => {
          // Alternating row background
          if (rowIdx % 2 === 0) {
            doc
              .rect(tableLeft, currentY, tableWidth, rowHeight)
              .fill('#fdfaf6')
          }

          // Border bottom row
          doc
            .strokeColor('#e3c2ac')
            .lineWidth(0.5)
            .moveTo(tableLeft, currentY + rowHeight)
            .lineTo(tableLeft + tableWidth, currentY + rowHeight)
            .stroke()

          const rowY = currentY + 6
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#333333')

          // No
          doc.text(String(rowIdx + 1), cols.no.x, rowY, {
            width: cols.no.w,
            align: 'center',
          })

          // Kode produk
          const kode = g.produk?.kode_produk || '-'
          doc.text(kode, cols.kode.x + 5, rowY, {
            width: cols.kode.w - 10,
            ellipsis: true,
          })

          // Motif
          const motif = g.produk?.motif?.nama || '-'
          doc.text(motif, cols.motif.x + 5, rowY, {
            width: cols.motif.w - 10,
            ellipsis: true,
          })

          // Kategori
          const kategori = g.produk?.kategori?.nama || '-'
          doc.text(kategori, cols.kategori.x + 5, rowY, {
            width: cols.kategori.w - 10,
            ellipsis: true,
          })

          // Pewarna
          const pewarna = g.produk?.jenis_pewarna === 'sintetis' ? 'Sintetis' : 'Alami'
          doc.text(pewarna, cols.pewarna.x, rowY, {
            width: cols.pewarna.w,
            align: 'center',
          })

          // Panjang sisa
          doc.text(formatMeterPDF(g.panjang_sisa), cols.sisa.x, rowY, {
            width: cols.sisa.w - 5,
            align: 'right',
          })

          currentY += rowHeight

          // Page break check
          if (currentY > 740) {
            doc.addPage()
            currentY = 50
          }
        })

        // Outer border tabel
        doc
          .strokeColor('#a47352')
          .lineWidth(1)
          .rect(tableLeft, tableTop, tableWidth, currentY - tableTop)
          .stroke()

        // Total per rak
        doc.y = currentY + 5
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#a47352')
          .text(
            `Total Rak ${rak.rak_nama}: ${formatMeterPDF(rak.total)}`,
            tableLeft,
            doc.y,
            { width: tableWidth, align: 'right' }
          )

        doc.moveDown(1)
      })

      // ===== Footer =====
      doc.moveDown(2)
      doc
        .font('Helvetica-Oblique')
        .fontSize(8)
        .fillColor('#999999')
        .text('— Akhir Laporan —', { align: 'center' })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

// =====================================================
// HELPER (private) — kalau belum ada di pdf-helper.js
// Kalau sudah ada formatTanggalLong & formatMeterPDF di file ini,
// HAPUS bagian di bawah ini dan pakai yang sudah ada.
// =====================================================

function formatTanggalLong(date) {
  const d = date instanceof Date ? date : new Date(date)
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatMeterPDF(value) {
  const num = Number(value || 0)
  return `${num.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} m`
}