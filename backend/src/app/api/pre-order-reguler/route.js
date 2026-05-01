// =====================================================
// /api/pre-order-reguler
// GET  - list PO reguler (semua role)
// POST - create PO reguler dengan multi-item (CS/kepala_produksi)
//
// POST body format:
// {
//   nama_customer: "string",
//   kontak_customer: "string" (optional),
//   alamat_customer: "string" (optional),
//   tanggal_selesai: "YYYY-MM-DD" (optional),
//   metode_pembayaran: "cash" | "transfer",
//   status_pembayaran: "dp" | "lunas",
//   total_dp: number,
//   diskon: number (0-100),
//   catatan: "string" (optional),
//   items: [
//     {
//       produk_id: "uuid",
//       lebar: 70 | 110,
//       panjang: number,
//       jumlah: number (qty)
//     }
//   ]
// }
//
// Backend handle otomatis:
// - nomor_po (trigger)
// - harga_per_meter per item (lookup daftar_harga)
// - subtotal per item (panjang × jumlah × harga)
// - total_harga PO (sum subtotal × (1 - diskon/100))
// =====================================================

import { withAuth, withAuthAndRole } from '@/lib/api-helper'
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/response-helper'
import { PRE_ORDER_INPUT_ROLES } from '@/lib/role-helper'
import { validate, safeParseBody } from '@/lib/validation'
import {
  parsePagination,
  parseQueryParam,
  buildPaginatedData,
} from '@/lib/crud-helper'
import {
  lookupHargaPerMeter,
  calculateItemSubtotal,
  recalculateTotalPOR,
} from '@/lib/preorder-helper'
import supabaseAdmin from '@/lib/supabase-admin'

