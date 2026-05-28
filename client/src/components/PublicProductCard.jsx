import { fmt } from '../utils/helpers'

const sizeLabel = (sizes) => sizes.map(s => s.size).join('، ')
const priceLabel = (range) => {
  if (!range || (!range.min && !range.max)) return '—'
  if (range.min === range.max) return fmt(range.min)
  return `${fmt(range.min)} - ${fmt(range.max)}`
}

export default function PublicProductCard({ product, onOpen }) {
  const mainVariant = product.variants[0]
  const image = product.image || mainVariant?.image
  const price = priceLabel(product.priceRange)
  const sizes = mainVariant?.sizes || []
  const availableSizes = sizes.filter(s => s.available > 0)

  return (
    <div className="card public-card">
      <div className="public-card-image">
        {image
          ? <img src={image} alt={product.modelName} />
          : <span>ص</span>
        }
      </div>
      <div className="public-card-body">
        <div>
          <h3>{product.modelName}</h3>
          <p className="muted" style={{ margin: '4px 0' }}>
            {product.brand || '—'} {product.category ? `• ${product.category}` : ''}
          </p>
        </div>

        <div className="public-card-meta">
          <span className="price">{price}</span>
          <span className="muted" style={{ fontSize: 12 }}>
            {mainVariant ? `${mainVariant.colorName}` : '—'}
          </span>
        </div>

        {sizes.length > 0 && (
          <p className="sizes">
            المقاسات: {sizeLabel(sizes)}
            {availableSizes.length > 0 && (
              <span className="muted"> • متاح {availableSizes.length}</span>
            )}
          </p>
        )}

        <button
          className="btn primary"
          onClick={() => onOpen(product)}
          disabled={!mainVariant}
        >
          عرض التفاصيل
        </button>
      </div>
    </div>
  )
}
