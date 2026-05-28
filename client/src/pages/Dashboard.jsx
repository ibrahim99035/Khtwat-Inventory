import { useState } from 'react'
import Topbar from '../components/Topbar'
import MetricCards from '../components/MetricCards'
import Filters from '../components/Filters'
import BulkBar from '../components/BulkBar'
import ProductTable from '../components/ProductTable'
import ProductForm from '../components/ProductForm'
import ImportExport from '../components/ImportExport'

export default function Dashboard() {
  const [params, setParams] = useState({
    search: '',
    category: '',
    brand: '',
    status: '',
    gender: '',
    available: '',
    sort: 'createdAt',
    order: 'desc',
    page: 1,
  })
  const [selected, setSelected] = useState([])
  const [editProduct, setEditProduct] = useState(null)
  const [showImport, setShowImport] = useState(false)

  const setParam = (key, value) =>
    setParams(p => ({ ...p, [key]: value, page: key !== 'page' ? 1 : value }))

  return (
    <>
      <Topbar
        onAdd={() => setEditProduct({})}
        onImport={() => setShowImport(true)}
      />

      <div className="page" style={{ paddingTop: '1.5rem' }}>
        <MetricCards />

        <div style={{ marginTop: '1.5rem' }}>
          <Filters params={params} setParam={setParam} />
        </div>

        {selected.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <BulkBar selected={selected} onClear={() => setSelected([])} />
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <ProductTable
            params={params}
            setParam={setParam}
            selected={selected}
            setSelected={setSelected}
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

      {showImport && (
        <ImportExport onClose={() => setShowImport(false)} />
      )}
    </>
  )
}
