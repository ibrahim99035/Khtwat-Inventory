import { useBulkDelete } from '../hooks/useProducts'

export default function BulkBar({ selected, onClear }) {
  const { mutate: bulkDelete, isPending } = useBulkDelete()
  const count = selected.length.toLocaleString('ar-EG')

  const handleDelete = () => {
    const label = selected.length > 1 ? 'منتجات' : 'منتج'
    if (!confirm(`حذف ${count} ${label}؟ لا يمكن التراجع.`)) return
    bulkDelete(selected, { onSuccess: onClear })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        fontSize: 13,
      }}
    >
      <span className="muted" style={{ flex: 1 }}>
        تم تحديد {count} {selected.length > 1 ? 'منتجات' : 'منتج'}
      </span>
      <button className="btn sm danger" onClick={handleDelete} disabled={isPending}>
        {isPending ? 'جارٍ الحذف...' : 'حذف المحدد'}
      </button>
      <button className="btn sm ghost" onClick={onClear}>مسح</button>
    </div>
  )
}
