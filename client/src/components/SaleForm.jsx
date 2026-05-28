import { useMemo, useState } from 'react'
import { useInventoryByModel, useModelVariants, useModels } from '../hooks/useProducts'
import { useCreateSale } from '../hooks/useSales'
import { fmt } from '../utils/helpers'
import { getInventoryBySku } from '../api/products'

const EMPTY_LINE = () => ({
  _tempId: Math.random().toString(36).slice(2),
  modelId: '',
  variantId: '',
  sku: '',
  size: '',
  qty: 1,
  unitPrice: 0,
})

export default function SaleForm({ onClose }) {
  const { data, isLoading } = useModels()
  const { mutate: createSale, isPending } = useCreateSale()

  const [lines, setLines] = useState([EMPTY_LINE()])
  const [paidAmount, setPaidAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const models = data?.models || []
  const modelLookup = useMemo(
    () => new Map(models.map(m => [String(m._id), m])),
    [models]
  )

  const updateLine = (tempId, changes) => {
    setLines(prev => prev.map(line => line._tempId === tempId ? { ...line, ...changes } : line))
  }

  const addLine = () => setLines(prev => [...prev, EMPTY_LINE()])
  const removeLine = (tempId) => setLines(prev => prev.filter(line => line._tempId !== tempId))

  const totals = useMemo(() => {
    let subtotal = 0
    for (const line of lines) {
      subtotal += Number(line.unitPrice || 0) * Number(line.qty || 0)
    }
    const total = Math.max(subtotal, 0)
    const paid = Math.min(Number(paidAmount || 0), total)
    const balance = Math.max(total - paid, 0)
    return { subtotal, total, paid, balance }
  }, [lines, paidAmount])

  const requiresCustomer = totals.balance > 0

  const submit = () => {
    if (lines.some(l => !l.modelId || !l.variantId || !l.sku || !l.qty)) {
      return alert('يرجى إكمال كل الأصناف المطلوبة')
    }

    if (requiresCustomer && (!customerName.trim() || !customerPhone.trim())) {
      return alert('يرجى إدخال بيانات العميل للمدفوع الجزئي')
    }

    const payload = {
      items: lines.map(line => {
        return {
          sku: line.sku,
          qty: Number(line.qty),
          unitPrice: Number(line.unitPrice || 0),
        }
      }),
      paidAmount: Number(paidAmount || 0),
      paymentMethod,
      customer: requiresCustomer ? { name: customerName, phone: customerPhone } : undefined,
    }

    createSale(payload, { onSuccess: onClose })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sale-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>عملية بيع جديدة</h2>
          <button className="btn ghost icon" onClick={onClose}>X</button>
        </div>

        {isLoading ? (
          <p className="muted">جارٍ تحميل المنتجات...</p>
        ) : (
          <div className="sale-lines">
            {lines.map((line, idx) => (
              <SaleLine
                key={line._tempId}
                line={line}
                modelLookup={modelLookup}
                onChange={updateLine}
                onRemove={removeLine}
                canRemove={lines.length > 1}
                showDivider={idx < lines.length - 1}
              />
            ))}

            <button className="btn sm" onClick={addLine}>إضافة صنف</button>
          </div>
        )}

        <div className="details-divider" />

        <div className="sale-summary">
          <div className="inline-kv">
            <span>الإجمالي</span>
            <strong>{fmt(totals.total)}</strong>
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label>المبلغ المدفوع الآن</label>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>طريقة الدفع</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="cash">نقدي</option>
                <option value="card">بطاقة</option>
              </select>
            </div>
            <div className="form-group">
              <label>المتبقي</label>
              <input value={fmt(totals.balance)} readOnly className="ltr" />
            </div>
          </div>
        </div>

        {requiresCustomer && (
          <div className="sale-customer">
            <p className="section-title">بيانات العميل</p>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label>اسم العميل</label>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>هاتف العميل</label>
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="ltr" />
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>إلغاء</button>
          <button className="btn primary" onClick={submit} disabled={isPending}>
            {isPending ? 'جارٍ الحفظ...' : 'تسجيل البيع'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SaleLine({ line, modelLookup, onChange, onRemove, canRemove, showDivider }) {
  const { data: variantsData } = useModelVariants(line.modelId)
  const { data: inventoryData } = useInventoryByModel(line.modelId)
  const [skuInput, setSkuInput] = useState('')
  const [isLookup, setIsLookup] = useState(false)

  const variants = variantsData?.variants || []
  const inventory = inventoryData?.inventory || []

  const variantLookup = useMemo(
    () => new Map(variants.map(v => [String(v._id), v])),
    [variants]
  )

  const getSizeOptions = (variantId) => {
    if (!variantId) return []
    return inventory
      .filter(item => String(item.variantId) === String(variantId))
      .map(item => ({
        sku: item.sku,
        size: item.euSize,
        available: item.availableQuantity,
      }))
      .sort((a, b) => a.size - b.size)
  }

  const sizeOptions = useMemo(
    () => getSizeOptions(line.variantId),
    [inventory, line.variantId]
  )

  const activeSize = sizeOptions.find(s => s.sku === line.sku)
  const activeVariant = variantLookup.get(String(line.variantId))
  const unitPrice = Number(activeVariant?.sellPrice || 0)

  const handleModelChange = (modelId) => {
    onChange(line._tempId, { modelId, variantId: '', sku: '', size: '', unitPrice: 0 })
  }

  const handleVariantChange = (variantId) => {
    const nextOptions = getSizeOptions(variantId)
    const first = nextOptions[0]
    const variant = variantLookup.get(String(variantId))
    onChange(line._tempId, {
      variantId,
      sku: first?.sku || '',
      size: first ? String(first.size) : '',
      unitPrice: Number(variant?.sellPrice || 0),
    })
  }

  const handleSizeChange = (sku) => {
    const selected = sizeOptions.find(s => s.sku === sku)
    onChange(line._tempId, {
      sku,
      size: selected ? String(selected.size) : '',
    })
  }

  const handleSkuLookup = async () => {
    const code = skuInput.trim().toUpperCase()
    if (!code) return
    try {
      setIsLookup(true)
      const { data } = await getInventoryBySku(code)
      const variant = data?.variantId
      const model = variant?.productModelId
      if (!variant || !model) {
        throw new Error('Invalid SKU data')
      }
      onChange(line._tempId, {
        modelId: String(model._id),
        variantId: String(variant._id),
        sku: data.sku,
        size: String(data.euSize),
        unitPrice: Number(variant.sellPrice || model.sellPrice || 0),
      })
    } catch (err) {
      alert('لم يتم العثور على SKU')
    } finally {
      setIsLookup(false)
    }
  }

  return (
    <div className="sale-line">
      <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
        <div className="form-group">
          <label>بحث سريع بـ SKU</label>
          <input
            value={skuInput}
            onChange={e => setSkuInput(e.target.value)}
            placeholder="مثال: KHT-NB550-WHG-42"
            className="ltr"
          />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn sm" onClick={handleSkuLookup} disabled={isLookup}>
            {isLookup ? 'جارٍ البحث...' : 'بحث'}
          </button>
        </div>
      </div>
      <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10 }}>
        <div className="form-group">
          <label>الموديل</label>
          <select
            value={line.modelId}
            onChange={e => handleModelChange(e.target.value)}
          >
            <option value="">اختر موديل</option>
            {Array.from(modelLookup.values()).map(model => (
              <option key={model._id} value={model._id}>
                {model.brand ? `${model.brand} ` : ''}{model.modelName} ({model.modelId})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>اللون</label>
          <select
            value={line.variantId}
            onChange={e => handleVariantChange(e.target.value)}
            disabled={!line.modelId}
          >
            <option value="">اختر لونا</option>
            {variants.map(variant => (
              <option key={variant._id} value={variant._id}>
                {variant.colorName} ({variant.colorCode}) - {fmt(variant.sellPrice || 0)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>المقاس</label>
          <select
            value={line.sku}
            onChange={e => handleSizeChange(e.target.value)}
            disabled={!line.variantId}
          >
            <option value="">اختر مقاسا</option>
            {sizeOptions.map(opt => (
              <option key={opt.sku} value={opt.sku} disabled={opt.available <= 0}>
                {opt.size} (متاح {opt.available})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>الكمية</label>
          <input
            type="number"
            min="1"
            max={activeSize?.available || undefined}
            value={line.qty}
            onChange={e => onChange(line._tempId, { qty: Number(e.target.value) })}
            disabled={!line.sku}
          />
        </div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginTop: 8 }}>
        <div className="form-group">
          <label>السعر</label>
          <input value={fmt(line.unitPrice || unitPrice)} readOnly className="ltr" />
        </div>
        <div className="form-group">
          <label>الكود (SKU)</label>
          <input value={line.sku || ''} readOnly className="ltr" />
        </div>
        <div className="form-group">
          <label>الإجمالي</label>
          <input value={fmt((line.unitPrice || unitPrice) * Number(line.qty || 0))} readOnly className="ltr" />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          {canRemove && (
            <button className="btn ghost sm danger" onClick={() => onRemove(line._tempId)}>
              إزالة
            </button>
          )}
        </div>
      </div>

      {showDivider && <div className="details-divider" style={{ marginTop: 12 }} />}
    </div>
  )
}
