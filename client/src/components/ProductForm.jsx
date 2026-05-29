import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  useCreateInventory,
  useCreateModel,
  useCreateVariant,
  useInventoryByModel,
  useModelVariants,
  useUpdateInventoryStock,
  useUpdateModel,
  useUpdateVariant,
} from '../hooks/useProducts'
import { uploadImages } from '../api/products'
import { expandSizeRange } from '../utils/helpers'
import ImageUploader from './ImageUploader'

const EMPTY_VARIANT = () => ({
  _tempId: Math.random().toString(36).slice(2),
  colorName: '',
  colorCode: '',
  costPrice: '',
  sellPrice: '',
  imageSet: [],
  newFiles: [],
  sizes: [],
})

export default function ProductForm({ product, onClose }) {
  const isEdit = !!product._id

  const { data: variantsData } = useModelVariants(product._id)
  const { data: inventoryData } = useInventoryByModel(product._id)

  const { mutateAsync: createModel } = useCreateModel()
  const { mutateAsync: updateModel } = useUpdateModel()
  const { mutateAsync: createVariant } = useCreateVariant()
  const { mutateAsync: updateVariant } = useUpdateVariant()
  const { mutateAsync: createInventory } = useCreateInventory()
  const { mutateAsync: updateInventoryStock } = useUpdateInventoryStock()

  const [saving, setSaving] = useState(false)

  const [modelId, setModelId] = useState(product.modelId || '')
  const [brand, setBrand] = useState(product.brand || '')
  const [modelName, setModelName] = useState(product.modelName || '')
  const [category, setCategory] = useState(product.category || '')
  const [gender, setGender] = useState(product.gender || 'unisex')
  const [description, setDescription] = useState(product.description || '')
  const [material, setMaterial] = useState(product.material || '')
  const [supplier, setSupplier] = useState(product.supplier || '')
  const [releaseSeason, setReleaseSeason] = useState(product.releaseSeason || '')
  const [tags, setTags] = useState((product.tags || []).join(', '))
  const [imageSet, setImageSet] = useState(product.imageSet || [])
  const [modelNewFiles, setModelNewFiles] = useState([])
  const [initialized, setInitialized] = useState(false)

  const inventory = inventoryData?.inventory || []
  const sizesByVariant = useMemo(() => {
    const map = new Map()
    for (const item of inventory) {
      const key = String(item.variantId)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push({
        sku: item.sku,
        euSize: item.euSize,
        quantity: item.quantity,
      })
    }
    return map
  }, [inventory])

  const [variants, setVariants] = useState([EMPTY_VARIANT()])

  useEffect(() => {
    if (!isEdit || initialized) return
    const variantList = variantsData?.variants || []
    const mapped = variantList.map(v => ({
      _tempId: v._id,
      _id: v._id,
      colorName: v.colorName || '',
      colorCode: v.colorCode || '',
      costPrice: v.costPrice ?? '',
      sellPrice: v.sellPrice ?? '',
      imageSet: v.imageSet || [],
        newFiles: [],
      sizes: sizesByVariant.get(String(v._id)) || [],
    }))
    setVariants(mapped.length ? mapped : [EMPTY_VARIANT()])
    setInitialized(true)
  }, [isEdit, initialized, variantsData, sizesByVariant])

  const updateVariantLocal = (tempId, changes) => {
    setVariants(vs => vs.map(v => {
      if (v._tempId !== tempId) return v
      return { ...v, ...changes }
    }))
  }

  const removeModelImage = (publicId) => {
    setImageSet(prev => prev.filter(img => img.publicId !== publicId))
  }

  const addVariant = () =>
    setVariants(vs => [...vs, EMPTY_VARIANT()])

  const removeVariant = (tempId) =>
    setVariants(vs => vs.filter(v => v._tempId !== tempId))

  const setSizeRange = (tempId, rangeStr) => {
    const sizes = expandSizeRange(rangeStr).map(s => ({ euSize: s, quantity: 0 }))
    updateVariant(tempId, { sizes, _sizeRange: rangeStr })
  }

  const updateSizeQty = (tempId, size, quantity) => {
    setVariants(vs => vs.map(v => {
      if (v._tempId !== tempId) return v
      return {
        ...v,
        sizes: v.sizes.map(s => String(s.euSize) === String(size)
          ? { ...s, quantity: Number(quantity) }
          : s),
      }
    }))
  }

  const addSingleSize = (tempId, size) => {
    if (!size.trim()) return
    setVariants(vs => vs.map(v => {
      if (v._tempId !== tempId) return v
      if (v.sizes.find(s => String(s.euSize) === String(size))) return v
      return { ...v, sizes: [...v.sizes, { euSize: size.trim(), quantity: 0 }] }
    }))
  }

  const removeSize = (tempId, size) => {
    setVariants(vs => vs.map(v => {
      if (v._tempId !== tempId) return v
      return { ...v, sizes: v.sizes.filter(s => String(s.euSize) !== String(size)) }
    }))
  }

  const submit = async () => {
    if (!modelId.trim() || !modelName.trim()) return alert('كود الموديل والاسم مطلوبان')
    if (variants.some(v => !v.colorName.trim() || !v.colorCode.trim())) {
      return alert('كل لون يحتاج اسم وكود')
    }

    setSaving(true)
    try {
      let modelDoc = product
      const modelUploads = modelNewFiles.length
        ? (await uploadImages(modelNewFiles, 'product-models')).data.assets
        : []
      const modelImageSet = [...imageSet, ...modelUploads]
      const modelPayload = {
        modelId: modelId.trim().toUpperCase(),
        brand,
        modelName,
        category,
        gender,
        description,
        material,
        supplier,
        releaseSeason,
        imageSet: modelImageSet,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      }

      if (isEdit) {
        await updateModel({ id: product._id, payload: modelPayload })
      } else {
        const created = await createModel(modelPayload)
        modelDoc = created.data
      }

      const variantIdMap = new Map()
      for (const variant of variants) {
        const variantUploads = variant.newFiles?.length
          ? (await uploadImages(variant.newFiles, 'product-variants')).data.assets
          : []
        const variantImageSet = [...variant.imageSet, ...variantUploads]
        const payload = {
          colorName: variant.colorName,
          colorCode: variant.colorCode,
          costPrice: Number(variant.costPrice || 0),
          sellPrice: Number(variant.sellPrice || 0),
          imageSet: variantImageSet,
        }

        if (variant._id) {
          await updateVariant({ modelId: modelDoc._id, variantId: variant._id, payload })
          variantIdMap.set(variant._tempId, variant._id)
        } else {
          const created = await createVariant({ modelId: modelDoc._id, payload })
          variantIdMap.set(variant._tempId, created.data._id)
        }
      }

      for (const variant of variants) {
        const variantId = variantIdMap.get(variant._tempId)
        for (const sizeEntry of variant.sizes) {
          if (!sizeEntry.euSize && sizeEntry.euSize !== 0) continue
          const qty = Number(sizeEntry.quantity || 0)
          if (sizeEntry.sku) {
            await updateInventoryStock({ sku: sizeEntry.sku, payload: { quantity: qty } })
          } else {
            await createInventory({
              variantId,
              euSize: Number(sizeEntry.euSize),
              quantity: qty,
            })
          }
        }
      }

      toast.success(isEdit ? 'تم تحديث الموديل' : 'تم إنشاء الموديل')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حفظ الموديل')
    } finally {
      setSaving(false)
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
          <p className="section-title">بيانات الموديل</p>
          <div className="form-grid">
            <div className="form-group full">
              <label>اسم الموديل *</label>
              <input value={modelName} onChange={e => setModelName(e.target.value)} placeholder="مثال: NB 550" />
            </div>
            <div className="form-group">
              <label>كود الموديل *</label>
              <input
                value={modelId}
                onChange={e => setModelId(e.target.value)}
                placeholder="مثال: NB550"
                className="ltr"
                disabled={isEdit}
              />
            </div>
            <div className="form-group">
              <label>الماركة</label>
              <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="مثال: New Balance" />
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
              <label>الخامة</label>
              <input value={material} onChange={e => setMaterial(e.target.value)} placeholder="مثال: Leather" />
            </div>
            <div className="form-group">
              <label>المورد</label>
              <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="اسم المورد" />
            </div>
            <div className="form-group">
              <label>الموسم</label>
              <input value={releaseSeason} onChange={e => setReleaseSeason(e.target.value)} placeholder="مثال: SS24" />
            </div>
            <div className="form-group full">
              <label>الوسوم</label>
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2" />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label className="section-title" style={{ fontSize: 11 }}>صور الموديل (عامة / براندنج)</label>
            <ImageUploader
              existing={imageSet}
              onFilesChange={setModelNewFiles}
              onRemoveExisting={removeModelImage}
            />
          </div>
        </section>

        <section style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <p className="section-title" style={{ flex: 1 }}>ألوان الموديل</p>
            <button className="btn sm" onClick={addVariant}>إضافة نسخة</button>
          </div>

          {variants.map((v, idx) => (
            <VariantBlock
              key={v._tempId}
              variant={v}
              index={idx}
              canRemove={variants.length > 1}
              onChange={(changes) => updateVariantLocal(v._tempId, changes)}
              onRemove={() => removeVariant(v._tempId)}
              onSetSizeRange={(r) => setSizeRange(v._tempId, r)}
              onUpdateSizeStock={(size, stock) => updateSizeQty(v._tempId, size, stock)}
              onAddSize={(size) => addSingleSize(v._tempId, size)}
              onRemoveSize={(size) => removeSize(v._tempId, size)}
            />
          ))}
        </section>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>إلغاء</button>
          <button className="btn primary" onClick={submit} disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التغييرات' : 'إنشاء الموديل'}
          </button>
        </div>
      </div>
    </div>
  )
}

function VariantBlock({
  variant,
  index,
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

  const removeImage = (publicId) => {
    onChange({ imageSet: variant.imageSet.filter(img => img.publicId !== publicId) })
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
          <label>اسم اللون *</label>
          <input
            value={variant.colorName}
            onChange={e => onChange({ colorName: e.target.value })}
            placeholder="مثال: White/Green"
          />
        </div>
        <div className="form-group">
          <label>كود اللون *</label>
          <input
            className="ltr"
            value={variant.colorCode}
            onChange={e => onChange({ colorCode: e.target.value })}
            placeholder="مثال: WHG"
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
          <label className="section-title" style={{ fontSize: 11 }}>صور النسخة</label>
          <ImageUploader
            existing={variant.imageSet}
            onFilesChange={(files) => onChange({ newFiles: files })}
            onRemoveExisting={removeImage}
          />
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
                key={sz.sku || sz.euSize}
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
                <span style={{ fontWeight: 500 }}>{sz.euSize}</span>
                <input
                  type="number"
                  min="0"
                  value={sz.quantity}
                  onChange={e => onUpdateSizeStock(sz.euSize, e.target.value)}
                  style={{
                    width: 44,
                    height: 24,
                    padding: '0 4px',
                    textAlign: 'center',
                    fontSize: 12,
                  }}
                />
                {sz.sku && (
                  <span className="muted" style={{ fontSize: 10 }}>
                    {sz.sku}
                  </span>
                )}
                <button
                  className="btn ghost"
                  style={{ padding: '0 2px', fontSize: 11, height: 20, border: 'none', color: 'var(--hint)' }}
                  onClick={() => onRemoveSize(sz.euSize)}
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
