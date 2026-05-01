// =====================================================
// /api/dashboard - GET
// Endpoint utama untuk Dashboard.
//
// PENDEKATAN: Memanfaatkan VIEWS yang sudah ada di schema:
//   - v_dashboard_summary  -> 4 angka summary (1 query saja!)
//   - v_produk_terlaris    -> sudah sorted DESC by terjual
//   - v_pendapatan_bulanan -> data pendapatan agregat bulanan
//
// Kenapa pakai VIEW?
//   - Logic agregasi sudah di-define di database (single source of truth)
//   - Performa lebih baik (PostgreSQL bisa optimize)
//   - Code backend jadi tipis & readable
//   - Konsisten antar endpoint yang butuh data sama
//
// Return: summary + grafikPendapatan + produkTerlaris + preOrderTerbaru
// =====================================================

import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase-admin'

export async function GET(request) {
  try {
    // ===================================================
    // 1. Validasi token Authorization
    // ===================================================
    const authHeader = request.headers.get('authorization') || ''
    const match = authHeader.match(/^Bearer\s+(.+)$/i)
    const token = match ? match[1] : null

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - silakan login ulang' },
        { status: 401 }
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
    }

    // ===================================================
    // 2. Ambil profile (untuk cek role)
    // ===================================================
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, email, role')
      .eq('id', userData.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile tidak ditemukan' }, { status: 404 })
    }

    const role = profile.role

    // ===================================================
    // 3. Query semua data parallel (Promise.all = lebih cepat)
    // ===================================================
    const [summaryData, grafikData, produkTerlarisData, preOrderData] = await Promise.all([
      getSummary(),
      // Grafik pendapatan: hanya dijalankan kalau owner.
      // Untuk role lain, return array 12 nol agar struktur tetap konsisten.
      role === 'owner' ? getGrafikPendapatan() : Promise.resolve(Array(12).fill(0)),
      getProdukTerlaris(),
      getPreOrderTerbaru(),
    ])

    return NextResponse.json({
      summary: summaryData,
      grafikPendapatan: grafikData,
      produkTerlaris: produkTerlarisData,
      preOrderTerbaru: preOrderData,
    })
  } catch (err) {
    console.error('[GET /api/dashboard] error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// QUERY HELPERS
// Setiap helper try-catch sendiri agar 1 query gagal tidak crash semua.
// =====================================================

/**
 * Summary 4 angka untuk kartu dashboard.
 *
 * Pakai VIEW v_dashboard_summary yang sudah di-define di schema.
 * View ini return 1 row saja dengan 4 kolom:
 *   produk_tersedia, produk_sold, sedang_diproses, belum_diproses
 *
 * Dibanding query manual di backend, pakai view = lebih efisien & rapi.
 */
async function getSummary() {
  try {
    const { data, error } = await supabaseAdmin
      .from('v_dashboard_summary')
      .select('*')
      .single() // view ini hanya return 1 row

    if (error) throw error

    return {
      produkTersedia: data?.produk_tersedia || 0,
      produkSold: data?.produk_sold || 0,
      poBelumDiproses: data?.belum_diproses || 0,
      poSedangDiproses: data?.sedang_diproses || 0,
    }
  } catch (err) {
    console.warn('[getSummary] error, return zero:', err.message)
    return { produkTersedia: 0, produkSold: 0, poBelumDiproses: 0, poSedangDiproses: 0 }
  }
}

/**
 * Grafik Pendapatan: array 12 angka (Jan-Dec tahun ini).
 *
 * Pakai VIEW v_pendapatan_bulanan yang sudah agregasi:
 *   - orders.total_harga
 *   - pre_order_reguler.total_harga (yang status='selesai')
 *   - pre_order_custom.total_harga (yang status='selesai')
 *
 * View return per bulan per sumber (3 row per bulan), kita sum di backend.
 */
async function getGrafikPendapatan() {
  try {
    const tahunIni = new Date().getFullYear()
    // tahun_bulan format dari view: 'YYYY-MM' (mis. '2026-04')
    const startMonth = `${tahunIni}-01`
    const endMonth = `${tahunIni}-12`

    const { data, error } = await supabaseAdmin
      .from('v_pendapatan_bulanan')
      .select('tahun_bulan, total_pendapatan')
      .gte('tahun_bulan', startMonth)
      .lte('tahun_bulan', endMonth)

    if (error) throw error

    // Inisialisasi 12 bulan dengan 0
    const monthlyTotal = Array(12).fill(0)

    if (data) {
      for (const row of data) {
        // tahun_bulan = "2026-04" -> ambil bulan (index 0-11)
        const [tahun, bulan] = row.tahun_bulan.split('-')
        const monthIndex = parseInt(bulan, 10) - 1 // "04" -> 3
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyTotal[monthIndex] += Number(row.total_pendapatan || 0)
        }
      }
    }

    return monthlyTotal
  } catch (err) {
    console.warn('[getGrafikPendapatan] error, return zeros:', err.message)
    return Array(12).fill(0)
  }
}

/**
 * Produk Terlaris: top 5 produk berdasarkan field `terjual` (DESC).
 *
 * Pakai VIEW v_produk_terlaris yang sudah:
 *   - JOIN dengan kategori, motif, rak
 *   - SORT DESC by terjual
 *
 * Schema produk TIDAK punya kolom `lebar` — lebar ada di gulungan.
 * Untuk display, kita tampilkan total terjual (meter) sebagai
 * pengganti "jumlah pesanan".
 *
 * Catatan untuk frontend: kolom "Lebar" di tabel akan diisi "-"
 * karena 1 produk bisa punya banyak gulungan dengan lebar berbeda.
 * Nanti bisa di-extend jika ingin tampilkan "70cm + 110cm" misalnya.
 */
async function getProdukTerlaris() {
  try {
    const { data, error } = await supabaseAdmin
      .from('v_produk_terlaris')
      .select('id, kode_produk, nama_kategori, nama_motif, nama_rak, jenis_pewarna, terjual, stok')
      .limit(5)

    if (error) throw error
    if (!data || data.length === 0) return []

    return data.map((p) => ({
      kode_produk: p.kode_produk || '-',
      motif: p.nama_motif || '-',
      kategori: p.nama_kategori || '-',
      // Lebar tidak ada di tabel produk (ada di gulungan).
      // Untuk sekarang tampilkan jenis_pewarna sebagai pengganti context.
      // TODO: Kalau mau lebar yang akurat, perlu sub-query ke gulungan.
      lebar: '-',
      // "Jumlah Pesanan" sekarang berarti total meter terjual.
      // (1 produk bisa terjual misalnya 30 meter total dari berbagai gulungan)
      jumlah_pesanan: Number(p.terjual || 0),
    }))
  } catch (err) {
    console.warn('[getProdukTerlaris] error, return empty:', err.message)
    return []
  }
}

/**
 * Pre-Order Terbaru: 5 pre-order paling baru.
 *
 * Gabungan dari pre_order_reguler + pre_order_custom, sorted by created_at desc.
 *
 * Untuk Qty:
 *   - Reguler: SUM(jumlah) dari item_pre_order_reguler
 *   - Custom: tidak ada items, jadi qty kita set "-" (atau 1)
 *
 * Untuk ID display: pakai nomor_po (mis. POR-20260428-001) bukan UUID.
 */
async function getPreOrderTerbaru() {
  try {
    // Step 1: Ambil 5 PO reguler terbaru + count items
    const [regResult, cusResult] = await Promise.all([
      supabaseAdmin
        .from('pre_order_reguler')
        .select(`
          id,
          nomor_po,
          nama_customer,
          status_pembayaran,
          status,
          created_at,
          items:item_pre_order_reguler(jumlah)
        `)
        .order('created_at', { ascending: false })
        .limit(5),

      supabaseAdmin
        .from('pre_order_custom')
        .select('id, nomor_po, nama_customer, status_pembayaran, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    // Map reguler: hitung total qty dari items
    const reguler = (regResult.data || []).map((row) => {
      // SUM dari semua items.jumlah (kalau tidak ada items, default 0)
      const totalQty = (row.items || []).reduce(
        (sum, item) => sum + (Number(item.jumlah) || 0),
        0
      )
      return {
        id: row.id,
        nomor_po: row.nomor_po,
        nama_customer: row.nama_customer,
        qty: totalQty,
        jenis: 'Reguler',
        status_pembayaran: row.status_pembayaran,
        status: row.status,
        created_at: row.created_at,
      }
    })

    // Map custom: qty = "-" (custom = 1 desain custom, bukan multi-item)
    const custom = (cusResult.data || []).map((row) => ({
      id: row.id,
      nomor_po: row.nomor_po,
      nama_customer: row.nama_customer,
      qty: '-', // Custom tidak punya items table
      jenis: 'Custom',
      status_pembayaran: row.status_pembayaran,
      status: row.status,
      created_at: row.created_at,
    }))

    // Gabung & ambil 5 terbaru overall
    const combined = [...reguler, ...custom]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)

    // Format untuk frontend
    return combined.map((row) => ({
      id_preorder: row.nomor_po, // tampilkan nomor_po, bukan UUID
      nama_pelanggan: row.nama_customer,
      qty: row.qty,
      jenis: row.jenis,
      status_pembayaran: mapStatusPembayaran(row.status_pembayaran),
      tanggal_pemesanan: row.created_at,
      status_order: mapStatusOrder(row.status),
    }))
  } catch (err) {
    console.warn('[getPreOrderTerbaru] error, return empty:', err.message)
    return []
  }
}

// =====================================================
// MAPPING HELPERS — konversi nilai DB ke label tampilan
// =====================================================

// Status pembayaran: 'dp' / 'lunas' (lowercase di DB) -> 'DP' / 'Lunas' (display)
function mapStatusPembayaran(value) {
  const map = { dp: 'DP', lunas: 'Lunas' }
  return map[value] || value || '-'
}

// Status order: 'belum_diproses' / 'sedang_diproses' / 'selesai' (DB)
//   -> 'Belum diproses' / 'Sedang Diproses' / 'Selesai' (display)
function mapStatusOrder(value) {
  const map = {
    belum_diproses: 'Belum diproses',
    sedang_diproses: 'Sedang Diproses',
    selesai: 'Selesai',
  }
  return map[value] || value || '-'
}