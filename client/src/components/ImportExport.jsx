import { useState, useRef } from 'react'
import { useImportProducts } from '../hooks/useProducts'

export default function ImportExport({ onClose }) {
  const [preview, setPreview] = useState(null)
  const [overwrite, setOverwrite] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const { mutate: doImport, isPending } = useImportProducts()

  const parseFile = async (file) => {
    setError('')
    setPreview(null)
    try {
      let products = []
      if (file.name.endsWith('.json')) {
        const text = await file.text()
        products = JSON.parse(text)
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text()
        products = csvToProducts(text)
      } else {
        setError('يتم دعم ملفات .json و .csv فقط')
        return
      }

      if (!Array.isArray(products) || products.length === 0) {
        setError('لم يتم العثور على منتجات صالحة في الملف')
        return
      }

      setPreview({ products, count: products.length })
    } catch (e) {
      setError('فشل تحليل الملف: ' + e.message)
    }
  }

  const csvToProducts = (text) => {
    const lines = text.trim().split('\n')
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
      return Object.fromEntries(header.map((h, i) => [h, vals[i] || '']))
    })
  }

  const confirm = () => {
    if (!preview) return
    doImport(
      { products: preview.products, overwrite },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>استيراد المنتجات</h2>
          <button className="btn ghost icon" onClick={onClose}>X</button>
        </div>

        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          ارفع ملف .json أو .csv. يجب أن يكون ملف JSON عبارة عن مصفوفة من المنتجات
          بنفس بنية البيانات.
        </p>

        <div
          className="drop-zone"
          onClick={() => fileRef.current.click()}
        >
          <p style={{ fontSize: 13 }}>اضغط لاختيار ملف</p>
          <p style={{ fontSize: 11, color: 'var(--hint)', marginTop: 4 }}>
            .json أو .csv
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv"
          style={{ display: 'none' }}
          onChange={e => e.target.files[0] && parseFile(e.target.files[0])}
        />

        {error && (
          <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{error}</p>
        )}

        {preview && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 14px',
              background: 'var(--bg)',
              borderRadius: 'var(--radius)',
              fontSize: 13,
            }}
          >
            <p style={{ fontWeight: 500, marginBottom: 4 }}>
              تم العثور على {Number(preview.count).toLocaleString('ar-EG')} منتج
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}>
              <input
                type="checkbox"
                checked={overwrite}
                onChange={e => setOverwrite(e.target.checked)}
              />
              <span>استبدال المنتجات الموجودة التي لها نفس الكود</span>
            </label>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>إلغاء</button>
          <button
            className="btn primary"
            onClick={confirm}
            disabled={!preview || isPending}
          >
            {isPending ? 'جارٍ الاستيراد...' : `استيراد ${preview?.count ? Number(preview.count).toLocaleString('ar-EG') : ''} منتج`}
          </button>
        </div>
      </div>
    </div>
  )
}
