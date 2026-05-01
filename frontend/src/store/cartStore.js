import { create } from 'zustand'

const useCartStore = create((set, get) => ({
  items: [],

  // Tambah item ke keranjang
  addItem: (item) => {
    set((state) => ({
      items: [...state.items, { ...item, id: Date.now() }],
    }))
  },

  // Hapus item dari keranjang
  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }))
  },

  // Update item di keranjang
  updateItem: (itemId, updates) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }))
  },

  // Hitung subtotal semua item
  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.subtotal, 0)
  },

  // Hitung total setelah diskon
  getTotal: (diskon = 0) => {
    const subtotal = get().getSubtotal()
    return subtotal - subtotal * (diskon / 100)
  },

  // Kosongkan keranjang
  clearCart: () => {
    set({ items: [] })
  },

  // Hitung jumlah item
  getItemCount: () => {
    return get().items.length
  },
}))

export default useCartStore