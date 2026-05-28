import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Topbar({
  onAdd,
  onImport,
  showAdd = true,
  showImport = true,
  addLabel = 'إضافة منتج',
  importLabel = 'استيراد',
}) {
  const { user, logout } = useAuth()
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <div className="topbar">
      <span className="logo">خطوات</span>

      <div className="topbar-nav">
        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/inventory">
          المنتجات
        </NavLink>
        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/sales">
          المبيعات
        </NavLink>
      </div>

      {showImport && (
        <button className="btn ghost" onClick={onImport} style={{ fontSize: 13 }}>
          {importLabel}
        </button>
      )}

      <button className="btn ghost" onClick={toggleTheme} style={{ fontSize: 13 }}>
        {theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
      </button>

      {showAdd && (
        <button className="btn primary" onClick={onAdd}>
          {addLabel}
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
        <span className="muted" style={{ fontSize: 13 }}>{user?.username}</span>
        <button className="btn ghost sm" onClick={logout}>تسجيل الخروج</button>
      </div>
    </div>
  )
}
