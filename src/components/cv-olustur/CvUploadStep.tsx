import { useState, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth'
import { Upload, FileText, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useCvStore } from '../../store/useCvStore'
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, MIN_CV_TEXT_LENGTH } from '../../config/cvConfig'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const C = {
  border: 'rgba(255,255,255,0.08)',
  borderFocus: 'rgba(99,102,241,0.5)',
  cyan: '#6366f1',
  t1: '#ffffff', t2: '#94a3b8', t3: '#64748b',
  card: '#111827', err: '#ef4444',
}

interface Props { d: boolean; onNext: () => void }

export function CvUploadStep({ d, onNext }: Props) {
  const { cvText, cvFileName, setCvText } = useCvStore()
  const [pasteText, setPasteText] = useState('')
  const [pasteOpen, setPasteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const effectiveText = cvText || pasteText
  const canProceed = effectiveText.length >= MIN_CV_TEXT_LENGTH

  const borderColor = d ? C.border : 'rgba(0,0,0,0.1)'
  const textColor = d ? C.t1 : '#0f172a'
  const mutedColor = d ? C.t3 : '#94a3b8'
  const cardBg = d ? C.card : '#f8fafc'

  async function processFile(file: File) {
    setError('')
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Dosya boyutu ${MAX_FILE_SIZE_MB}MB'den büyük olamaz.`)
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    setLoading(true)
    try {
      let text = ''
      if (ext === 'pdf') {
        const buf = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise
        const parts: string[] = []
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          parts.push(content.items.map(item => ('str' in item ? item.str : '')).join(' '))
        }
        text = parts.join('\n\n').trim()
      } else if (ext === 'docx' || ext === 'doc') {
        const buf = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer: buf })
        text = result.value.trim()
      } else if (ext === 'txt') {
        text = await file.text()
      } else {
        setError('Desteklenen formatlar: PDF, DOCX, DOC, TXT')
        return
      }
      if (text.length < 20) {
        setError('Dosyadan yeterli metin çıkarılamadı. Lütfen yapıştır seçeneğini deneyin.')
        return
      }
      setCvText(text, file.name)
      setPasteText('')
    } catch {
      setError('Dosya okunamadı. Lütfen başka bir format deneyin.')
    } finally {
      setLoading(false)
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files?.[0]) return
    processFile(files[0])
  }

  function clearFile() {
    setCvText('', '')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h2 style={{ color: textColor, fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>CV'nizi Yükleyin</h2>
        <p style={{ color: mutedColor, fontSize: 14, margin: 0 }}>PDF, DOCX veya TXT formatında yükleyin ya da yapıştırın</p>
      </div>

      {/* Upload area */}
      {!cvText && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? C.borderFocus : borderColor}`,
            borderRadius: 14, padding: '40px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            cursor: 'pointer', transition: 'all 0.2s',
            background: dragOver ? 'rgba(99,102,241,0.06)' : cardBg,
          }}
        >
          {loading ? (
            <div style={{ width: 32, height: 32, border: `3px solid rgba(99,102,241,0.2)`, borderTopColor: C.cyan, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <>
              <Upload size={28} style={{ color: C.cyan }} />
              <span style={{ color: textColor, fontSize: 15, fontWeight: 600 }}>Sürükle & bırak veya tıkla</span>
              <span style={{ color: mutedColor, fontSize: 12 }}>PDF, DOCX, DOC, TXT (max {MAX_FILE_SIZE_MB}MB)</span>
            </>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        </div>
      )}

      {/* Loaded file display */}
      {cvText && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: cardBg, border: `1px solid ${borderColor}` }}>
          <FileText size={20} style={{ color: C.cyan, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: textColor, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cvFileName}</p>
            <p style={{ margin: 0, color: mutedColor, fontSize: 11 }}>{cvText.length.toLocaleString()} karakter çıkarıldı</p>
          </div>
          <button onClick={clearFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor, padding: 4, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{ color: C.err, fontSize: 13, margin: 0, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>
      )}

      {/* Paste option */}
      <div style={{ borderRadius: 12, border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
        <button
          onClick={() => setPasteOpen(v => !v)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: cardBg, border: 'none', cursor: 'pointer', color: textColor, fontSize: 13, fontWeight: 600 }}
        >
          <span>Metin yapıştır (alternatif)</span>
          {pasteOpen ? <ChevronUp size={16} style={{ color: mutedColor }} /> : <ChevronDown size={16} style={{ color: mutedColor }} />}
        </button>
        {pasteOpen && (
          <div style={{ padding: '0 16px 16px' }}>
            <textarea
              value={pasteText}
              onChange={e => { setPasteText(e.target.value); if (cvText) clearFile() }}
              placeholder="CV içeriğinizi buraya yapıştırın..."
              rows={8}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box',
                background: d ? 'rgba(255,255,255,0.04)' : '#fff',
                border: `1px solid ${borderColor}`, color: textColor,
                fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: 'inherit',
              }}
            />
            <p style={{ margin: '6px 0 0', color: mutedColor, fontSize: 11 }}>{pasteText.length} karakter</p>
          </div>
        )}
      </div>

      {/* Next button */}
      <button
        onClick={() => { if (pasteText && !cvText) useCvStore.getState().setCvText(pasteText, 'Yapıştırılan metin'); onNext() }}
        disabled={!canProceed}
        style={{
          padding: '13px 24px', borderRadius: 10, border: 'none',
          background: canProceed ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : (d ? 'rgba(255,255,255,0.06)' : '#e2e8f0'),
          color: canProceed ? '#fff' : mutedColor,
          fontSize: 14, fontWeight: 700, cursor: canProceed ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s', boxShadow: canProceed ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
        }}
      >
        Devam Et →
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
