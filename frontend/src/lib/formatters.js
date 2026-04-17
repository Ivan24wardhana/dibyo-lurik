export const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

export const formatTanggal = (dateString) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(dateString))
}

export const formatTanggalPendek = (dateString) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(dateString))
}

export const formatMeter = (value) => {
  return Number(value).toLocaleString('id-ID', { minimumFractionDigits: 1 }) + ' m'
}

export const formatPersen = (value) => Number(value) + '%'

export const hitungDiskon = (subtotal, diskon) => {
  return subtotal - (subtotal * (diskon / 100))
}
