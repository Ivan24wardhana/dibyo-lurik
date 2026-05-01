// =====================================================
// pdf-helper.js
// Helper untuk generate PDF (struk & laporan) dengan pdfkit.
//
// Pattern: function-function di sini return Buffer (bytes PDF).
// Endpoint tinggal kirim Buffer sebagai response dengan
// Content-Type: application/pdf.
// =====================================================

import PDFDocument from 'pdfkit'

// =====================================================
// HELPER UMUM
// =====================================================

/**
 * Format angka ke Rupiah Indonesia
 * Contoh: 50000 → "Rp 50.000,00"
 */
function formatRp(value) {
  if (value == null || isNaN(value)) return 'Rp 0,00'
  return (
    'Rp ' +
    new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value))
  )
}

/**
 * Format tanggal ke Indonesia: "28 April 2026, 14:30"
 */
function formatDateID(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date.getTime())) return '-'

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]

  const dd = String(date.getDate()).padStart(2, '0')
  const mm = months[date.getMonth()]
  const yyyy = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, '0')
  const mn = String(date.getMinutes()).padStart(2, '0')

  return `${dd} ${mm} ${yyyy}, ${hh}:${mn}`
}

/**
 * Format tanggal singkat: "28-04-2026"
 */
function formatDateShort(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (isNaN(date.getTime())) return '-'

  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

/**
 * Konversi PDFDocument ke Buffer
 * pdfkit pakai stream — perlu wrap dengan Promise supaya bisa await
 */
function pdfToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}

// =====================================================
// 1. STRUK ORDER
// =====================================================
/**
 * Generate PDF struk untuk 1 order
 *
 * Layout:
 *   ┌────────────────────────────────┐
 *   │       DIBYO LURIK              │  (header)
 *   │  Toko Kain Lurik Tradisional   │
 *   │      ─────────────────         │
 *   │  No: ORD-20260428-001          │  (info order)
 *   │  Tgl: 28 April 2026, 14:30     │
 *   │  Kasir: cs                     │
 *   │      ─────────────────         │
 *   │  Item             Qty  Subtotal│  (items)
 *   │  Lurik 110cm      5m   287.500 │
 *   │  Selendang 70cm   3m   115.500 │
 *   │      ─────────────────         │
 *   │  Subtotal:           403.000   │
 *   │  Diskon (10%):       (40.300)  │
 *   │  Total:              362.700   │
 *   │      ─────────────────         │
 *   │  Metode: Cash                  │
 *   │      ─────────────────         │
 *   │  Terima kasih atas kunjungan!  │
 *   └────────────────────────────────┘
 *
 * @param {object} order - Data order lengkap (header + items + relasi)
 * @returns {Promise<Buffer>}
 */
export async function generateStrukPDF(order) {
  // Ukuran struk thermal 80mm = ~226 points (1mm = 2.83pt)
  // Pakai size custom supaya kelihatan kayak struk asli
  const doc = new PDFDocument({
    size: [226, 600], // width 80mm, height auto-extend
    margins: { top: 10, bottom: 10, left: 10, right: 10 },
  })

  // ===== Header =====
  doc.fontSize(14).font('Helvetica-Bold').text('DIBYO LURIK', { align: 'center' })
  doc.fontSize(8).font('Helvetica').text('Toko Kain Lurik Tradisional', { align: 'center' })
  doc.moveDown(0.5)
  doc.text('────────────────────────', { align: 'center' })
  doc.moveDown(0.3)

  // ===== Info Order =====
  doc.fontSize(8).font('Helvetica')
  doc.text(`No: ${order.nomor_order || '-'}`)
  doc.text(`Tgl: ${formatDateID(order.tanggal_order)}`)
  doc.text(`Kasir: ${order.kasir?.username || order.kasir?.nama || '-'}`)
  doc.moveDown(0.3)
  doc.text('────────────────────────', { align: 'center' })
  doc.moveDown(0.3)

  // ===== Items =====
  // Header tabel sederhana
  doc.font('Helvetica-Bold').fontSize(8)
  const colItem = 10
  const colQty = 130
  const colSubtotal = 165

  doc.text('Item', colItem, doc.y, { continued: false })
  // Karena pdfkit text positioning agak tricky, kita pakai pendekatan list

  doc.font('Helvetica').fontSize(7)

  const items = order.items || []
  for (const item of items) {
    const produkInfo = item.gulungan?.produk || {}
    const motif = produkInfo.motif?.nama_motif || '-'
    const kode = produkInfo.kode_produk || '-'
    const lebar = item.gulungan?.lebar || '-'
    const qty = `${Number(item.jumlah_order)}m`
    const subtotal = formatRp(item.subtotal)

    // Baris 1: nama item
    doc.text(`${motif} (${kode})`, { continued: false })
    // Baris 2: detail qty + subtotal
    doc.text(`  ${lebar}cm x ${qty}`, { continued: true })
    doc.text(`  ${subtotal}`, { align: 'right' })
    doc.moveDown(0.2)
  }

  doc.moveDown(0.3)
  doc.text('────────────────────────', { align: 'center' })
  doc.moveDown(0.3)

  // ===== Total =====
  // Hitung subtotal dari items (sebelum diskon)
  const subtotalAll = items.reduce(
    (sum, i) => sum + Number(i.subtotal || 0),
    0
  )
  const diskon = Number(order.diskon || 0)
  const diskonAmount = (subtotalAll * diskon) / 100
  const total = subtotalAll - diskonAmount

  doc.font('Helvetica').fontSize(8)
  doc.text(`Subtotal:`, { continued: true })
  doc.text(`  ${formatRp(subtotalAll)}`, { align: 'right' })

  if (diskon > 0) {
    doc.text(`Diskon (${diskon}%):`, { continued: true })
    doc.text(`  -${formatRp(diskonAmount)}`, { align: 'right' })
  }

  doc.font('Helvetica-Bold')
  doc.text(`TOTAL:`, { continued: true })
  doc.text(`  ${formatRp(total)}`, { align: 'right' })
  doc.moveDown(0.3)

  doc.font('Helvetica').fontSize(8)
  doc.text('────────────────────────', { align: 'center' })
  doc.text(`Metode: ${(order.metode_pembayaran || 'cash').toUpperCase()}`)
  doc.moveDown(0.3)
  doc.text('────────────────────────', { align: 'center' })
  doc.moveDown(0.3)

  // ===== Footer =====
  doc.font('Helvetica-Oblique').fontSize(8)
  doc.text('Terima kasih atas kunjungan Anda!', { align: 'center' })
  doc.moveDown(0.2)
  doc.text('Barang yang sudah dibeli tidak', { align: 'center' })
  doc.text('dapat ditukar/dikembalikan.', { align: 'center' })

  return pdfToBuffer(doc)
}

