import { useState } from 'react'
import Topbar from '../components/Topbar'
import SalesTable from '../components/SalesTable'
import SaleForm from '../components/SaleForm'
import SaleDetailsModal from '../components/SaleDetailsModal'

export default function Sales() {
  const [params, setParams] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    sort: 'createdAt',
    order: 'desc',
    page: 1,
  })
  const [showCreate, setShowCreate] = useState(false)
  const [activeSaleId, setActiveSaleId] = useState(null)

  const setParam = (key, value) =>
    setParams(p => ({ ...p, [key]: value, page: key !== 'page' ? 1 : value }))

  return (
    <>
      <Topbar
        onAdd={() => setShowCreate(true)}
        showImport={false}
        addLabel="عملية بيع جديدة"
      />

      <div className="page" style={{ paddingTop: '1.5rem' }}>
        <div className="filters-bar">
          <input
            placeholder="ابحث بالاسم أو الهاتف..."
            value={params.search}
            onChange={e => setParam('search', e.target.value)}
          />

          <select value={params.paymentStatus} onChange={e => setParam('paymentStatus', e.target.value)}>
            <option value="">كل حالات الدفع</option>
            <option value="paid">مدفوع</option>
            <option value="partial">مدفوع جزئيا</option>
            <option value="unpaid">غير مدفوع</option>
            <option value="partially_refunded">مسترجع جزئيا</option>
            <option value="refunded">مسترجع</option>
          </select>

          <select value={params.status} onChange={e => setParam('status', e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="open">مفتوح</option>
            <option value="completed">مكتمل</option>
            <option value="partially_returned">مرتجع جزئيا</option>
            <option value="returned">مرتجع</option>
          </select>

          {(params.search || params.paymentStatus || params.status) && (
            <button
              className="btn ghost"
              onClick={() => {
                setParam('search', '')
                setParam('paymentStatus', '')
                setParam('status', '')
              }}
            >
              مسح
            </button>
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <SalesTable
            params={params}
            setParam={setParam}
            onSelect={setActiveSaleId}
          />
        </div>
      </div>

      {showCreate && (
        <SaleForm onClose={() => setShowCreate(false)} />
      )}

      {activeSaleId && (
        <SaleDetailsModal
          saleId={activeSaleId}
          onClose={() => setActiveSaleId(null)}
        />
      )}
    </>
  )
}
