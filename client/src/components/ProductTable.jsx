import { useState } from 'react'
import { useProducts, useDeleteProduct, useUpdateSizeStock } from '../hooks/useProducts'
import {
  variantTotalStock,
  variantStockStatus,
  productTotalStock,
  productStockStatus,
  priceRange,
  productAgeGroup,
  margin,
  fmt,
} from '../utils/helpers'

const STATUS_LABEL = { in: 'متوفر', low: 'منخفض', out: 'نافد' }
const AGE_LABEL = {
  toddler: 'أطفال صغار',
  kid: 'أطفال',
  adult: 'بالغين',
  mixed: 'مختلط',
  unknown: 'غير محدد',
}

const SortTh = ({ col, label, current, dir, onSort }) => (
  <th
    className="sortable"
    onClick={() => onSort(col)}
    style={{ whiteSpace: 'nowrap' }}
  >
    {label}
    {current === col ? (dir === 'asc' ? ' ^' : ' v') : ''}
  </th>
)

function VariantRows({ product, onStockEdit }) {
  return (
    <tr className="expand-row">
      <td colSpan={13} style={{ padding: '0 0 0 48px' }}>
        <div style={{ padding: '12px 12px 12px 0' }}>
          <table className="variant-table">
            <thead>
              <tr>
                <th>اللون</th>
                <th>الكود</th>
                <th>التكلفة</th>
                <th>البيع</th>
                <th>الهامش</th>
                <th>المقاسات والمخزون</th>
                <th>الإجمالي</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map(v => {
                const total = variantTotalStock(v)
                const status = variantStockStatus(v)
                return (
                  <tr key={v._id}>
                    <td style={{ fontWeight: 500 }}>
                      <span className="color-chip" style={{ background: v.colorHex || '#000' }} />
                      {v.color}
                    </td>
                    <td className="mono ltr">{v.sku}</td>
                    <td>{fmt(v.costPrice)}</td>
                    <td>{fmt(v.sellPrice)}</td>
                    <td style={{ color: 'var(--green)' }}>{margin(v)}%</td>
                    <td>
                      <div className="size-grid">
                        {v.sizes.map(sz => (
                          <div
                            key={sz.size}
                            className={`size-chip ${sz.stock === 0 ? 'zero' : ''}`}
                            title="اضغط لتعديل المخزون"
                            style={{ cursor: 'pointer' }}
                            onClick={() => onStockEdit({ product, variant: v, sizeEntry: sz })}
                          >
                            <span style={{ fontWeight: 500 }}>{sz.size}</span>
                            <span className="muted">x{sz.stock}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{Number(total).toLocaleString('ar-EG')}</td>
                    <td><span className={`badge ${status}`}>{STATUS_LABEL[status]}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  )
}

function StockEditModal({ entry, onClose }) {
  const { product, variant, sizeEntry } = entry
  const [val, setVal] = useState(String(sizeEntry.stock))
  const { mutate, isPending } = useUpdateSizeStock()

  const save = () => {
    mutate(
      { productId: product._id, variantId: variant._id, size: sizeEntry.size, stock: Number(val) },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 320 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>تعديل المخزون</h2>
          <button className="btn ghost icon" onClick={onClose}>X</button>
        </div>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          {product.name} - {variant.color} - مقاس {sizeEntry.size}
        </p>
        <div className="form-group">
          <label>كمية المخزون</label>
          <input
            type="number"
            min="0"
            autoFocus
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
          />
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>إلغاء</button>
          <button className="btn primary" onClick={save} disabled={isPending}>
            {isPending ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductDetailsModal({ product, onClose, onEdit, onDelete }) {
  const total = productTotalStock(product)
  const status = productStockStatus(product)
  const ageGroup = productAgeGroup(product)
  const isAvailable = product.available !== false
  const thumb = product.images?.[0]?.url

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal product-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>تفاصيل المنتج</h2>
          <button className="btn ghost icon" onClick={onClose}>X</button>
        </div>

        <div className="product-hero">
          <div className="product-image">
            {thumb
              ? <img src={thumb} alt={product.name} />
              : <span>ص</span>
            }
          </div>
          <div className="product-meta">
            <h3>{product.name}</h3>
            <div className="pill-row">
              <span className={`badge ${isAvailable ? 'available' : 'unavailable'}`}>
                {isAvailable ? 'متاح' : 'غير متاح'}
              </span>
              <span className={`badge ${status}`}>{STATUS_LABEL[status]}</span>
              <span className="badge">{AGE_LABEL[ageGroup]}</span>
            </div>
            <div className="inline-kv">
              <span>الماركة</span>
              <strong>{product.brand || '-'}</strong>
            </div>
            <div className="inline-kv">
              <span>التصنيف</span>
              <strong>{product.category || '-'}</strong>
            </div>
            <div className="inline-kv">
              <span>النوع</span>
              <strong>
                {product.gender === 'male'
                  ? 'رجالي'
                  : product.gender === 'female'
                    ? 'نسائي'
                    : 'للجنسين'}
              </strong>
            </div>
            <div className="inline-kv">
              <span>إجمالي المخزون</span>
              <strong>{Number(total).toLocaleString('ar-EG')}</strong>
            </div>
            <div className="inline-kv">
              <span>نطاق السعر</span>
              <strong>{product.variants.length ? priceRange(product) : '-'}</strong>
            </div>
          </div>
        </div>

        {(product.description || product.notes) && (
          <div className="details-grid">
            {product.description && (
              <div>
                <p className="section-title">الوصف</p>
                <p className="muted" style={{ marginTop: -4 }}>{product.description}</p>
              </div>
            )}
            {product.notes && (
              <div>
                <p className="section-title">ملاحظات داخلية</p>
                <p className="muted" style={{ marginTop: -4 }}>{product.notes}</p>
              </div>
            )}
          </div>
        )}

        <div className="details-divider" />

        <div>
          <p className="section-title">النسخ والألوان</p>
          {product.variants.length > 0 ? (
            <table className="variant-table">
              <thead>
                <tr>
                  <th>اللون</th>
                  <th>الكود</th>
                  <th>البيع</th>
                  <th>الهامش</th>
                  <th>المخزون</th>
                  <th>المقاسات</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map(v => {
                  const totalStock = variantTotalStock(v)
                  return (
                    <tr key={v._id}>
                      <td style={{ fontWeight: 500 }}>
                        <span className="color-chip" style={{ background: v.colorHex || '#000' }} />
                        {v.color}
                      </td>
                      <td className="mono ltr">{v.sku}</td>
                      <td>{fmt(v.sellPrice)}</td>
                      <td style={{ color: 'var(--green)' }}>{margin(v)}%</td>
                      <td style={{ fontWeight: 500 }}>{Number(totalStock).toLocaleString('ar-EG')}</td>
                      <td>
                        <div className="size-grid">
                          {v.sizes.map(sz => (
                            <div key={sz.size} className={`size-chip ${sz.stock === 0 ? 'zero' : ''}`}>
                              <span style={{ fontWeight: 500 }}>{sz.size}</span>
                              <span className="muted">x{sz.stock}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className="muted">لا توجد نسخ مضافة.</p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>إغلاق</button>
          <button className="btn ghost" onClick={onEdit}>تعديل</button>
          <button className="btn danger" onClick={onDelete}>حذف</button>
        </div>
      </div>
    </div>
  )
}

export default function ProductTable({ params, setParam, selected, setSelected, onEdit }) {
  const { data, isLoading } = useProducts(params)
  const { mutate: del } = useDeleteProduct()
  const [expanded, setExpanded] = useState(null)
  const [stockEdit, setStockEdit] = useState(null)
  const [preview, setPreview] = useState(null)

  const products = data?.products || []
  const totalPages = data?.totalPages || 1

  const toggleExpand = (id) => setExpanded(e => e === id ? null : id)
  const toggleSelect = (id) => setSelected(s =>
    s.includes(id) ? s.filter(x => x !== id) : [...s, id]
  )
  const toggleAll = (e) =>
    setSelected(e.target.checked ? products.map(p => p._id) : [])

  const handleSort = (col) => {
    if (params.sort === col) {
      setParam('order', params.order === 'asc' ? 'desc' : 'asc')
    } else {
      setParam('sort', col)
      setParam('order', 'asc')
    }
  }

  const handleDelete = (p) => {
    if (!confirm(`حذف "${p.name}"؟ لا يمكن التراجع.`)) return false
    del(p._id)
    return true
  }

  if (isLoading) return (
    <div className="card empty-state">جارٍ تحميل المنتجات...</div>
  )

  if (!products.length) return (
    <div className="card empty-state">
      <p style={{ fontSize: 32, marginBottom: 8 }}>ص</p>
      <p style={{ fontWeight: 500, marginBottom: 4 }}>لا توجد منتجات</p>
      <p className="muted">جرّب تعديل الفلاتر أو أضف أول منتج.</p>
    </div>
  )

  return (
    <>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36, padding: '9px 12px' }}>
                  <input
                    type="checkbox"
                    checked={products.length > 0 && products.every(p => selected.includes(p._id))}
                    onChange={toggleAll}
                  />
                </th>
                <th style={{ width: 60 }}></th>
                <SortTh col="name" label="المنتج" current={params.sort} dir={params.order} onSort={handleSort} />
                <SortTh col="brand" label="الماركة" current={params.sort} dir={params.order} onSort={handleSort} />
                <SortTh col="category" label="التصنيف" current={params.sort} dir={params.order} onSort={handleSort} />
                <th>النوع</th>
                <th>الفئة العمرية</th>
                <th>التوفر</th>
                <th>النسخ</th>
                <th>نطاق السعر</th>
                <th>إجمالي المخزون</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const isExp = expanded === p._id
                const isSel = selected.includes(p._id)
                const total = productTotalStock(p)
                const status = productStockStatus(p)
                const ageGroup = productAgeGroup(p)
                const isAvailable = p.available !== false
                const thumb = p.images?.[0]?.url

                return (
                  <>
                    <tr
                      key={p._id}
                      className="row-clickable"
                      style={{ background: isSel ? 'var(--bg)' : undefined }}
                      onClick={() => setPreview(p)}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleSelect(p._id)}
                          onClick={e => e.stopPropagation()}
                        />
                      </td>

                      <td>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 'var(--radius)',
                            overflow: 'hidden',
                            border: '1px solid var(--border)',
                            background: 'var(--bg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                          }}
                        >
                          {thumb
                            ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : 'ص'
                          }
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                        {p.description && (
                          <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                            {p.description.slice(0, 60)}{p.description.length > 60 ? '...' : ''}
                          </p>
                        )}
                      </td>
                      <td>{p.brand || <span className="muted">-</span>}</td>
                      <td>{p.category || <span className="muted">-</span>}</td>
                      <td>
                        {p.gender === 'male'
                          ? 'رجالي'
                          : p.gender === 'female'
                            ? 'نسائي'
                            : p.gender
                              ? 'للجنسين'
                              : <span className="muted">-</span>}
                      </td>
                      <td>{AGE_LABEL[ageGroup]}</td>
                      <td>
                        <span className={`badge ${isAvailable ? 'available' : 'unavailable'}`}>
                          {isAvailable ? 'متاح' : 'غير متاح'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn ghost sm"
                          onClick={(e) => { e.stopPropagation(); toggleExpand(p._id) }}
                          style={{ fontWeight: 500 }}
                        >
                          {Number(p.variants.length).toLocaleString('ar-EG')} نسخة
                          {' '}{isExp ? '^' : 'v'}
                        </button>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {p.variants.length ? priceRange(p) : <span className="muted">-</span>}
                      </td>
                      <td style={{ fontWeight: 500, color: total === 0 ? 'var(--red)' : undefined }}>
                        {Number(total).toLocaleString('ar-EG')}
                      </td>
                      <td>
                        <span className={`badge ${status}`}>{STATUS_LABEL[status]}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); onEdit(p) }}>تعديل</button>
                          <button className="btn ghost sm danger" onClick={(e) => { e.stopPropagation(); handleDelete(p) }}>حذف</button>
                        </div>
                      </td>
                    </tr>

                    {isExp && (
                      <VariantRows
                        key={`${p._id}-exp`}
                        product={p}
                        onStockEdit={setStockEdit}
                      />
                    )}
                  </>
                )
              })}
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
          <span>الإجمالي: {Number(data.total).toLocaleString('ar-EG')} منتج</span>
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

      {stockEdit && (
        <StockEditModal
          entry={stockEdit}
          onClose={() => setStockEdit(null)}
        />
      )}

      {preview && (
        <ProductDetailsModal
          product={preview}
          onClose={() => setPreview(null)}
          onEdit={() => { setPreview(null); onEdit(preview) }}
          onDelete={() => { if (handleDelete(preview)) setPreview(null) }}
        />
      )}
    </>
  )
}
