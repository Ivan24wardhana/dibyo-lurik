import { create } from 'zustand'

const usePreOrderStore = create((set, get) => ({
  // Data customer (header POR)
  customer: {
    nama_customer: '',
    kontak_customer: '',
    alamat_customer: '',
  },

  // Items POR (produk yang dipilih)
  items: [],

  // Set data customer
  setCustomer: (customerData) => {
    set({ customer: { ...get().customer, ...customerData } })
  },

  // Tambah item produk ke POR
  addItem: (item) => {
    set((state) => ({
      items: [...state.items, { ...item, id: Date.now() }],
    }))
  },

  // Hapus item dari POR
  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }))
  },

  // Update item POR
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

  // Reset semua data POR
  resetPreOrder: () => {
    set({
      customer: {
        nama_customer: '',
        kontak_customer: '',
        alamat_customer: '',
      },
      items: [],
    })
  },
}))

export default usePreOrderStore