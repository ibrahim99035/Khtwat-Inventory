export const variantTotalStock = (variant) =>
  variant.sizes.reduce((s, sz) => s + sz.stock, 0)

export const variantStockStatus = (variant) => {
  const total = variantTotalStock(variant)
  if (total === 0) return 'out'
  if (variant.sizes.some(sz => sz.stock > 0 && sz.stock <= variant.lowStockAt)) {
    return 'low'
  }
  return 'in'
}

export const productStockStatus = (product) => {
  const statuses = product.variants.map(variantStockStatus)
  if (statuses.every(s => s === 'out')) return 'out'
  if (statuses.some(s => s === 'low')) return 'low'
  return 'in'
}

export const productTotalStock = (product) =>
  product.variants.reduce((s, v) => s + variantTotalStock(v), 0)

export const profit = (v) => v.sellPrice - v.costPrice

export const margin = (v) =>
  v.sellPrice > 0 ? Math.round((profit(v) / v.sellPrice) * 100) : 0

export const priceRange = (product) => {
  const prices = product.variants.map(v => v.sellPrice)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? fmt(min) : `${fmt(min)} - ${fmt(max)}`
}

export const fmt = (n) =>
  'ج.م ' + Number(n).toLocaleString('ar-EG', { minimumFractionDigits: 0 })

export const fmtCompact = (n) => {
  if (n >= 1000000) return `ج.م ${(n / 1000000).toFixed(1)}م`
  if (n >= 1000) return `ج.م ${(n / 1000).toFixed(1)}ألف`
  return fmt(n)
}

export const generateSku = (productName, color) => {
  const name = productName?.slice(0, 4).toUpperCase().replace(/\s/g, '') || 'PROD'
  const col = color?.slice(0, 3).toUpperCase().replace(/\s|\//g, '') || 'CLR'
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `${name}-${col}-${rand}`
}

export const expandSizeRange = (rangeStr) => {
  const match = rangeStr.match(/^(\d+)-(\d+)$/)
  if (!match) return [rangeStr.trim()]
  const from = parseInt(match[1])
  const to = parseInt(match[2])
  if (from > to) return []
  return Array.from({ length: to - from + 1 }, (_, i) => String(from + i))
}

export const productAgeGroup = (product) => {
  const sizes = product.variants.flatMap(v => v.sizes.map(s => s.size))
  const nums = sizes.map(s => parseInt(s, 10)).filter(n => !Number.isNaN(n))
  if (!nums.length) return 'unknown'
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  if (max <= 27) return 'toddler'
  if (min >= 36) return 'adult'
  if (max <= 35) return 'kid'
  return 'mixed'
}
