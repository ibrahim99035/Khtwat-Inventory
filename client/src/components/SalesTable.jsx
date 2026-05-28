import { useSales } from '../hooks/useSales'
import { fmt } from '../utils/helpers'

const PAYMENT_LABEL = {
  unpaid: 'غير مدفوع',
  partial: 'مدفوع جزئيا',
  paid: 'مدفوع',
  refunded: 'مسترجع',
  partially_refunded: 'مسترجع جزئيا',
}

const STATUS_LABEL = {
  open: 'مفتوح',
  completed: 'مكتمل',
  returned: 'مرتجع',
  partially_returned: 'مرتجع جزئيا',
  canceled: 'ملغي',
}

export default function SalesTable({ params, setParam, onSelect }) {
  const { data, isLoading } = useSales(params)

  const sales = data?.sales || []
  const totalPages = data?.totalPages || 1

  if (isLoading) return (
    <div className="card empty-state">جارٍ تحميل المبيعات...</div>
  )

  if (!sales.length) return (
    <div className="card empty-state">
      <p style={{ fontSize: 32, marginBottom: 8 }}>م</p>
      <p style={{ fontWeight: 500, marginBottom: 4 }}>لا توجد مبيعات</p>
      <p className="muted">أضف عملية بيع جديدة لعرضها هنا.</p>
    </div>
  )

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>العميل</th>
              <th>عدد الأصناف</th>
              <th>الإجمالي</th>
              <th>المدفوع</th>
              <th>المتبقي</th>
              <th>حالة الدفع</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr
                key={sale._id}
                className="row-clickable"
                onClick={() => onSelect(sale._id)}
              >
                <td>{new Date(sale.createdAt).toLocaleDateString('ar-EG')}</td>
                <td>{sale.customerName || <span className="muted">-</span>}</td>
                <td>{Number(sale.items.length).toLocaleString('ar-EG')}</td>
                <td>{fmt(sale.total)}</td>
                <td>{fmt(sale.paidAmount || 0)}</td>
                <td>{fmt(sale.balance || 0)}</td>
                <td>
                  <span className={`badge ${sale.paymentStatus}`}>{PAYMENT_LABEL[sale.paymentStatus]}</span>
                </td>
                <td>
                  <span className="badge">{STATUS_LABEL[sale.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          fontSize: 13,
          color: 'var(--muted)',
        }}
      >
        <span>الإجمالي: {Number(data.total).toLocaleString('ar-EG')} عملية</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            className="btn sm"
            disabled={params.page <= 1}
            onClick={() => setParam('page', params.page - 1)}
          >
            السابق
          </button>
          <span>صفحة {Number(params.page).toLocaleString('ar-EG')} من {Number(totalPages).toLocaleString('ar-EG')}</span>
          <button
            className="btn sm"
            disabled={params.page >= totalPages}
            onClick={() => setParam('page', params.page + 1)}
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  )
}