// =====================================================
// GET - list PO reguler
// Query: ?status=belum_diproses&status_pembayaran=dp&page=1
// =====================================================
export const GET = withAuth(async ({ request }) => {
  const pagination = parsePagination(request)
  const filterStatus = parseQueryParam(request, 'status')
  const filterPembayaran = parseQueryParam(request, 'status_pembayaran')

  const buildQuery = (forCount = false) => {
    let query = supabaseAdmin
      .from('pre_order_reguler')
      .select(
        forCount
          ? '*'
          : `
            id,
            nomor_po,
            nama_customer,
            kontak_customer,
            tanggal_selesai,
            status,
            metode_pembayaran,
            status_pembayaran,
            total_dp,
            diskon,
            total_harga,
            created_at,
            created_by_profile:created_by(id, username, nama)
          `,
        forCount ? { count: 'exact', head: true } : undefined
      )

    if (filterStatus) query = query.eq('status', filterStatus)
    if (filterPembayaran) query = query.eq('status_pembayaran', filterPembayaran)

    return query
  }

  const [countResult, dataResult] = await Promise.all([
    buildQuery(true),
    buildQuery(false)
      .order('created_at', { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1),
  ])

  if (dataResult.error) {
    return errorResponse(
      'Gagal memuat pre-order reguler: ' + dataResult.error.message,
      500
    )
  }

  return successResponse(
    buildPaginatedData(
      dataResult.data || [],
      countResult.count || 0,
      pagination
    )
  )
})

// =====================================================
// POST - create PO reguler dengan multi-item
// =====================================================
export const POST = withAuthAndRole(
  PRE_ORDER_INPUT_ROLES,
  async ({ request, user }) => {
    const body = await safeParseBody(request)
    if (!body) return errorResponse('Body request tidak valid', 400)

    // ===== Validasi header =====
    const errors = validate(body, {
      nama_customer: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 255,
        label: 'Nama customer',
      },
      kontak_customer: { type: 'string', maxLength: 20, label: 'Kontak' },
      alamat_customer: { type: 'string', label: 'Alamat' },
      metode_pembayaran: {
        type: 'enum',
        required: true,
        values: ['cash', 'transfer'],
        label: 'Metode pembayaran',
      },
      status_pembayaran: {
        type: 'enum',
        required: true,
        values: ['dp', 'lunas'],
        label: 'Status pembayaran',
      },
      total_dp: { type: 'number', min: 0, label: 'Total DP' },
      diskon: { type: 'number', min: 0, max: 100, label: 'Diskon' },
      catatan: { type: 'string', label: 'Catatan' },
    })
    if (errors.length) return errorResponse(errors[0], 400, { errors })

    // ===== Validasi items array =====
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return errorResponse('Items tidak boleh kosong - minimal 1 item', 400)
    }

    // Validasi setiap item
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i]
      const itemErrors = validate(item, {
        produk_id: { type: 'uuid', required: true, label: `Produk item ${i + 1}` },
        lebar: {
          type: 'enum',
          required: true,
          values: [70, 110],
          label: `Lebar item ${i + 1}`,
        },
        panjang: {
          type: 'number',
          required: true,
          min: 0.1,
          label: `Panjang item ${i + 1}`,
        },
        jumlah: {
          type: 'integer',
          required: true,
          min: 1,
          label: `Jumlah item ${i + 1}`,
        },
      })
      if (itemErrors.length) return errorResponse(itemErrors[0], 400, { errors: itemErrors })
    }

    // ===== Step 1: Insert header PO =====
    const diskon = Number(body.diskon || 0)
    const { data: poHeader, error: headerErr } = await supabaseAdmin
      .from('pre_order_reguler')
      .insert({
        created_by: user.id,
        nama_customer: body.nama_customer.trim(),
        kontak_customer: body.kontak_customer || null,
        alamat_customer: body.alamat_customer || null,
        tanggal_selesai: body.tanggal_selesai || null,
        metode_pembayaran: body.metode_pembayaran,
        status_pembayaran: body.status_pembayaran,
        total_dp: Number(body.total_dp || 0),
        diskon: diskon,
        catatan: body.catatan || null,
        total_harga: 0, // akan dihitung di step terakhir
      })
      .select()
      .single()

    if (headerErr) {
      return errorResponse(
        'Gagal menyimpan PO: ' + headerErr.message,
        500
      )
    }

    // ===== Step 2: Insert items dengan auto-fill harga =====
    const itemsToInsert = []

    for (const item of body.items) {
      // Ambil produk untuk dapat jenis_pewarna & motif_id
      const { data: produk } = await supabaseAdmin
        .from('produk')
        .select('id, jenis_pewarna, motif_id')
        .eq('id', item.produk_id)
        .maybeSingle()

      if (!produk) {
        // Rollback: delete header yang baru dibuat
        await supabaseAdmin
          .from('pre_order_reguler')
          .delete()
          .eq('id', poHeader.id)
        return notFoundResponse(`Produk tidak ditemukan: ${item.produk_id}`)
      }

      // Lookup harga
      const hargaPerMeter = await lookupHargaPerMeter(
        produk.jenis_pewarna,
        produk.motif_id,
        item.lebar
      )

      if (hargaPerMeter === 0) {
        await supabaseAdmin
          .from('pre_order_reguler')
          .delete()
          .eq('id', poHeader.id)
        return errorResponse(
          `Harga untuk ${produk.jenis_pewarna} ${item.lebar}cm belum diset di daftar_harga`,
          400
        )
      }

      // Hitung subtotal
      const subtotal = calculateItemSubtotal(
        item.panjang,
        item.jumlah,
        hargaPerMeter
      )

      itemsToInsert.push({
        pre_order_reguler_id: poHeader.id,
        produk_id: item.produk_id,
        lebar: item.lebar,
        panjang: Number(item.panjang),
        jumlah: Number(item.jumlah),
        harga_per_meter: hargaPerMeter,
        subtotal: subtotal,
      })
    }

    // Insert semua items sekaligus (lebih efisien)
    const { error: itemsErr } = await supabaseAdmin
      .from('item_pre_order_reguler')
      .insert(itemsToInsert)

    if (itemsErr) {
      // Rollback
      await supabaseAdmin.from('pre_order_reguler').delete().eq('id', poHeader.id)
      return errorResponse(
        'Gagal menyimpan items PO: ' + itemsErr.message,
        500
      )
    }

    // ===== Step 3: Hitung total_harga & update header =====
    await recalculateTotalPOR(poHeader.id)

    // ===== Step 4: Return PO lengkap =====
    const { data: poComplete } = await supabaseAdmin
      .from('pre_order_reguler')
      .select(`
        *,
        items:item_pre_order_reguler(
          id, produk_id, lebar, panjang, jumlah, harga_per_meter, subtotal,
          produk:produk_id(kode_produk, motif:motif_id(nama_motif))
        )
      `)
      .eq('id', poHeader.id)
      .single()

    return successResponse(poComplete, 'Pre-order reguler berhasil dibuat', 201)
  }
)