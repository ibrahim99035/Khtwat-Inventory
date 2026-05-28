import { useMemo, useState } from 'react'
import { usePublicProducts } from '../hooks/useProducts'
import PublicFilters from '../components/PublicFilters'
import PublicProductCard from '../components/PublicProductCard'
import PublicProductModal from '../components/PublicProductModal'
import '../styles/PublicCatalog.css'

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
      <header className="public-hero-banner">
        <div className="hero-content">
          <span className="hero-subtitle">مرحباً بك في خطوات</span>
          <h1 className="hero-title">أناقة تخطو بها</h1>
          <p className="hero-description">
            اكتشف تشكيلتنا الجديدة من الأحذية التي تجمع بين الراحة والتصميم العصري. 
            كل ما تحتاجه لتكمل مظهرك متاح الآن.
          </p>
          <button className="hero-cta" onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })}>
            تسوق الآن
          </button>
        </div>
      </header>

      <main className="catalog-container" id="catalog">
        <div className="catalog-sidebar">
          <PublicFilters params={params} setParam={setParam} />
        </div>

        <div className="catalog-content">
          <div className="catalog-header">
            <h2 className="catalog-title">المجموعة المتاحة</h2>
            {!isLoading && <span className="results-count">{Number(data?.total || 0).toLocaleString('ar-EG')} منتج</span>}
          </div>

          {isLoading ? (
            <div className="loading-grid">
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" />)}
            </div>
          ) : !products.length ? (
            <div className="empty-catalog">
              <div className="empty-icon">👟</div>
              <h3>لا توجد نتائج مطابقة</h3>
              <p>جرّب تعديل الفلاتر أو البحث عن شيء آخر.</p>
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
              className="page-btn"
              disabled={params.page <= 1}
              onClick={() => setParam('page', params.page - 1)}
            >
              السابق
            </button>
            <div className="page-info">
              صفحة <strong>{Number(params.page).toLocaleString('ar-EG')}</strong> من {Number(totalPages).toLocaleString('ar-EG')}
            </div>
            <button
              className="page-btn"
              disabled={params.page >= totalPages}
              onClick={() => setParam('page', params.page + 1)}
            >
              التالي
            </button>
          </div>
        </div>
      </main>

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
