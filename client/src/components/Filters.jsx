import { useMeta } from '../hooks/useProducts'

export default function Filters({ params, setParam }) {
  const { data: meta } = useMeta()

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input
        style={{ flex: '1', minWidth: 200 }}
        placeholder="ابحث بالاسم أو الماركة أو الكود..."
        value={params.search}
        onChange={e => setParam('search', e.target.value)}
      />

      <select
        value={params.category}
        onChange={e => setParam('category', e.target.value)}
        style={{ minWidth: 140 }}
      >
        <option value="">كل التصنيفات</option>
        {meta?.categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={params.brand}
        onChange={e => setParam('brand', e.target.value)}
        style={{ minWidth: 130 }}
      >
        <option value="">كل الماركات</option>
        {meta?.brands.map(b => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>

      <select
        value={params.status}
        onChange={e => setParam('status', e.target.value)}
        style={{ minWidth: 130 }}
      >
        <option value="">كل المخزون</option>
        <option value="in">متوفر</option>
        <option value="low">منخفض</option>
        <option value="out">نافد</option>
      </select>

      <select
        value={params.gender}
        onChange={e => setParam('gender', e.target.value)}
        style={{ minWidth: 120 }}
      >
        <option value="">كل الأنواع</option>
        {(meta?.genders || ['unisex', 'male', 'female']).map(g => (
          <option key={g} value={g}>
            {g === 'unisex' ? 'للجنسين' : g === 'male' ? 'رجالي' : 'نسائي'}
          </option>
        ))}
      </select>

      <select
        value={params.available}
        onChange={e => setParam('available', e.target.value)}
        style={{ minWidth: 150 }}
      >
        <option value="">كل الحالات</option>
        <option value="true">متاح</option>
        <option value="false">غير متاح</option>
      </select>

      {(params.search || params.category || params.brand || params.status || params.gender || params.available) && (
        <button
          className="btn ghost"
          onClick={() => {
            setParam('search', '')
            setParam('category', '')
            setParam('brand', '')
            setParam('status', '')
            setParam('gender', '')
            setParam('available', '')
          }}
        >
          مسح
        </button>
      )}
    </div>
  )
}
