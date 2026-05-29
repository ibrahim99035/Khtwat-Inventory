import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { login } from '../api/products'

export default function Login() {
  const { setUser, user, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate('/inventory', { replace: true })
  }, [loading, user, navigate])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await login(form)
      setUser(res.data)
      navigate('/inventory')
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تسجيل الدخول')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>
          خطوات
        </h1>
        <p className="muted" style={{ marginBottom: 24, fontSize: 13 }}>
          سجّل الدخول لإدارة متجرك
        </p>

        <form onSubmit={submit}>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>اسم المستخدم</label>
            <input
              autoFocus
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="admin"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>كلمة المرور</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="********"
            />
          </div>

          {error && (
            <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
              {error}
            </p>
          )}

          <button className="btn primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
