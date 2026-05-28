import { Fragment, useMemo, useState } from 'react'
import {
  useAdjustInventoryStock,
  useModelVariants,
  useModels,
  useUpdateInventoryMeta,
  useUpdateInventoryStock,
} from '../hooks/useProducts'
import { fmt } from '../utils/helpers'
import * as api from '../api/products'
import { useQueries } from '@tanstack/react-query'

const STATUS_LABEL = { in: 'متوفر', low: 'منخفض', out: 'نافد' }

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

const toNumber = (val) => Number(val || 0)

const computeInventoryStats = (inventory = []) => {
  const total = inventory.reduce((sum, item) => sum + toNumber(item.quantity), 0)
  const available = inventory.reduce((sum, item) => sum + toNumber(item.availableQuantity), 0)
  const low = inventory.some(item => item.availableQuantity > 0 && item.availableQuantity <= item.lowStockAt)
  const status = available === 0 ? 'out' : low ? 'low' : 'in'
  return { total, available, status }
}

const marginPct = (cost, sell) => {
  if (!sell || sell <= 0) return 0
  return Math.round(((sell - cost) / sell) * 100)
}

function VariantRows({ model, inventory, onStockEdit }) {
  const { data: variantsData } = useModelVariants(model._id)
  const variants = variantsData?.variants || []

  const sizesByVariant = useMemo(() => {
    const map = new Map()
    for (const item of inventory) {
      const key = String(item.variantId)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(item)
    }
    return map
  }, [inventory])

  return (
    <tr className="expand-row">
      <td colSpan={9} style={{ padding: '0 0 0 48px' }}>
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
              {variants.map(v => {
                const sizes = sizesByVariant.get(String(v._id)) || []
                const total = sizes.reduce((sum, s) => sum + toNumber(s.quantity), 0)
                const status = computeInventoryStats(sizes).status
                return (
                  <tr key={v._id}>
                    <td style={{ fontWeight: 500 }}>{v.colorName}</td>
                    <td className="mono ltr">{v.colorCode}</td>
                    <td>{fmt(v.costPrice)}</td>
                    <td>{fmt(v.sellPrice)}</td>
                    <td style={{ color: 'var(--green)' }}>{marginPct(v.costPrice, v.sellPrice)}%</td>
                    <td>
                      <div className="size-grid">
                        {sizes.map(sz => (
                          <div
                            key={sz.sku}
                            className={`size-chip ${sz.availableQuantity === 0 ? 'zero' : sz.availableQuantity <= sz.lowStockAt ? 'low' : ''}`}
                            title={`SKU: ${sz.sku}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => onStockEdit({ model, variant: v, sizeEntry: sz })}
                          >
                            <span style={{ fontWeight: 500 }}>{sz.euSize}</span>
                            <span className="muted">متاح {sz.availableQuantity}</span>
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
  const { sizeEntry, variant, model } = entry
  const [mode, setMode] = useState('set')
  const [val, setVal] = useState(String(sizeEntry.quantity))
  const [delta, setDelta] = useState('0')
  const [reason, setReason] = useState('restock')
  const [note, setNote] = useState('')
  const [lowStockAt, setLowStockAt] = useState(String(sizeEntry.lowStockAt ?? 5))
  const [warehouseLocation, setWarehouseLocation] = useState(sizeEntry.warehouseLocation || '')
  const [barcode, setBarcode] = useState(sizeEntry.barcode || '')
  const [flags, setFlags] = useState({
    lowStock: sizeEntry.flags?.lowStock || false,
    featured: sizeEntry.flags?.featured || false,
    trending: sizeEntry.flags?.trending || false,
    deadStock: sizeEntry.flags?.deadStock || false,
    fastSelling: sizeEntry.flags?.fastSelling || false,
    highMargin: sizeEntry.flags?.highMargin || false,
    requiresRestock: sizeEntry.flags?.requiresRestock || false,
    hidden: sizeEntry.flags?.hidden || false,
    archived: sizeEntry.flags?.archived || false,
  })

  const { mutateAsync: setStock, isPending: isSetting } = useUpdateInventoryStock()
  const { mutateAsync: adjustStock, isPending: isAdjusting } = useAdjustInventoryStock()
  const { mutateAsync: updateMeta, isPending: isUpdatingMeta } = useUpdateInventoryMeta()

  const isPending = isSetting || isAdjusting || isUpdatingMeta

  const save = async () => {
    if (mode === 'set') {
      await setStock({ sku: sizeEntry.sku, payload: { quantity: Number(val) } })
    } else {
      await adjustStock({
        sku: sizeEntry.sku,
        payload: { delta: Number(delta), reason, note },
      })
    }

    await updateMeta({
      sku: sizeEntry.sku,
      payload: {
        lowStockAt: Number(lowStockAt),
        warehouseLocation,
        barcode,
        flags,
      },
    })

    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 320 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>تعديل المخزون</h2>
          <button className="btn ghost icon" onClick={onClose}>X</button>
        </div>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          {model.modelName} - {variant.colorName} - مقاس {sizeEntry.euSize}
        </p>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label>المتاح</label>
            <input value={sizeEntry.availableQuantity ?? 0} readOnly className="ltr" />
          </div>
          <div className="form-group">
            <label>محجوز</label>
            <input value={sizeEntry.reservedQuantity ?? 0} readOnly className="ltr" />
          </div>
          <div className="form-group">
            <label>تالف</label>
            <input value={sizeEntry.damagedQuantity ?? 0} readOnly className="ltr" />
          </div>
          <div className="form-group">
            <label>الإجمالي</label>
            <input value={sizeEntry.quantity ?? 0} readOnly className="ltr" />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 8 }}>
          <label>طريقة التعديل</label>
          <select value={mode} onChange={e => setMode(e.target.value)}>
            <option value="set">تعيين كمية جديدة</option>
            <option value="adjust">تعديل بالزيادة/النقصان</option>
          </select>
        </div>

        {mode === 'set' ? (
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
        ) : (
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label>التغيير (+/-)</label>
              <input
                type="number"
                value={delta}
                onChange={e => setDelta(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>السبب</label>
              <select value={reason} onChange={e => setReason(e.target.value)}>
                <option value="restock">توريد</option>
                <option value="return">مرتجع</option>
                <option value="damage">تالف</option>
                <option value="transfer">تحويل مخزن</option>
                <option value="audit">جرد</option>
                <option value="sale_correction">تصحيح بيع</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>ملاحظة</label>
              <input value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
        )}

        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
          <div className="form-group">
            <label>حد التنبيه</label>
            <input
              type="number"
              min="0"
              value={lowStockAt}
              onChange={e => setLowStockAt(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>المخزن</label>
            <input value={warehouseLocation} onChange={e => setWarehouseLocation(e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>الباركود</label>
            <input value={barcode} onChange={e => setBarcode(e.target.value)} className="ltr" />
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <p className="section-title">إشارات الأعمال</p>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {Object.keys(flags).map(key => (
              <label key={key} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={flags[key]}
                  onChange={e => setFlags(prev => ({ ...prev, [key]: e.target.checked }))}
                />
                {key}
              </label>
            ))}
          </div>
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

function ProductDetailsModal({ model, inventory, onClose, onEdit }) {
  const stats = computeInventoryStats(inventory)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal product-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>تفاصيل الموديل</h2>
          <button className="btn ghost icon" onClick={onClose}>X</button>
        </div>

        <div className="product-hero">
          <div className="product-image">
            <span>ص</span>
          </div>
          <div className="product-meta">
            <h3>{model.modelName}</h3>
            <div className="pill-row">
              <span className={`badge ${stats.status}`}>{STATUS_LABEL[stats.status]}</span>
            </div>
            <div className="inline-kv">
              <span>كود الموديل</span>
              <strong className="ltr">{model.modelId || '-'}</strong>
            </div>
            <div className="inline-kv">
              <span>الماركة</span>
              <strong>{model.brand || '-'}</strong>
            </div>
            <div className="inline-kv">
              <span>التصنيف</span>
              <strong>{model.category || '-'}</strong>
            </div>
            <div className="inline-kv">
              <span>إجمالي المخزون</span>
              <strong>{Number(stats.total).toLocaleString('ar-EG')}</strong>
            </div>
          </div>
        </div>

        {model.description && (
          <div className="details-grid">
            <div>
              <p className="section-title">الوصف</p>
              <p className="muted" style={{ marginTop: -4 }}>{model.description}</p>
            </div>
          </div>
        )}

        <div className="details-divider" />

        <div>
          <p className="section-title">ألوان الموديل</p>
          <p className="muted">افتح الصف لرؤية الألوان والمقاسات.</p>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>إغلاق</button>
          <button className="btn ghost" onClick={onEdit}>تعديل</button>
        </div>
      </div>
    </div>
  )
}

export default function ProductTable({ params, setParam, onEdit }) {
  const { data, isLoading } = useModels()
  const [expanded, setExpanded] = useState(null)
  const [stockEdit, setStockEdit] = useState(null)
  const [preview, setPreview] = useState(null)

  const models = data?.models || []
  const perPage = 20

  const inventoryMap = useMemo(() => {
    const map = new Map()
    models.forEach(m => {
      map.set(String(m._id), m.inventory || [])
    })
    return map
  }, [models])

  const handleSort = (col) => {
    if (params.sort === col) {
      setParam('order', params.order === 'asc' ? 'desc' : 'asc')
    } else {
      setParam('sort', col)
      setParam('order', 'asc')
    }
  }

  const filtered = useMemo(() => {
    const search = params.search?.trim().toLowerCase()
    const matchesText = (m) => {
      if (!search) return true
      return [m.modelId, m.modelName, m.brand, m.category]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(search))
    }

    return models.filter(m => {
      if (!matchesText(m)) return false
      if (params.brand && m.brand !== params.brand) return false
      if (params.category && m.category !== params.category) return false
      if (params.gender && m.gender !== params.gender) return false

      if (params.status) {
        const inv = inventoryMap.get(String(m._id))
        if (!inv || inv.length === 0) return false
        const status = computeInventoryStats(inv).status
        if (status !== params.status) return false
      }

      return true
    })
  }, [models, params, inventoryMap])

  const sorted = useMemo(() => {
    const dir = params.order === 'asc' ? 1 : -1
    const list = [...filtered]
    list.sort((a, b) => {
      const av = a[params.sort] ?? ''
      const bv = b[params.sort] ?? ''
      if (typeof av === 'string') return av.localeCompare(bv) * dir
      return (av - bv) * dir
    })
    return list
  }, [filtered, params.order, params.sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const page = Math.min(params.page || 1, totalPages)
  const paged = sorted.slice((page - 1) * perPage, page * perPage)

  if (isLoading) return (
    <div className="card empty-state">جارٍ تحميل الموديلات...</div>
  )

  if (!models.length) return (
    <div className="card empty-state">
      <p style={{ fontSize: 32, marginBottom: 8 }}>ص</p>
      <p style={{ fontWeight: 500, marginBottom: 4 }}>لا توجد موديلات</p>
      <p className="muted">جرّب تعديل الفلاتر أو أضف أول موديل.</p>
    </div>
  )

  return (
    <>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}></th>
                <SortTh col="modelName" label="الموديل" current={params.sort} dir={params.order} onSort={handleSort} />
                <SortTh col="modelId" label="الكود" current={params.sort} dir={params.order} onSort={handleSort} />
                <SortTh col="brand" label="الماركة" current={params.sort} dir={params.order} onSort={handleSort} />
                <SortTh col="category" label="التصنيف" current={params.sort} dir={params.order} onSort={handleSort} />
                <th>النوع</th>
                <th>إجمالي المخزون</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(m => {
                const isExp = expanded === m._id
                const inv = inventoryMap.get(String(m._id)) || []
                const stats = computeInventoryStats(inv)

                return (
                  <Fragment key={m._id}>
                    <tr
                      className="row-clickable"
                      onClick={() => setPreview(m)}
                    >
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
                          ص
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{m.modelName}</span>
                        {m.description && (
                          <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                            {m.description.slice(0, 60)}{m.description.length > 60 ? '...' : ''}
                          </p>
                        )}
                      </td>
                      <td className="mono ltr">{m.modelId || <span className="muted">-</span>}</td>
                      <td>{m.brand || <span className="muted">-</span>}</td>
                      <td>{m.category || <span className="muted">-</span>}</td>
                      <td>
                        {m.gender === 'male'
                          ? 'رجالي'
                          : m.gender === 'female'
                            ? 'نسائي'
                            : m.gender
                              ? 'للجنسين'
                              : <span className="muted">-</span>}
                      </td>
                      <td style={{ fontWeight: 500 }}>{Number(stats.total).toLocaleString('ar-EG')}</td>
                      <td><span className={`badge ${stats.status}`}>{STATUS_LABEL[stats.status]}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn ghost sm"
                            onClick={e => { e.stopPropagation(); setExpanded(isExp ? null : m._id) }}
                          >
                            {isExp ? 'إخفاء' : 'تفاصيل'}
                          </button>
                          <button
                            className="btn ghost sm"
                            onClick={e => { e.stopPropagation(); onEdit(m) }}
                          >
                            تعديل
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExp && (
                      <VariantRows model={m} inventory={inv} onStockEdit={setStockEdit} />
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pagination" style={{ marginTop: 12 }}>
        <button
          className="btn ghost"
          onClick={() => setParam('page', Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          السابق
        </button>
        <span className="muted">
          صفحة {page} من {totalPages}
        </span>
        <button
          className="btn ghost"
          onClick={() => setParam('page', Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          التالي
        </button>
      </div>

      {stockEdit && (
        <StockEditModal entry={stockEdit} onClose={() => setStockEdit(null)} />
      )}

      {preview && (
        <ProductDetailsModal
          model={preview}
          inventory={inventoryMap.get(String(preview._id)) || []}
          onClose={() => setPreview(null)}
          onEdit={() => {
            setPreview(null)
            onEdit(preview)
          }}
        />
      )}
    </>
  )
}