// =====================================================
// 2. LAPORAN ORDER (A4)
// =====================================================
/**
 * Generate PDF laporan list order (A4 portrait, dengan tabel)
 */
export async function generateLaporanOrders(orders, options = {}) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 })

  // ===== Header =====
  doc.fontSize(18).font('Helvetica-Bold').text('LAPORAN ORDER', { align: 'center' })
  doc.fontSize(10).font('Helvetica').text('Dibyo Lurik - Toko Kain Lurik', { align: 'center' })

  if (options.dateRange) {
    doc.fontSize(9).text(`Periode: ${options.dateRange}`, { align: 'center' })
  }
  doc.text(`Generated: ${formatDateID(new Date())}`, { align: 'center' })
  doc.moveDown(1)

  // ===== Tabel =====
  doc.fontSize(10).font('Helvetica-Bold')

  const startX = 40
  const startY = doc.y
  const colWidths = [25, 110, 90, 60, 70, 90, 70] // No, No.Order, Tanggal, Items, Diskon, Total, Bayar
  const headers = ['No', 'No. Order', 'Tanggal', 'Item', 'Diskon', 'Total', 'Bayar']

  // Draw header row
  doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), 20).fillAndStroke('#a47352', '#a47352')
  doc.fillColor('white')

  let xPos = startX
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], xPos + 4, startY + 6, { width: colWidths[i] - 8, align: 'left' })
    xPos += colWidths[i]
  }

  doc.fillColor('black').font('Helvetica').fontSize(9)

  let yPos = startY + 22
  let totalSemua = 0

  orders.forEach((order, idx) => {
    // New page kalau hampir mentok
    if (yPos > 750) {
      doc.addPage()
      yPos = 40
    }

    const itemCount = order.items?.length || 0
    const total = Number(order.total_harga || 0)
    totalSemua += total

    const row = [
      String(idx + 1),
      order.nomor_order || '-',
      formatDateShort(order.tanggal_order),
      `${itemCount} item`,
      `${Number(order.diskon || 0)}%`,
      formatRp(total),
      (order.metode_pembayaran || '-').toUpperCase(),
    ]

    let xRow = startX
    for (let i = 0; i < row.length; i++) {
      doc.text(row[i], xRow + 4, yPos + 4, { width: colWidths[i] - 8, align: 'left' })
      xRow += colWidths[i]
    }

    // Garis bawah row
    doc.moveTo(startX, yPos + 18).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), yPos + 18)
      .strokeColor('#cccccc').stroke().strokeColor('black')

    yPos += 20
  })

  // ===== Total =====
  doc.moveDown(2)
  doc.fontSize(11).font('Helvetica-Bold')
  doc.text(`Total Order: ${orders.length}`, startX, yPos + 20)
  doc.text(`Total Pendapatan: ${formatRp(totalSemua)}`, startX, yPos + 35)

  return pdfToBuffer(doc)
}

