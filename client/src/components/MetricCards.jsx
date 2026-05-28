import { useModels } from '../hooks/useProducts'
import { fmtCompact } from '../utils/helpers'

const Card = ({ label, value, color }) => (
  <div className="metric">
    <div className="label">{label}</div>
    <div className={`value ${color || ''}`}>{value}</div>
  </div>
)

export default function MetricCards() {
  const { data, isLoading } = useModels()
  const models = data?.models || []
  const count = (n) => Number(n || 0).toLocaleString('ar-EG')
  
  const loading = isLoading

  let totalSkus = 0
  let stockValue = 0
  let potRevenue = 0
  let alertCount = 0

  models.forEach((m) => {
    const inventory = m.inventory || []
    const variants = m.variants || []
    const variantMap = new Map(variants.map(v => [String(v._id), v]))

    totalSkus += inventory.length
    for (const item of inventory) {
      const variant = variantMap.get(String(item.variantId))
      const cost = Number(variant?.costPrice || 0)
      const sell = Number(variant?.sellPrice || 0)
      const qty = Number(item.quantity || 0)
      stockValue += cost * qty
      potRevenue += sell * qty
      if (item.availableQuantity === 0 || (item.availableQuantity > 0 && item.availableQuantity <= item.lowStockAt)) {
        alertCount++
      }
    }
  })

  const potProfit = potRevenue - stockValue

  if (loading) return (
    <div className="metrics">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="metric">
          <div className="label">-</div>
          <div className="value" style={{ color: 'var(--hint)' }}>...</div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="metrics">
      <Card label="عدد الموديلات" value={count(models.length)} />
      <Card label="إجمالي الأكواد" value={count(totalSkus)} />
      <Card label="قيمة المخزون" value={fmtCompact(stockValue)} />
      <Card label="الربح المتوقع" value={fmtCompact(potProfit)} color="green" />
      <Card
        label="تنبيه انخفاض/نفاد"
        value={count(alertCount)}
        color={alertCount > 0 ? 'amber' : ''}
      />
    </div>
  )
}
