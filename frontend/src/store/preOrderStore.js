import { create } from 'zustand'

const usePreOrderStore = create((set, get) => ({
  customer: { nama_customer: '', kontak_customer: '', alamat_customer: '' },
  items: [],
  setCustomer: (d) => set({ customer: { ...get().customer, ...d } }),
  addItem: (item) => set((s) => ({ items: [...s.items, { ...item, id: Date.now() }] })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  updateItem: (id, u) => set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, ...u } : i) })),
  getSubtotal: () => get().items.reduce((t, i) => t + i.subtotal, 0),
  resetPreOrder: () => set({ customer: { nama_customer: '', kontak_customer: '', alamat_customer: '' }, items: [] }),
}))

export default usePreOrderStore
