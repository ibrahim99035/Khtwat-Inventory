import { useModels } from '../hooks/useProducts'

export default function Filters({ params, setParam }) {
  const { data } = useModels()
  const models = data?.models || []
  const categories = Array.from(new Set(models.map(m => m.category).filter(Boolean)))
  const brands = Array.from(new Set(models.map(m => m.brand).filter(Boolean)))
  const genders = Array.from(new Set(models.map(m => m.gender).filter(Boolean)))

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input
        style={{ flex: '1', minWidth: 200 }}
        placeholder="ابحث بالموديل أو الكود أو الماركة..."
        value={params.search}
        onChange={e => setParam('search', e.target.value)}
      />

      <select
        value={params.category}
        onChange={e => setParam('category', e.target.value)}
        style={{ minWidth: 140 }}
      >
        <option value="">كل التصنيفات</option>
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={params.brand}
        onChange={e => setParam('brand', e.target.value)}
        style={{ minWidth: 130 }}
      >
        <option value="">كل الماركات</option>
        {brands.map(b => (
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
        {(genders.length ? genders : ['unisex', 'male', 'female']).map(g => (
          <option key={g} value={g}>
            {g === 'unisex' ? 'للجنسين' : g === 'male' ? 'رجالي' : 'نسائي'}
          </option>
        ))}
      </select>

      {(params.search || params.category || params.brand || params.status || params.gender) && (
        <button
          className="btn ghost"
          onClick={() => {
            setParam('search', '')
            setParam('category', '')
            setParam('brand', '')
            setParam('status', '')
            setParam('gender', '')
          }}
        >
          مسح
        </button>
      )}
    </div>
  )
}
