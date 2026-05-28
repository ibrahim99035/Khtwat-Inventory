import { fmt } from '../utils/helpers'

const sizeLabel = (sizes) => sizes.map(s => s.size).join('، ')

export default function PublicProductCard({ product, onOpen }) {
  const mainVariant = product.variants[0]
  const image = product.images?.[0]?.url
  const price = mainVariant?.sellPrice

  return (
    <div className="card public-card">
      <div className="public-card-image">
        {image
          ? <img src={image} alt={product.name} />
          : <span>ص</span>
        }
      </div>
      <div className="public-card-body">
        <div>
          <h3>{product.name}</h3>
          <p className="muted" style={{ margin: '4px 0' }}>
            {product.brand || '—'} {product.category ? `• ${product.category}` : ''}
          </p>
        </div>

        <div className="public-card-meta">
          <span className="price">{price ? fmt(price) : '—'}</span>
          <span className="muted" style={{ fontSize: 12 }}>
            {mainVariant ? `${mainVariant.color}` : '—'}
          </span>
        </div>

        {mainVariant && mainVariant.sizes?.length > 0 && (
          <p className="sizes">المقاسات المتاحة: {sizeLabel(mainVariant.sizes)}</p>
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
