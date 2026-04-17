export const required = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) return fieldName + ' wajib diisi'
  return null
}

export const minLength = (value, min, fieldName) => {
  if (value && value.length < min) return fieldName + ' minimal ' + min + ' karakter'
  return null
}

export const positiveNumber = (value, fieldName) => {
  if (value !== undefined && value !== null && Number(value) <= 0) return fieldName + ' harus lebih dari 0'
  return null
}

export const phoneNumber = (value) => {
  if (value && !/^[0-9+\-() ]{8,15}$/.test(value)) return 'Format nomor telepon tidak valid'
  return null
}

export const maxPotong = (value, sisaGulungan) => {
  if (Number(value) > Number(sisaGulungan)) return 'Panjang potong melebihi sisa gulungan (' + sisaGulungan + ' m)'
  return null
}

export const validate = (rules) => {
  const errors = {}
  for (const [field, validators] of Object.entries(rules)) {
    for (const validatorFn of validators) {
      const error = validatorFn()
      if (error) { errors[field] = error; break }
    }
  }
  return errors
}
