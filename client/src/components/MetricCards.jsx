import { useStats } from '../hooks/useProducts'
import { fmtCompact } from '../utils/helpers'

const Card = ({ label, value, color }) => (
  <div className="metric">
    <div className="label">{label}</div>
    <div className={`value ${color || ''}`}>{value}</div>
  </div>
)

export default function MetricCards() {
  const { data, isLoading } = useStats()
  const count = (n) => Number(n || 0).toLocaleString('ar-EG')

  if (isLoading) return (
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
      <Card label="عدد المنتجات" value={count(data.totalProducts)} />
      <Card label="إجمالي الأكواد" value={count(data.totalSkus)} />
      <Card label="قيمة المخزون" value={fmtCompact(data.stockValue)} />
      <Card label="الربح المتوقع" value={fmtCompact(data.potProfit)} color="green" />
      <Card
        label="تنبيه انخفاض/نفاد"
        value={count(data.alertCount)}
        color={data.alertCount > 0 ? 'amber' : ''}
      />
    </div>
  )
}
