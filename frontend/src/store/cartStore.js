// =====================================================
// cartStore.js
// Zustand store untuk Keranjang (CS order flow).
//
// Cart structure:
//   items: [
//     {
//       id: 'cart-uuid',          // unique cart item id (frontend only)
//       produk: { id, kode_produk, gambar_url, motif, kategori, jenis_pewarna, rak },
//       gulungan_selections: [
//         {
//           gulungan_id, nomor_gulungan, lebar,
//           panjang_sisa,            // stok asli (untuk validasi max input)
//           harga_per_meter,
//           jumlah_order             // ← user input di Keranjang (default: 0)
//         }
//       ]
//     }
//   ]
//
// Flow:
//   1. User klik "Beli" di OrderPage
//      → popup pilih gulungan
//      → user centang 1+ gulungan
//      → klik "Tambah ke Keranjang"
//      → addItem(produk, [gulungan1, gulungan2])
//
//   2. Di KeranjangPage user input jumlah_order per gulungan
//      → updateJumlahOrder(cartItemId, gulunganId, jumlah)
//
//   3. Klik Checkout
//      → flatten ke format API: items.flatMap(g => ({ gulungan_id, jumlah_order }))
//      → POST /api/orders
//      → clearCart()
//
// Persist:
//   Pakai zustand/middleware/persist supaya cart survive refresh browser.
// =====================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // ===== Add new cart item =====
      // produk: { id, kode_produk, gambar_url, motif, kategori, jenis_pewarna, rak }
      // gulunganList: [{ id, nomor_gulungan, lebar, panjang_sisa, harga_per_meter }]
      addItem: (produk, gulunganList) => {
        if (!produk?.id || !Array.isArray(gulunganList) || gulunganList.length === 0) {
          return null
        }

        const cartItemId = `cart-${produk.id}-${Date.now()}`
        const newItem = {
          id: cartItemId,
          produk: {
            id: produk.id,
            kode_produk: produk.kode_produk,
            gambar_url: produk.gambar_url || null,
            motif: produk.motif || null,
            kategori: produk.kategori || null,
            jenis_pewarna: produk.jenis_pewarna,
            rak: produk.rak || null,
          },
          gulungan_selections: gulunganList.map((g) => ({
            gulungan_id: g.id,
            nomor_gulungan: g.nomor_gulungan,
            lebar: g.lebar,
            panjang_sisa: parseFloat(g.panjang_sisa) || 0,
            harga_per_meter: parseFloat(g.harga_per_meter) || 0,
            jumlah_order: 0,  // user input di Keranjang
          })),
        }

        set((state) => ({ items: [...state.items, newItem] }))
        return cartItemId
      },

      // ===== Update jumlah_order untuk 1 gulungan di cart item =====
      updateJumlahOrder: (cartItemId, gulunganId, jumlah) => {
        const num = parseFloat(jumlah) || 0
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== cartItemId) return item
            return {
              ...item,
              gulungan_selections: item.gulungan_selections.map((g) =>
                g.gulungan_id === gulunganId
                  ? { ...g, jumlah_order: num }
                  : g
              ),
            }
          }),
        }))
      },

      // ===== Hapus 1 gulungan dari cart item =====
      // Kalau gulungan terakhir → hapus cart item juga
      removeGulunganFromItem: (cartItemId, gulunganId) => {
        set((state) => {
          const newItems = []
          for (const item of state.items) {
            if (item.id !== cartItemId) {
              newItems.push(item)
              continue
            }
            const remaining = item.gulungan_selections.filter(
              (g) => g.gulungan_id !== gulunganId
            )
            if (remaining.length > 0) {
              newItems.push({ ...item, gulungan_selections: remaining })
            }
            // kalau remaining kosong, jangan push (auto-hapus cart item)
          }
          return { items: newItems }
        })
      },

      // ===== Hapus seluruh cart item =====
      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        }))
      },

      // ===== Clear cart (setelah checkout sukses) =====
      clearCart: () => set({ items: [] }),

      // ===== Total semua gulungan di seluruh cart =====
      getTotalGulungan: () => {
        return get().items.reduce(
          (sum, item) => sum + item.gulungan_selections.length,
          0
        )
      },

      // ===== Hitung subtotal total semua items =====
      // subtotal = sum(jumlah_order * harga_per_meter) untuk semua gulungan
      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const itemSum = item.gulungan_selections.reduce(
            (s, g) => s + (g.jumlah_order || 0) * (g.harga_per_meter || 0),
            0
          )
          return sum + itemSum
        }, 0)
      },

      // ===== Cek apakah cart valid untuk checkout =====
      // Valid kalau setiap gulungan punya jumlah_order > 0 dan <= panjang_sisa
      validateCart: () => {
        const items = get().items
        if (items.length === 0) {
          return { valid: false, error: 'Keranjang kosong' }
        }

        for (const item of items) {
          for (const g of item.gulungan_selections) {
            if (!g.jumlah_order || g.jumlah_order <= 0) {
              return {
                valid: false,
                error: `Isi panjang untuk Gulungan #${g.nomor_gulungan} (${item.produk.kode_produk})`,
              }
            }
            if (g.jumlah_order > g.panjang_sisa) {
              return {
                valid: false,
                error: `Gulungan #${g.nomor_gulungan} (${item.produk.kode_produk}) maksimal ${g.panjang_sisa}m`,
              }
            }
          }
        }
        return { valid: true }
      },

      // ===== Flatten ke format API untuk POST /api/orders =====
      // Output: [{ gulungan_id, jumlah_order }, ...]
      flattenForCheckout: () => {
        return get().items.flatMap((item) =>
          item.gulungan_selections.map((g) => ({
            gulungan_id: g.gulungan_id,
            jumlah_order: g.jumlah_order,
          }))
        )
      },

      // ===== Cek apakah produk + gulungan sudah ada di cart =====
      // Return cart item ID kalau ada, null kalau tidak
      findItemByProduk: (produkId) => {
        const item = get().items.find((i) => i.produk.id === produkId)
        return item?.id || null
      },
    }),
    {
      name: 'dibyo-cart',  // localStorage key
      partialize: (state) => ({ items: state.items }),  // hanya persist items
    }
  )
)

export default useCartStore