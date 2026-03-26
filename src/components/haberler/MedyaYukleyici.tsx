import { useState, useRef } from 'react'
import { Image, Video, Link, Trash2, GripVertical, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { HaberMedya } from '../../lib/firestore'

const C = {
  bg: '#0a0f1e',
  card: '#111827',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(99,102,241,0.3)',
  t1: '#ffffff',
  t2: '#94a3b8',
  t3: '#64748b',
  cyan: '#6366f1',
}

interface MedyaYukleyiciProps {
  medya: HaberMedya[]
  onChange: (medya: HaberMedya[]) => void
  haberId: string
}

function UploadProgress({ progress }: { progress: number }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <span style={{ color: C.t3, fontSize: 11, marginTop: 4, display: 'block' }}>{Math.round(progress)}% yüklendi</span>
    </div>
  )
}

export function MedyaYukleyici({ medya, onChange, haberId }: MedyaYukleyiciProps) {
  const [activeTab, setActiveTab] = useState<'gorsel' | 'video-link' | 'video-dosya'>('gorsel')
  const [videoUrl, setVideoUrl] = useState('')
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [dragOver, setDragOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoFileRef = useRef<HTMLInputElement>(null)

  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string

  function uploadFile(file: File, tip: 'gorsel' | 'gif' | 'video-dosya') {
    const maxSize = tip === 'video-dosya' ? 500 * 1024 * 1024 : 100 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`Dosya boyutu çok büyük. Maksimum: ${tip === 'video-dosya' ? '500MB' : '100MB'}`)
      return
    }

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      toast.error('Cloudinary yapılandırması eksik. .env dosyasını kontrol et.')
      return
    }

    const uploadId = `${Date.now()}-${file.name}`
    setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }))

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder', `haberler/${haberId || 'temp'}`)

    const resourceType = tip === 'video-dosya' ? 'video' : 'image'
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = (e.loaded / e.total) * 100
        setUploadProgress(prev => ({ ...prev, [uploadId]: pct }))
      }
    }

    xhr.onload = () => {
      setUploadProgress(prev => { const n = { ...prev }; delete n[uploadId]; return n })
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText) as { secure_url: string }
        const actualTip: HaberMedya['tip'] = file.type === 'image/gif' ? 'gif' : tip
        onChange([...medya, { tip: actualTip, url: data.secure_url }])
      } else {
        try {
          const errData = JSON.parse(xhr.responseText) as { error?: { message?: string } }
          toast.error(`Yükleme başarısız: ${errData.error?.message ?? xhr.statusText}`)
        } catch {
          toast.error(`Yükleme başarısız: ${xhr.statusText}`)
        }
      }
    }

    xhr.onerror = () => {
      setUploadProgress(prev => { const n = { ...prev }; delete n[uploadId]; return n })
      toast.error('Yükleme başarısız. İnternet bağlantınızı kontrol edin.')
    }

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`)
    xhr.send(formData)
  }

  function handleGorselFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) uploadFile(file, 'gorsel')
    })
  }

  function handleVideoDosya(files: FileList | null) {
    if (!files) return
    const file = files[0]
    if (file && file.type.startsWith('video/')) uploadFile(file, 'video-dosya')
  }

  function addVideoLink() {
    const url = videoUrl.trim()
    if (!url) return
    onChange([...medya, { tip: 'video-link', url }])
    setVideoUrl('')
  }

  function removeMedya(idx: number) {
    onChange(medya.filter((_, i) => i !== idx))
  }

  function handleDragStart(idx: number) { setDragIndex(idx) }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === idx) return
    const newMedya = [...medya]
    const [item] = newMedya.splice(dragIndex, 1)
    newMedya.splice(idx, 0, item)
    onChange(newMedya)
    setDragIndex(idx)
  }
  function handleDragEnd() { setDragIndex(null) }

  const isUploading = Object.keys(uploadProgress).length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Tab seçimi */}
      <div style={{ display: 'flex', gap: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
        {[
          { key: 'gorsel', label: 'Görsel / GIF', icon: Image },
          { key: 'video-link', label: 'Video Link', icon: Link },
          { key: 'video-dosya', label: 'Video Dosya', icon: Video },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as typeof activeTab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: activeTab === key ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: activeTab === key ? '#818cf8' : C.t3,
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
            }}
          >
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Görsel tab */}
      {activeTab === 'gorsel' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleGorselFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? C.borderHover : C.border}`,
            borderRadius: 10, padding: '28px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            cursor: 'pointer', transition: 'all 0.2s',
            background: dragOver ? 'rgba(99,102,241,0.06)' : 'transparent',
          }}
        >
          <Upload size={22} style={{ color: C.t3 }} />
          <span style={{ color: C.t2, fontSize: 13, fontWeight: 600 }}>Görsel veya GIF sürükle & bırak</span>
          <span style={{ color: C.t3, fontSize: 11 }}>veya tıkla (max 100MB)</span>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleGorselFiles(e.target.files)} />
        </div>
      )}

      {/* Video link tab */}
      {activeTab === 'video-link' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="YouTube veya Vimeo URL'si"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
              color: C.t1, fontSize: 13, outline: 'none',
            }}
            onKeyDown={e => e.key === 'Enter' && addVideoLink()}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
            onBlur={e => (e.currentTarget.style.borderColor = C.border)}
          />
          <button
            type="button"
            onClick={addVideoLink}
            style={{
              padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontSize: 13, fontWeight: 600,
            }}
          >
            Ekle
          </button>
        </div>
      )}

      {/* Video dosya tab */}
      {activeTab === 'video-dosya' && (
        <div
          onClick={() => videoFileRef.current?.click()}
          style={{
            border: `2px dashed ${C.border}`, borderRadius: 10, padding: '28px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            cursor: 'pointer',
          }}
        >
          <Video size={22} style={{ color: C.t3 }} />
          <span style={{ color: C.t2, fontSize: 13, fontWeight: 600 }}>Video dosyası yükle</span>
          <span style={{ color: C.t3, fontSize: 11 }}>MP4, WebM (max 500MB)</span>
          <input ref={videoFileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleVideoDosya(e.target.files)} />
        </div>
      )}

      {/* Upload progress */}
      {isUploading && Object.entries(uploadProgress).map(([id, pct]) => (
        <UploadProgress key={id} progress={pct} />
      ))}

      {/* Medya listesi (sıralanabilir) */}
      {medya.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <span style={{ color: C.t3, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Yüklenen Medyalar ({medya.length})
          </span>
          {medya.map((item, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                background: C.card, border: `1px solid ${C.border}`,
                cursor: 'grab', opacity: dragIndex === idx ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              <GripVertical size={14} style={{ color: C.t3, flexShrink: 0 }} />
              {(item.tip === 'gorsel' || item.tip === 'gif') ? (
                <img src={item.url} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
              ) : item.tip === 'video-link' ? (
                <div style={{ width: 48, height: 36, background: 'rgba(99,102,241,0.15)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Video size={16} style={{ color: '#818cf8' }} />
                </div>
              ) : (
                <div style={{ width: 48, height: 36, background: 'rgba(16,185,129,0.15)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Video size={16} style={{ color: '#34d399' }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: C.t2, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{item.tip}</span>
                <p style={{ color: C.t3, fontSize: 11, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</p>
              </div>
              <button type="button" onClick={() => removeMedya(idx)} style={{ padding: 6, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', color: C.t3, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = C.t3)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
