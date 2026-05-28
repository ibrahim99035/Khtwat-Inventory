import { useState, useRef } from 'react'

export default function ImageUploader({ existing = [], onFilesChange, onRemoveExisting }) {
  const [newFiles, setNewFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const addFiles = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'))
    setNewFiles(prev => {
      const merged = [...prev, ...valid]
      onFilesChange(merged)
      return merged
    })
    setPreviews(prev => [
      ...prev,
      ...valid.map(f => URL.createObjectURL(f)),
    ])
  }

  const removeNew = (idx) => {
    URL.revokeObjectURL(previews[idx])
    setNewFiles(prev => {
      const next = prev.filter((_, i) => i !== idx)
      onFilesChange(next)
      return next
    })
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <div>
      {existing.length > 0 && (
        <div className="image-previews" style={{ marginBottom: 10 }}>
          {existing.map(img => (
            <div key={img.publicId} className="image-thumb">
              <img src={img.url} alt="" />
              <button
                className="remove-img"
                type="button"
                onClick={() => onRemoveExisting(img.publicId)}
                title="إزالة الصورة"
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className={`drop-zone ${dragging ? 'over' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          addFiles(e.dataTransfer.files)
        }}
      >
        <p style={{ fontSize: 13 }}>
          اضغط أو اسحب الصور هنا
        </p>
        <p style={{ fontSize: 11, color: 'var(--hint)', marginTop: 4 }}>
          حتى 10 صور، 5 ميجا لكل صورة، JPG, PNG, WEBP
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => addFiles(e.target.files)}
      />

      {previews.length > 0 && (
        <div className="image-previews" style={{ marginTop: 10 }}>
          {previews.map((src, i) => (
            <div key={i} className="image-thumb">
              <img src={src} alt="" />
              <button
                className="remove-img"
                type="button"
                onClick={() => removeNew(i)}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
