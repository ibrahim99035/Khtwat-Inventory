export const fmt = (n) =>
  'ج.م ' + Number(n).toLocaleString('ar-EG', { minimumFractionDigits: 0 })

export const fmtCompact = (n) => {
  if (n >= 1000000) return `ج.م ${(n / 1000000).toFixed(1)}م`
  if (n >= 1000) return `ج.م ${(n / 1000).toFixed(1)}ألف`
  return fmt(n)
}

export const expandSizeRange = (rangeStr) => {
  const match = rangeStr.match(/^(\d+)-(\d+)$/)
  if (!match) return [rangeStr.trim()]
  const from = parseInt(match[1])
  const to = parseInt(match[2])
  if (from > to) return []
  return Array.from({ length: to - from + 1 }, (_, i) => String(from + i))
}
