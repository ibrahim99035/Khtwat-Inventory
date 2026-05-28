import { useState } from 'react'
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts'
import { generateSku, expandSizeRange } from '../utils/helpers'
import ImageUploader from './ImageUploader'

const EMPTY_VARIANT = () => ({
  _tempId: Math.random().toString(36).slice(2),
  sku: '',
  color: '',
  colorHex: '#000000',
  costPrice: '',
  sellPrice: '',
  lowStockAt: 5,
  sizes: [],
})

export default function ProductForm({ product, onClose }) {
  const isEdit = !!product._id

  const { mutate: create, isPending: creating } = useCreateProduct()
  const { mutate: update, isPending: updating } = useUpdateProduct()
  const isPending = creating || updating

  const [name, setName] = useState(product.name || '')
  const [brand, setBrand] = useState(product.brand || '')
  const [category, setCategory] = useState(product.category || '')
  const [description, setDescription] = useState(product.description || '')
  const [notes, setNotes] = useState(product.notes || '')
  const [gender, setGender] = useState(product.gender || 'unisex')
  const [available, setAvailable] = useState(
    product.available !== undefined ? product.available : true
  )

  const [existingImages, setExistingImages] = useState(product.images || [])
  const [removedPublicIds, setRemovedPublicIds] = useState([])
  const [newImageFiles, setNewImageFiles] = useState([])

  const [variants, setVariants] = useState(
    product.variants?.length
      ? product.variants.map(v => ({ ...v, _tempId: v._id }))
      : [EMPTY_VARIANT()]
  )

  const updateVariant = (tempId, changes) => {
    setVariants(vs => vs.map(v => {
      if (v._tempId !== tempId) return v
      return { ...v, ...changes }
    }))
  }

  const addVariant = () =>
    setVariants(vs => [...vs, EMPTY_VARIANT()])

  const removeVariant = (tempId) =>
    setVariants(vs => vs.filter(v => v._tempId !== tempId))

  const setSizeRange = (tempId, rangeStr) => {
    const sizes = expandSizeRange(rangeStr).map(s => ({ size: s, stock: 0 }))
    updateVariant(tempId, { sizes, _sizeRange: rangeStr })
  }

  const updateSizeStock = (tempId, size, stock) => {
    setVariants(vs => vs.map(v => {
      if (v._tempId !== tempId) return v
      return {
        ...v,
        sizes: v.sizes.map(s => s.size === size ? { ...s, stock: Number(stock) } : s),
      }
    }))
  }

  const addSingleSize = (tempId, size) => {
    if (!size.trim()) return
    setVariants(vs => vs.map(v => {
      if (v._tempId !== tempId) return v
      if (v.sizes.find(s => s.size === size)) return v
      return { ...v, sizes: [...v.sizes, { size: size.trim(), stock: 0 }] }
    }))
  }

  const removeSize = (tempId, size) => {
    setVariants(vs => vs.map(v => {
      if (v._tempId !== tempId) return v
      return { ...v, sizes: v.sizes.filter(s => s.size !== size) }
    }))
  }

  const submit = () => {
    if (!name.trim()) return alert('اسم المنتج مطلوب')
    if (variants.some(v => !v.sku.trim() || !v.color.trim())) {
      return alert('كل نسخة تحتاج كود ولون')
    }

    const cleanVariants = variants.map(({ _tempId, _sizeRange, ...rest }) => rest)

    const fd = new FormData()
    fd.append('name', name)
    fd.append('brand', brand)
    fd.append('category', category)
    fd.append('description', description)
    fd.append('notes', notes)
    fd.append('gender', gender)
    fd.append('available', String(available))
    fd.append('variants', JSON.stringify(cleanVariants))

    if (removedPublicIds.length) {
      fd.append('removeImages', JSON.stringify(removedPublicIds))
    }
    for (const file of newImageFiles) {
      fd.append('images', file)
    }

    if (isEdit) {
      update({ id: product._id, formData: fd }, { onSuccess: onClose })
    } else {
      create(fd, { onSuccess: onClose })
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 720 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{isEdit ? 'تعديل المنتج' : 'إضافة منتج'}</h2>
          <button className="btn ghost icon" onClick={onClose}>X</button>
        </div>

        <section>
          <p className="section-title">معلومات المنتج</p>
          <div className="form-grid">
            <div className="form-group full">
              <label>الاسم *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: Air Max 90" />
            </div>
            <div className="form-group">
              <label>الماركة</label>
              <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="مثال: Nike" />
            </div>
            <div className="form-group">
              <label>التصنيف</label>
              <input value={category} onChange={e => setCategory(e.target.value)} placeholder="مثال: Sneakers" />
            </div>
            <div className="form-group">
              <label>النوع</label>
              <select value={gender} onChange={e => setGender(e.target.value)}>
                <option value="unisex">للجنسين</option>
                <option value="male">رجالي</option>
                <option value="female">نسائي</option>
              </select>
            </div>
            <div className="form-group">
              <label>التوفر</label>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={e => setAvailable(e.target.checked)}
                />
                <span className="slider" />
                <span className="switch-label">
                  {available ? 'متاح' : 'غير متاح'}
                </span>
              </label>
            </div>
            <div className="form-group full">
              <label>الوصف</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="وصف مختصر..."
                style={{ height: 60 }}
              />
            </div>
            <div className="form-group full">
              <label>ملاحظات (داخلية)</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات داخلية..." />
            </div>
          </div>
        </section>

        <section style={{ marginTop: '1.5rem' }}>
          <p className="section-title">الصور</p>
          <ImageUploader
            existing={existingImages}
            onFilesChange={setNewImageFiles}
            onRemoveExisting={(pid) => {
              setExistingImages(imgs => imgs.filter(i => i.publicId !== pid))
              setRemovedPublicIds(ids => [...ids, pid])
            }}
          />
        </section>

        <section style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <p className="section-title" style={{ flex: 1 }}>نسخ الألوان</p>
            <button className="btn sm" onClick={addVariant}>إضافة نسخة</button>
          </div>

          {variants.map((v, idx) => (
            <VariantBlock
              key={v._tempId}
              variant={v}
              index={idx}
              productName={name}
              canRemove={variants.length > 1}
              onChange={(changes) => updateVariant(v._tempId, changes)}
              onRemove={() => removeVariant(v._tempId)}
              onSetSizeRange={(r) => setSizeRange(v._tempId, r)}
              onUpdateSizeStock={(size, stock) => updateSizeStock(v._tempId, size, stock)}
              onAddSize={(size) => addSingleSize(v._tempId, size)}
              onRemoveSize={(size) => removeSize(v._tempId, size)}
            />
          ))}
        </section>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>إلغاء</button>
          <button className="btn primary" onClick={submit} disabled={isPending}>
            {isPending ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التغييرات' : 'إنشاء المنتج'}
          </button>
        </div>
      </div>
    </div>
  )
}

function VariantBlock({
  variant,
  index,
  productName,
  canRemove,
  onChange,
  onRemove,
  onSetSizeRange,
  onUpdateSizeStock,
  onAddSize,
  onRemoveSize,
}) {
  const [sizeInput, setSizeInput] = useState('')
  const [rangeInput, setRangeInput] = useState(variant._sizeRange || '')

  const autoSku = () => {
    onChange({ sku: generateSku(productName, variant.color) })
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1rem',
        marginBottom: '1rem',
        background: 'var(--bg)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 500, fontSize: 13 }}>نسخة {index + 1}</span>
        {canRemove && (
          <button className="btn ghost sm danger" onClick={onRemove}>إزالة</button>
        )}
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div className="form-group">
          <label>اللون *</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={variant.color}
              onChange={e => onChange({ color: e.target.value })}
              placeholder="مثال: Black/White"
            />
            <input
              className="color-input"
              type="color"
              value={variant.colorHex || '#000000'}
              onChange={e => onChange({ colorHex: e.target.value })}
              title="اختر اللون"
            />
          </div>
        </div>
        <div className="form-group">
          <label>الكود (SKU) *</label>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              className="ltr"
              value={variant.sku}
              onChange={e => onChange({ sku: e.target.value })}
              placeholder="مثال: AM90-BLK"
              style={{ flex: 1 }}
            />
            <button className="btn sm" type="button" onClick={autoSku} title="توليد تلقائي">تلقائي</button>
          </div>
        </div>
        <div className="form-group">
          <label>تنبيه انخفاض المخزون عند</label>
          <input
            type="number"
            min="0"
            value={variant.lowStockAt}
            onChange={e => onChange({ lowStockAt: Number(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>سعر التكلفة (ج.م) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={variant.costPrice}
            onChange={e => onChange({ costPrice: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="form-group">
          <label>سعر البيع (ج.م) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={variant.sellPrice}
            onChange={e => onChange({ sellPrice: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 8 }}>
          المقاسات والمخزون
        </p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <input
            placeholder="نطاق مثل 38-44"
            value={rangeInput}
            onChange={e => setRangeInput(e.target.value)}
            style={{ width: 160 }}
          />
          <button className="btn sm" onClick={() => onSetSizeRange(rangeInput)}>
            تطبيق النطاق
          </button>
          <span className="muted" style={{ fontSize: 12, lineHeight: '30px' }}>أو</span>
          <input
            placeholder="مقاس مفرد مثل 45"
            value={sizeInput}
            onChange={e => setSizeInput(e.target.value)}
            style={{ width: 160 }}
            onKeyDown={e => {
              if (e.key === 'Enter') { onAddSize(sizeInput); setSizeInput('') }
            }}
          />
          <button className="btn sm" onClick={() => { onAddSize(sizeInput); setSizeInput('') }}>
            إضافة
          </button>
        </div>

        {variant.sizes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {variant.sizes.map(sz => (
              <div
                key={sz.size}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '3px 6px 3px 8px',
                  background: 'var(--surface)',
                  fontSize: 12,
                }}
              >
                <span style={{ fontWeight: 500 }}>{sz.size}</span>
                <input
                  type="number"
                  min="0"
                  value={sz.stock}
                  onChange={e => onUpdateSizeStock(sz.size, e.target.value)}
                  style={{
                    width: 44,
                    height: 24,
                    padding: '0 4px',
                    textAlign: 'center',
                    fontSize: 12,
                  }}
                />
                <button
                  className="btn ghost"
                  style={{ padding: '0 2px', fontSize: 11, height: 20, border: 'none', color: 'var(--hint)' }}
                  onClick={() => onRemoveSize(sz.size)}
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
