import { useMemo, useState } from 'react'
import { usePublicProducts } from '../hooks/useProducts'
import PublicFilters from '../components/PublicFilters'
import PublicProductCard from '../components/PublicProductCard'
import PublicProductModal from '../components/PublicProductModal'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || ''

export default function PublicHome() {
  const [params, setParams] = useState({
    search: '',
    category: '',
    brand: '',
    gender: '',
    sort: 'createdAt',
    order: 'desc',
    page: 1,
    limit: 18,
  })

  const { data, isLoading } = usePublicProducts(params)
  const [activeProduct, setActiveProduct] = useState(null)

  const setParam = (key, value) =>
    setParams(p => ({ ...p, [key]: value, page: key !== 'page' ? 1 : value }))

  const products = data?.products || []
  const totalPages = data?.totalPages || 1

  const whatsAppBase = useMemo(() => {
    const num = WHATSAPP_NUMBER.replace(/[^0-9]/g, '')
    if (!num) return null
    return `https://wa.me/${num}`
  }, [])

  const handleWhatsApp = (message) => {
    if (!whatsAppBase || !message) return
    const url = `${whatsAppBase}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="public-home">
      <header className="public-hero">
        <div>
          <p className="caps" style={{ margin: 0 }}>متجر</p>
          <h1>خطوات</h1>
          <p className="muted" style={{ maxWidth: 420 }}>
            اكتشف أحدث الموديلات المتاحة الآن، واختر المقاس المناسب بسهولة.
          </p>
        </div>
      </header>

      <div className="page" style={{ paddingTop: '1.5rem' }}>
        <PublicFilters params={params} setParam={setParam} />

        {isLoading ? (
          <div className="card empty-state" style={{ marginTop: '1rem' }}>جارٍ تحميل المنتجات...</div>
        ) : !products.length ? (
          <div className="card empty-state" style={{ marginTop: '1rem' }}>
            <p style={{ fontWeight: 500 }}>لا توجد منتجات متاحة حاليا</p>
            <p className="muted">جرّب تغيير الفلاتر أو العودة لاحقا.</p>
          </div>
        ) : (
          <div className="public-grid">
            {products.map(product => (
              <PublicProductCard
                key={product._id}
                product={product}
                onOpen={setActiveProduct}
              />
            ))}
          </div>
        )}

        <div className="public-pagination">
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

      {activeProduct && (
        <PublicProductModal
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onWhatsApp={handleWhatsApp}
          whatsAppEnabled={!!whatsAppBase}
        />
      )}
    </div>
  )
}
