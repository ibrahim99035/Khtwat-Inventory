import { useMemo, useState } from 'react'
import { fmt } from '../utils/helpers'

const sizeLabel = (sizes) => sizes.map(s => s.size).join('، ')

const buildWhatsAppMessage = (product, variant, size) => {
  const lines = [
    `مرحبا، أريد شراء هذا المنتج: ${product.name}`,
    product.brand ? `الماركة: ${product.brand}` : null,
    product.category ? `التصنيف: ${product.category}` : null,
    product.description ? `الوصف: ${product.description}` : null,
    variant?.sku ? `الكود: ${variant.sku}` : null,
    variant?.color ? `اللون: ${variant.color}` : null,
    size?.size ? `المقاس: ${size.size}` : null,
    variant?.sellPrice ? `السعر: ${fmt(variant.sellPrice)}` : null,
    variant?.sizes?.length ? `المقاسات المتاحة: ${sizeLabel(variant.sizes)}` : null,
  ].filter(Boolean)

  return lines.join('\n')
}

export default function PublicProductModal({ product, onClose, onWhatsApp, whatsAppEnabled }) {
  const variants = product.variants || []
  const [variantId, setVariantId] = useState(variants[0]?._id || '')
  const [sizeValue, setSizeValue] = useState(variants[0]?.sizes?.[0]?.size || '')

  const activeVariant = useMemo(
    () => variants.find(v => String(v._id) === String(variantId)) || variants[0],
    [variants, variantId]
  )

  const activeSizes = activeVariant?.sizes || []

  const activeSize = useMemo(
    () => activeSizes.find(s => s.size === sizeValue) || activeSizes[0],
    [activeSizes, sizeValue]
  )

  const handleWhatsApp = () => {
    if (!activeVariant || !activeSize) return
    const message = buildWhatsAppMessage(product, activeVariant, activeSize)
    onWhatsApp(message)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal public-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product.name}</h2>
          <button className="btn ghost icon" onClick={onClose}>X</button>
        </div>

        <div className="product-hero">
          <div className="product-image">
            {product.images?.[0]?.url
              ? <img src={product.images[0].url} alt={product.name} />
              : <span>ص</span>
            }
          </div>
          <div className="product-meta">
            <div className="inline-kv">
              <span>الماركة</span>
              <strong>{product.brand || '-'}</strong>
            </div>
            <div className="inline-kv">
              <span>التصنيف</span>
              <strong>{product.category || '-'}</strong>
            </div>
            {product.description && (
              <p className="muted" style={{ marginTop: 8 }}>{product.description}</p>
            )}
          </div>
        </div>

        <div className="details-divider" />

        <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label>اللون</label>
            <select
              value={variantId}
              onChange={e => {
                const nextId = e.target.value
                const nextVariant = variants.find(v => String(v._id) === String(nextId))
                setVariantId(nextId)
                setSizeValue(nextVariant?.sizes?.[0]?.size || '')
              }}
            >
              {variants.map(v => (
                <option key={v._id} value={v._id}>
                  {v.color} ({v.sku})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>المقاس</label>
            <select value={sizeValue} onChange={e => setSizeValue(e.target.value)}>
              {activeSizes.map(s => (
                <option key={s.size} value={s.size}>
                  {s.size} (متاح {s.stock})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>السعر</label>
            <input value={fmt(activeVariant?.sellPrice || 0)} readOnly className="ltr" />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>إغلاق</button>
          <button className="btn primary" onClick={handleWhatsApp} disabled={!whatsAppEnabled}>
            تواصل عبر واتساب
          </button>
        </div>

        {!whatsAppEnabled && (
          <p className="muted" style={{ marginTop: 10 }}>
            واتساب غير مفعّل بعد. يرجى إضافة رقم واتساب المتجر.
          </p>
        )}
      </div>
    </div>
  )
}
