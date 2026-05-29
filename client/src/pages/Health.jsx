import { useEffect, useState } from 'react'

export default function Health() {
  const [status, setStatus] = useState('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true
    fetch('/api/health')
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (mounted) {
          setStatus('ok')
          setMessage(data.status || 'ok')
        }
      })
      .catch(err => {
        if (mounted) {
          setStatus('error')
          setMessage(err.message || 'Request failed')
        }
      })

    return () => { mounted = false }
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Health Check</h1>
        <p style={{ fontSize: 13, marginBottom: 4 }}>API status</p>
        <p style={{ fontSize: 13, color: status === 'ok' ? 'var(--green)' : status === 'error' ? 'var(--red)' : 'var(--muted)' }}>
          {status === 'checking' ? 'Checking...' : message}
        </p>
      </div>
    </div>
  )
}
