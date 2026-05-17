// =====================================================
// MasterDataCRUD.jsx
// Shared component CRUD untuk master data simpel.
// Field: nama saja (Kategori, Motif, Rak semuanya sama).
//
// Features:
//   - Search + list dengan pagination
//   - Inline Tambah form di atas
//   - Edit modal sederhana
//   - Hapus dengan ConfirmDialog + FK error handling
//
// Props:
//   - title: string                  - judul halaman (mis. "Kategori")
//   - endpoint: string               - base API endpoint (mis. "/api/kategori")
//   - labelField: string             - label untuk input (mis. "Nama Kategori")
//   - namePlaceholder: string        - placeholder input (mis. "contoh: Kain Lurik")
//   - emptyMessage: string           - pesan kalau kosong
//   - entityLabel: string            - untuk pesan hapus (mis. "kategori")
// =====================================================

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Database } from 'lucide-react'
import { Modal, Button, EmptyState, Loading, ConfirmDialog, useToast } from '../ui'
import api, { getErrorMessage } from '../../lib/api'

export default function MasterDataCRUD({
  title = 'Master Data',
  endpoint,
  labelField = 'Nama',
  namePlaceholder = 'Masukkan nama...',
  emptyMessage = 'Belum ada data',
  entityLabel = 'data',
}) {
  const toast = useToast()

  // ===== List state =====
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 10

  // ===== Tambah state (inline form) =====
  const [addName, setAddName] = useState('')
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  // ===== Edit state =====
  const [editModal, setEditModal] = useState({ open: false, item: null })
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // ===== Delete state =====
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null })
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ===== Fetch list =====
  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(LIMIT))
      if (searchQuery) params.set('q', searchQuery)

      const res = await api.get(`${endpoint}?${params.toString()}`)
      const result = res.data?.data || {}
      const data = result.items || []

      setItems(Array.isArray(data) ? data : [])
      const pagination = result.pagination || {}
      setTotal(pagination.total || 0)
      setTotalPages(pagination.total_pages || 1)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [endpoint, page, searchQuery])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // ===== Tambah =====
  const handleAdd = async () => {
    if (!addName.trim()) {
      setAddError(`${labelField} wajib diisi`)
      return
    }
    setAddLoading(true)
    setAddError('')
    try {
      await api.post(endpoint, { nama: addName.trim() })
      toast.success(`${title} berhasil ditambahkan`)
      setAddName('')
      setPage(1)
      fetchList()
    } catch (err) {
      const msg = getErrorMessage(err)
      setAddError(msg)
    } finally {
      setAddLoading(false)
    }
  }

  // ===== Edit =====
  const openEdit = (item) => {
    setEditName(item.nama)
    setEditError('')
    setEditModal({ open: true, item })
  }

  const handleEdit = async () => {
    if (!editName.trim()) {
      setEditError(`${labelField} wajib diisi`)
      return
    }
    setEditLoading(true)
    setEditError('')
    try {
      await api.patch(`${endpoint}/${editModal.item.id}`, {
        nama: editName.trim(),
      })
      toast.success(`${title} berhasil diupdate`)
      setEditModal({ open: false, item: null })
      fetchList()
    } catch (err) {
      setEditError(getErrorMessage(err))
    } finally {
      setEditLoading(false)
    }
  }

  // ===== Delete =====
  const handleConfirmDelete = async () => {
    const item = deleteModal.item
    if (!item) return

    setDeleteLoading(true)
    try {
      await api.delete(`${endpoint}/${item.id}`)
      toast.success(`${title} "${item.nama}" berhasil dihapus`)
      setDeleteModal({ open: false, item: null })
      fetchList()
    } catch (err) {
      // FK error - tampil toast error, tutup confirm
      toast.error(getErrorMessage(err))
      setDeleteModal({ open: false, item: null })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      {/* ===== Tambah Form (inline di atas) ===== */}
      <div className="bg-white border border-[#a47352]/30 rounded-[10px] p-5 mb-5 shadow-sm">
        <h3 className="text-[#a47352] text-base font-semibold mb-3">
          + Tambah {title} Baru
        </h3>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={addName}
              onChange={(e) => {
                setAddName(e.target.value)
                setAddError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={namePlaceholder}
              className={`
                w-full h-[46px] px-4
                bg-[rgba(227,194,172,0.35)] border
                ${addError ? 'border-red-500' : 'border-[#a47352]'}
                rounded-[10px] text-[#a47352] text-base
                focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
                transition-all duration-150
              `}
            />
            {addError && (
              <p className="text-red-500 text-xs mt-1">{addError}</p>
            )}
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleAdd}
            loading={addLoading}
            className="h-[46px]"
          >
            Tambah
          </Button>
        </div>
      </div>

      {/* ===== Search + Stats ===== */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Cari ${title.toLowerCase()}...`}
            className="
              w-full pl-4 pr-4 h-[44px]
              bg-[rgba(227,194,172,0.35)] border border-[#a47352]
              rounded-[10px] text-[#a47352] text-base
              focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
              transition-all duration-150
            "
          />
        </div>
        {!loading && (
          <p className="text-sm text-[#a47352]/70 flex-shrink-0">
            Total: <span className="font-semibold">{total} {entityLabel}</span>
          </p>
        )}
      </div>

      {/* ===== List ===== */}
      <div className="bg-white border border-[#a47352]/30 rounded-[10px] overflow-hidden shadow-sm">
        {/* Header tabel */}
        <div className="bg-[#a47352] text-white grid grid-cols-[60px_1fr_180px] px-4 py-3 text-sm font-medium">
          <div className="text-center">No.</div>
          <div>{labelField}</div>
          <div className="text-center">Aksi</div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12">
            <Loading variant="centered" message="Memuat data..." />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-700">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Database}
              title={searchQuery ? 'Tidak ada hasil' : emptyMessage}
              message={
                searchQuery
                  ? `Tidak ada ${entityLabel} dengan nama "${searchQuery}"`
                  : `Tambah ${entityLabel} baru menggunakan form di atas`
              }
            />
          </div>
        ) : (
          <>
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="
                  grid grid-cols-[60px_1fr_180px]
                  px-4 py-3 items-center
                  border-b border-[#a47352]/20 last:border-b-0
                  hover:bg-[#fdfaf6]
                  transition-colors duration-150
                "
              >
                <div className="text-center text-[#a47352] text-sm font-medium">
                  {(page - 1) * LIMIT + idx + 1}.
                </div>
                <div className="text-[#a47352] font-medium text-base">
                  {item.nama}
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="
                      bg-[#f0a864] hover:bg-[#d8924f]
                      text-white rounded-[8px] px-3 py-1.5
                      inline-flex items-center gap-1
                      active:scale-95 transition-all duration-150 text-sm
                    "
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteModal({ open: true, item })}
                    className="
                      bg-[#ff695e] hover:bg-[#e54c41]
                      text-white rounded-[8px] px-3 py-1.5
                      inline-flex items-center gap-1
                      active:scale-95 transition-all duration-150 text-sm
                    "
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ===== Pagination simple ===== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="
              px-4 py-2 rounded-[8px] text-sm font-medium
              bg-[rgba(227,194,172,0.35)] text-[#a47352]
              hover:bg-[rgba(227,194,172,0.5)]
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            ← Sebelumnya
          </button>
          <span className="text-sm text-[#a47352]">
            Halaman {page} dari {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="
              px-4 py-2 rounded-[8px] text-sm font-medium
              bg-[rgba(227,194,172,0.35)] text-[#a47352]
              hover:bg-[rgba(227,194,172,0.5)]
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            Berikutnya →
          </button>
        </div>
      )}

      {/* ===== Edit Modal ===== */}
      <Modal
        open={editModal.open}
        onClose={editLoading ? undefined : () => setEditModal({ open: false, item: null })}
        title={`Edit ${title}`}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setEditModal({ open: false, item: null })}
              disabled={editLoading}
            >
              Batal
            </Button>
            <Button variant="primary" onClick={handleEdit} loading={editLoading}>
              Simpan
            </Button>
          </>
        }
      >
        <div>
          <label className="block text-[#a47352] text-sm font-medium mb-2">
            {labelField} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={editName}
            onChange={(e) => {
              setEditName(e.target.value)
              setEditError('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
            className={`
              w-full h-[46px] px-4
              bg-[rgba(227,194,172,0.35)] border
              ${editError ? 'border-red-500' : 'border-[#a47352]'}
              rounded-[10px] text-[#a47352] text-base
              focus:outline-none focus:ring-2 focus:ring-[#a47352]/30
              transition-all duration-150
            `}
          />
          {editError && (
            <p className="text-red-500 text-xs mt-1">{editError}</p>
          )}
        </div>
      </Modal>

      {/* ===== Confirm Delete ===== */}
      <ConfirmDialog
        open={deleteModal.open}
        onClose={() =>
          !deleteLoading && setDeleteModal({ open: false, item: null })
        }
        onConfirm={handleConfirmDelete}
        title={`Hapus ${title}?`}
        message={
          deleteModal.item
            ? `${title} "${deleteModal.item.nama}" akan dihapus permanen. Tidak bisa dihapus jika masih dipakai di produk. Lanjutkan?`
            : 'Apakah Anda yakin?'
        }
        confirmText="Ya, Hapus"
        loading={deleteLoading}
      />
    </div>
  )
}