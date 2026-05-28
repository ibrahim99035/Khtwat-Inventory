import { useMemo, useState } from 'react'
import { useAddPayment, useCreateReturn, useSale } from '../hooks/useSales'
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

export default function SaleDetailsModal({ saleId, onClose }) {
  const { data: sale, isLoading } = useSale(saleId)
  const { mutate: addPayment, isPending: addingPayment } = useAddPayment()
  const { mutate: createReturn, isPending: savingReturn } = useCreateReturn()

  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentNote, setPaymentNote] = useState('')

  const [returnMethod, setReturnMethod] = useState('cash')
  const [returnNote, setReturnNote] = useState('')
  const [returnLines, setReturnLines] = useState({})
  const [returnConditions, setReturnConditions] = useState({})

  const returnedMap = useMemo(() => {
    const map = {}
    for (const ret of sale?.returns || []) {
      for (const item of ret.items || []) {
        map[item.lineId] = (map[item.lineId] || 0) + item.qty
      }
    }
    return map
  }, [sale])

  const returnTotal = useMemo(() => {
    let total = 0
    for (const line of sale?.items || []) {
      const qty = Number(returnLines[line._id] || 0)
      if (qty > 0) total += line.unitPrice * qty
    }
    return total
  }, [sale, returnLines])

  const addPaymentHandler = () => {
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) return
    addPayment(
      { id: saleId, payload: { amount, method: paymentMethod, note: paymentNote } },
      { onSuccess: () => { setPaymentAmount(''); setPaymentNote('') } }
    )
  }

  const submitReturn = () => {
    const items = []
    for (const line of sale?.items || []) {
      const qty = Number(returnLines[line._id] || 0)
      if (qty > 0) {
        items.push({
          lineId: line._id,
          qty,
          condition: returnConditions[line._id] || 'resellable',
        })
      }
    }
    if (!items.length) return

    createReturn(
      { id: saleId, payload: { items, method: returnMethod, note: returnNote } },
      { onSuccess: () => { setReturnLines({}); setReturnNote('') } }
    )
  }

  if (isLoading || !sale) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal sale-modal" onClick={e => e.stopPropagation()}>
          <p className="muted">جارٍ تحميل التفاصيل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sale-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>تفاصيل البيع</h2>
          <button className="btn ghost icon" onClick={onClose}>X</button>
        </div>

        <div className="details-grid">
          <div>
            <p className="section-title">ملخص</p>
            <div className="inline-kv">
              <span>التاريخ</span>
              <strong>{new Date(sale.createdAt).toLocaleDateString('ar-EG')}</strong>
            </div>
            <div className="inline-kv">
              <span>الإجمالي</span>
              <strong>{fmt(sale.total)}</strong>
            </div>
            <div className="inline-kv">
              <span>المدفوع</span>
              <strong>{fmt(sale.paidAmount || 0)}</strong>
            </div>
            <div className="inline-kv">
              <span>المتبقي</span>
              <strong>{fmt(sale.balance || 0)}</strong>
            </div>
            <div className="inline-kv">
              <span>حالة الدفع</span>
              <strong>{PAYMENT_LABEL[sale.paymentStatus]}</strong>
            </div>
            <div className="inline-kv">
              <span>الحالة</span>
              <strong>{STATUS_LABEL[sale.status]}</strong>
            </div>
          </div>

          <div>
            <p className="section-title">العميل</p>
            <div className="inline-kv">
              <span>الاسم</span>
              <strong>{sale.customerName || '-'}</strong>
            </div>
            <div className="inline-kv">
              <span>الهاتف</span>
              <strong className="ltr">{sale.customerPhone || '-'}</strong>
            </div>
          </div>
        </div>

        <div className="details-divider" />

        <div>
          <p className="section-title">تفاصيل الأصناف</p>
          <table className="variant-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>المقاس</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map(line => (
                <tr key={line._id}>
                  <td className="ltr">{line.sku || '-'}</td>
                  <td>{line.size}</td>
                  <td>{Number(line.qty).toLocaleString('ar-EG')}</td>
                  <td>{fmt(line.unitPrice)}</td>
                  <td>{fmt(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="details-divider" />

        <div>
          <p className="section-title">إضافة دفعة</p>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label>المبلغ</label>
              <input
                type="number"
                min="0"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>الطريقة</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="cash">نقدي</option>
                <option value="card">بطاقة</option>
              </select>
            </div>
            <div className="form-group">
              <label>ملاحظة</label>
              <input value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
            </div>
          </div>
          <button className="btn sm" onClick={addPaymentHandler} disabled={addingPayment}>
            {addingPayment ? 'جارٍ الإضافة...' : 'إضافة الدفعة'}
          </button>
        </div>

        <div className="details-divider" />

        <div>
          <p className="section-title">تسجيل مرتجع</p>
          <div className="sale-return-list">
            {sale.items.map(line => {
              const returnedQty = returnedMap[line._id] || 0
              const remaining = line.qty - returnedQty
              if (remaining <= 0) return null

              return (
                <div key={line._id} className="sale-return-line">
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                    <div className="form-group">
                      <label>المقاس</label>
                      <input value={line.size} readOnly />
                    </div>
                    <div className="form-group">
                      <label>الكمية المتاحة</label>
                      <input value={remaining} readOnly />
                    </div>
                    <div className="form-group">
                      <label>الكمية المرتجعة</label>
                      <input
                        type="number"
                        min="0"
                        max={remaining}
                        value={returnLines[line._id] || ''}
                        onChange={e => setReturnLines(prev => ({
                          ...prev,
                          [line._id]: Number(e.target.value || 0),
                        }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>الحالة</label>
                      <select
                        value={returnConditions[line._id] || 'resellable'}
                        onChange={e => setReturnConditions(prev => ({
                          ...prev,
                          [line._id]: e.target.value,
                        }))}
                      >
                        <option value="resellable">قابل للبيع</option>
                        <option value="used">مستخدم</option>
                        <option value="damaged">تالف</option>
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label>قيمة المرتجع</label>
              <input value={fmt(returnTotal)} readOnly className="ltr" />
            </div>
            <div className="form-group">
              <label>طريقة الاسترجاع</label>
              <select value={returnMethod} onChange={e => setReturnMethod(e.target.value)}>
                <option value="cash">نقدي</option>
                <option value="card">بطاقة</option>
                <option value="credit">رصيد</option>
              </select>
            </div>
            <div className="form-group">
              <label>ملاحظة</label>
              <input value={returnNote} onChange={e => setReturnNote(e.target.value)} />
            </div>
          </div>

          <button className="btn sm" onClick={submitReturn} disabled={savingReturn}>
            {savingReturn ? 'جارٍ الحفظ...' : 'تسجيل المرتجع'}
          </button>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  )
}
