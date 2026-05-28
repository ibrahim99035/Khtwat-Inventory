import { usePublicMeta } from '../hooks/useProducts'

export default function PublicFilters({ params, setParam }) {
  const { data: meta } = usePublicMeta()
  const categories = meta?.categories || []
  const brands = meta?.brands || []
  const genders = meta?.genders || ['unisex', 'male', 'female']

  return (
    <div className="filters-panel">
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="ابحث عن الموديل أو الماركة..."
          value={params.search}
          onChange={e => setParam('search', e.target.value)}
        />
        {(params.search || params.category || params.brand || params.gender) && (
          <button
            className="btn ghost"
            onClick={() => {
              setParam('search', '')
              setParam('category', '')
              setParam('brand', '')
              setParam('gender', '')
            }}
          >
            مسح
          </button>
        )}
      </div>

      <div className="filter-group">
        <span className="filter-label">التصنيف</span>
        <div className="filter-row">
          <button
            className={`filter-chip ${params.category === '' ? 'active' : ''}`}
            onClick={() => setParam('category', '')}
          >
            الكل
          </button>
          {categories.map(c => (
            <button
              key={c}
              className={`filter-chip ${params.category === c ? 'active' : ''}`}
              onClick={() => setParam('category', c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-label">الماركة</span>
        <div className="filter-row">
          <button
            className={`filter-chip ${params.brand === '' ? 'active' : ''}`}
            onClick={() => setParam('brand', '')}
          >
            الكل
          </button>
          {brands.map(b => (
            <button
              key={b}
              className={`filter-chip ${params.brand === b ? 'active' : ''}`}
              onClick={() => setParam('brand', b)}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-label">النوع</span>
        <div className="filter-row">
          <button
            className={`filter-chip ${params.gender === '' ? 'active' : ''}`}
            onClick={() => setParam('gender', '')}
          >
            الكل
          </button>
          {genders.map(g => (
            <button
              key={g}
              className={`filter-chip ${params.gender === g ? 'active' : ''}`}
              onClick={() => setParam('gender', g)}
            >
              {g === 'unisex' ? 'للجنسين' : g === 'male' ? 'رجالي' : 'نسائي'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
