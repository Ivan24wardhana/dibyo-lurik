// =====================================================
// /api/orders
// GET  - list orders (semua role)
// POST - checkout (multi-item) - HANYA customer_service
//
// POST body:
// {
//   metode_pembayaran: "cash" | "transfer",
//   diskon: 0-100 (optional),
//   items: [
//     {
//       gulungan_id: "uuid",
//       jumlah_order: number (meter yang dipotong)
//     }
//   ]
// }
//
// Backend handle:
// - nomor_order (auto via trigger)
// - validasi setiap gulungan: aktif & punya panjang_sisa cukup
// - lookup harga_per_meter dari gulungan (snapshot)
// - hitung subtotal & total_harga
// - INSERT item_order → trigger DB potong panjang_sisa & set is_active
// - trigger DB juga update produk.stok & produk.terjual
//
// Catatan transaksi:
// - Kalau ada item gagal di tengah, header di-rollback (delete).
// - Stok yang sudah keburu dipotong oleh trigger akan otomatis
//   ter-revert karena CASCADE delete dari orders → item_order.
//   TAPI: trigger cuma kurangi panjang_sisa, tidak nambah balik
//   saat delete. Untuk safety, kita validasi STOK SEMUA ITEM DULU
//   sebelum INSERT apapun.
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/response-helper'
import { ORDER_INPUT_ROLES } from '@/lib/role-helper'
import { validate, safeParseBody } from '@/lib/validation'
import {
  parsePagination,
  parseQueryParam,
  buildPaginatedData,
} from '@/lib/crud-helper'
import supabaseAdmin from '@/lib/supabase-admin'

// =====================================================
// GET - list orders
// =====================================================
export const GET = withAuth(async ({ request }) => {
  const pagination = parsePagination(request)
  const filterMetode = parseQueryParam(request, 'metode_pembayaran')

  const buildQuery = (forCount = false) => {
    let query = supabaseAdmin
      .from('orders')
      .select(
        forCount
          ? '*'
          : `
            id,
            nomor_order,
            tanggal_order,
            metode_pembayaran,
            diskon,
            total_harga,
            created_at,
            kasir:user_id(id, username, nama)
          `,
        forCount ? { count: 'exact', head: true } : undefined
      )

    if (filterMetode) query = query.eq('metode_pembayaran', filterMetode)

    return query
  }

  const [countResult, dataResult] = await Promise.all([
    buildQuery(true),
    buildQuery(false)
      .order('tanggal_order', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1),
  ])

  if (dataResult.error) {
    return errorResponse('Gagal memuat orders: ' + dataResult.error.message, 500)
  }

  return successResponse(
    buildPaginatedData(dataResult.data || [], countResult.count || 0, pagination)
  )
})

// =====================================================
// POST - checkout (multi-item)
// =====================================================
export const POST = withAuthAndRole(ORDER_INPUT_ROLES, async ({ request, user }) => {
  const body = await safeParseBody(request)
  if (!body) return errorResponse('Body request tidak valid', 400)

  // ===== Validasi header =====
  const errors = validate(body, {
    metode_pembayaran: {
      type: 'enum',
      required: true,
      values: ['cash', 'transfer'],
      label: 'Metode pembayaran',
    },
    diskon: { type: 'number', min: 0, max: 100, label: 'Diskon' },
  })
  if (errors.length) return errorResponse(errors[0], 400, { errors })

  // ===== Validasi items =====
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return errorResponse('Items tidak boleh kosong - minimal 1 item', 400)
  }

  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i]
    const itemErrors = validate(item, {
      gulungan_id: { type: 'uuid', required: true, label: `Gulungan item ${i + 1}` },
      jumlah_order: {
        type: 'number',
        required: true,
        min: 0.1,
        label: `Jumlah item ${i + 1}`,
      },
    })
    if (itemErrors.length) return errorResponse(itemErrors[0], 400, { errors: itemErrors })
  }

  // ===== Step 1: Validasi semua gulungan SEBELUM insert =====
  const gulunganIds = body.items.map((i) => i.gulungan_id)

  const { data: gulunganList, error: glErr } = await supabaseAdmin
    .from('gulungan')
    .select('id, panjang_sisa, harga_per_meter, is_active')
    .in('id', gulunganIds)

  if (glErr) {
    return errorResponse('Gagal validasi gulungan: ' + glErr.message, 500)
  }

  if (!gulunganList || gulunganList.length !== body.items.length) {
    return notFoundResponse('Salah satu gulungan tidak ditemukan')
  }

  // Map untuk lookup cepat
  const gulunganMap = {}
  for (const g of gulunganList) gulunganMap[g.id] = g

  // Cek setiap item: gulungan masih aktif & panjang_sisa cukup
  let totalSubtotal = 0
  const itemsToInsert = []

  for (const item of body.items) {
    const g = gulunganMap[item.gulungan_id]

    if (!g.is_active) {
      return errorResponse(
        `Gulungan ${item.gulungan_id} sudah tidak aktif (habis)`,
        400
      )
    }

    const jumlahOrder = Number(item.jumlah_order)
    const panjangSisa = Number(g.panjang_sisa)

    if (jumlahOrder > panjangSisa) {
      return errorResponse(
        `Gulungan tidak cukup. Sisa: ${panjangSisa}m, diminta: ${jumlahOrder}m`,
        400
      )
    }

    const hargaPerMeter = Number(g.harga_per_meter)
    const subtotal = jumlahOrder * hargaPerMeter
    totalSubtotal += subtotal

    itemsToInsert.push({
      gulungan_id: item.gulungan_id,
      jumlah_order: jumlahOrder,
      harga_per_meter: hargaPerMeter,
      subtotal: subtotal,
    })
  }

  // ===== Step 2: Hitung total dengan diskon =====
  const diskon = Number(body.diskon || 0)
  const totalHarga = totalSubtotal * (1 - diskon / 100)

  // ===== Step 3: Insert header order =====
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: user.id,
      metode_pembayaran: body.metode_pembayaran,
      diskon: diskon,
      total_harga: totalHarga,
    })
    .select()
    .single()

  if (orderErr) {
    return errorResponse('Gagal membuat order: ' + orderErr.message, 500)
  }

  // ===== Step 4: Insert items =====
  // Trigger DB akan auto:
  //   - Potong gulungan.panjang_sisa
  //   - Set gulungan.is_active = FALSE kalau habis
  //   - Update produk.stok & produk.terjual
  const itemsWithOrderId = itemsToInsert.map((item) => ({
    ...item,
    order_id: order.id,
  }))

  const { error: itemsErr } = await supabaseAdmin
    .from('item_order')
    .insert(itemsWithOrderId)

  if (itemsErr) {
    // Rollback: delete order (cascade ke item_order yang mungkin sudah masuk)
    await supabaseAdmin.from('orders').delete().eq('id', order.id)
    return errorResponse('Gagal menyimpan items: ' + itemsErr.message, 500)
  }

  // ===== Step 5: Return order lengkap =====
  const { data: orderComplete } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      kasir:user_id(id, username, nama),
      items:item_order(
        id, jumlah_order, harga_per_meter, subtotal,
        gulungan:gulungan_id(
          id, nomor_gulungan, lebar, panjang_sisa,
          produk:produk_id(
            id, kode_produk, gambar_url, jenis_pewarna,
            motif:motif_id(nama_motif),
            kategori:kategori_id(nama_kategori)
          )
        )
      )
    `)
    .eq('id', order.id)
    .single()

  return successResponse(orderComplete, 'Order berhasil dibuat', 201)
})