// =====================================================
// 3. LAPORAN PRE-ORDER REGULER
// =====================================================
export async function generateLaporanPOReguler(poList, options = {}) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 })

  doc.fontSize(18).font('Helvetica-Bold').text('LAPORAN PRE-ORDER REGULER', { align: 'center' })
  doc.fontSize(10).font('Helvetica').text('Dibyo Lurik - Toko Kain Lurik', { align: 'center' })
  if (options.dateRange) {
    doc.fontSize(9).text(`Periode: ${options.dateRange}`, { align: 'center' })
  }
  doc.text(`Generated: ${formatDateID(new Date())}`, { align: 'center' })
  doc.moveDown(1)

  doc.fontSize(10).font('Helvetica-Bold')

  const startX = 40
  let yPos = doc.y
  const colWidths = [25, 90, 100, 60, 75, 80, 85] // No, No.PO, Customer, Status, Pembayaran, Total, Tanggal
  const headers = ['No', 'No. PO', 'Customer', 'Status', 'Pembayaran', 'Total', 'Tanggal']

  doc.rect(startX, yPos, colWidths.reduce((a, b) => a + b, 0), 20).fillAndStroke('#a47352', '#a47352')
  doc.fillColor('white')

  let xPos = startX
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], xPos + 4, yPos + 6, { width: colWidths[i] - 8 })
    xPos += colWidths[i]
  }

  doc.fillColor('black').font('Helvetica').fontSize(8)
  yPos += 22
  let totalSemua = 0

  poList.forEach((po, idx) => {
    if (yPos > 750) {
      doc.addPage()
      yPos = 40
    }

    const total = Number(po.total_harga || 0)
    totalSemua += total

    const row = [
      String(idx + 1),
      po.nomor_po || '-',
      po.nama_customer || '-',
      (po.status || '-').replace('_', ' '),
      (po.status_pembayaran || '-').toUpperCase(),
      formatRp(total),
      formatDateShort(po.created_at),
    ]

    let xRow = startX
    for (let i = 0; i < row.length; i++) {
      doc.text(row[i], xRow + 4, yPos + 4, { width: colWidths[i] - 8 })
      xRow += colWidths[i]
    }

    doc.moveTo(startX, yPos + 18).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), yPos + 18)
      .strokeColor('#cccccc').stroke().strokeColor('black')

    yPos += 20
  })

  doc.moveDown(2)
  doc.fontSize(11).font('Helvetica-Bold')
  doc.text(`Total PO Reguler: ${poList.length}`, startX, yPos + 20)
  doc.text(`Total Nilai: ${formatRp(totalSemua)}`, startX, yPos + 35)

  return pdfToBuffer(doc)
}

// =====================================================
// 4. LAPORAN PRE-ORDER CUSTOM
// =====================================================
export async function generateLaporanPOCustom(poList, options = {}) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 })

  doc.fontSize(18).font('Helvetica-Bold').text('LAPORAN PRE-ORDER CUSTOM', { align: 'center' })
  doc.fontSize(10).font('Helvetica').text('Dibyo Lurik - Toko Kain Lurik', { align: 'center' })
  if (options.dateRange) {
    doc.fontSize(9).text(`Periode: ${options.dateRange}`, { align: 'center' })
  }
  doc.text(`Generated: ${formatDateID(new Date())}`, { align: 'center' })
  doc.moveDown(1)

  doc.fontSize(10).font('Helvetica-Bold')

  const startX = 40
  let yPos = doc.y
  const colWidths = [25, 90, 100, 60, 75, 80, 85]
  const headers = ['No', 'No. PO', 'Customer', 'Status', 'Pembayaran', 'Total', 'Tanggal']

  doc.rect(startX, yPos, colWidths.reduce((a, b) => a + b, 0), 20).fillAndStroke('#a47352', '#a47352')
  doc.fillColor('white')

  let xPos = startX
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], xPos + 4, yPos + 6, { width: colWidths[i] - 8 })
    xPos += colWidths[i]
  }

  doc.fillColor('black').font('Helvetica').fontSize(8)
  yPos += 22
  let totalSemua = 0

  poList.forEach((po, idx) => {
    if (yPos > 750) {
      doc.addPage()
      yPos = 40
    }

    const total = Number(po.total_harga || 0)
    totalSemua += total

    const row = [
      String(idx + 1),
      po.nomor_po || '-',
      po.nama_customer || '-',
      (po.status || '-').replace('_', ' '),
      (po.status_pembayaran || '-').toUpperCase(),
      formatRp(total),
      formatDateShort(po.created_at),
    ]

    let xRow = startX
    for (let i = 0; i < row.length; i++) {
      doc.text(row[i], xRow + 4, yPos + 4, { width: colWidths[i] - 8 })
      xRow += colWidths[i]
    }

    doc.moveTo(startX, yPos + 18).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), yPos + 18)
      .strokeColor('#cccccc').stroke().strokeColor('black')

    yPos += 20
  })

  doc.moveDown(2)
  doc.fontSize(11).font('Helvetica-Bold')
  doc.text(`Total PO Custom: ${poList.length}`, startX, yPos + 20)
  doc.text(`Total Nilai: ${formatRp(totalSemua)}`, startX, yPos + 35)

  return pdfToBuffer(doc)
}

// Export helpers untuk dipakai di endpoint
export { formatRp, formatDateID, formatDateShort, pdfToBuffer }