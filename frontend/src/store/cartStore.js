import { create } from 'zustand'

const useCartStore = create((set, get) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, { ...item, id: Date.now() }] })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  updateItem: (id, u) => set((s) => ({ items: s.items.map((i) => i.id === id ? { ...i, ...u } : i) })),
  getSubtotal: () => get().items.reduce((t, i) => t + i.subtotal, 0),
  getTotal: (diskon = 0) => { const s = get().getSubtotal(); return s - s * (diskon / 100) },
  clearCart: () => set({ items: [] }),
  getItemCount: () => get().items.length,
}))

export default useCartStore
