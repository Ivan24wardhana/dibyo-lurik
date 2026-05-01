// =====================================================
// crud-helper.js
// Helper umum untuk operasi CRUD (pagination, search, FK check).
// =====================================================

import supabaseAdmin from './supabase-admin'

/**
 * Parse query params untuk pagination
 */
export function parsePagination(request) {
  const { searchParams } = new URL(request.url)
  let page = parseInt(searchParams.get('page')) || 1
  let limit = parseInt(searchParams.get('limit')) || 20

  if (page < 1) page = 1
  if (limit < 1) limit = 20
  if (limit > 100) limit = 100

  return { page, limit, offset: (page - 1) * limit }
}

/**
 * Parse query param untuk search
 */
export function parseSearch(request) {
  const { searchParams } = new URL(request.url)
  return (searchParams.get('q') || '').trim()
}

/**
 * Parse query param umum (filter custom)
 */
export function parseQueryParam(request, name) {
  const { searchParams } = new URL(request.url)
  return searchParams.get(name) || null
}

/**
 * Build response untuk paginated list
 */
export function buildPaginatedData(data, totalCount, pagination) {
  return {
    items: data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: totalCount,
      total_pages: Math.ceil(totalCount / pagination.limit),
    },
  }
}

/**
 * Cek apakah suatu record dipakai sebagai FK di tabel lain
 */
export async function checkFKReferences(id, references) {
  const usedIn = []

  for (const ref of references) {
    const { count, error } = await supabaseAdmin
      .from(ref.table)
      .select('*', { count: 'exact', head: true })
      .eq(ref.column, id)

    if (error) {
      console.warn(`[checkFKReferences] error checking ${ref.table}:`, error.message)
      usedIn.push({ table: ref.table, count: '?' })
      continue
    }

    if (count && count > 0) {
      usedIn.push({ table: ref.table, count })
    }
  }

  return { used: usedIn.length > 0, usedIn }
}

/**
 * Format pesan FK error untuk user.
 * Labels disesuaikan dengan nama tabel di schema v6.
 */
export function formatFKErrorMessage(usedIn) {
  const labels = {
    produk: 'produk',
    gulungan: 'gulungan',
    item_order: 'item order',
    item_pre_order_reguler: 'item pre-order reguler',
    daftar_harga: 'daftar harga',
    pre_order_reguler: 'pre-order reguler',
    pre_order_custom: 'pre-order custom',
    orders: 'order',
  }

  const parts = usedIn.map((u) => `${u.count} ${labels[u.table] || u.table}`)
  return `Tidak bisa dihapus: masih dipakai di ${parts.join(', ')}`
}