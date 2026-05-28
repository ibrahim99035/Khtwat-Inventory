import { useState } from 'react'
import Topbar from '../components/Topbar'
import MetricCards from '../components/MetricCards'
import Filters from '../components/Filters'
import ProductTable from '../components/ProductTable'
import ProductForm from '../components/ProductForm'

export default function Dashboard() {
  const [params, setParams] = useState({
    search: '',
    category: '',
    brand: '',
    status: '',
    gender: '',
    sort: 'createdAt',
    order: 'desc',
    page: 1,
  })
  const [editProduct, setEditProduct] = useState(null)

  const setParam = (key, value) =>
    setParams(p => ({ ...p, [key]: value, page: key !== 'page' ? 1 : value }))

  return (
    <>
      <Topbar
        onAdd={() => setEditProduct({})}
        showImport={false}
        addLabel="إضافة موديل"
      />

      <div className="page" style={{ paddingTop: '1.5rem' }}>
        <MetricCards />

        <div style={{ marginTop: '1.5rem' }}>
          <Filters params={params} setParam={setParam} />
        </div>

        <div style={{ marginTop: '1rem' }}>
          <ProductTable
            params={params}
            setParam={setParam}
            onEdit={(product) => setEditProduct(product)}
          />
        </div>
      </div>

      {editProduct !== null && (
        <ProductForm
          product={editProduct}
          onClose={() => setEditProduct(null)}
        />
      )}

    </>
  )
}
