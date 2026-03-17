import { useRef, useState } from 'react'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { useMulakatStore } from '../../store/useMulakatStore'
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MIN_CV_TEXT_LENGTH,
  MIN_JOB_DESC_LENGTH,
} from '../../config/mulakatConfig'

// pdfjs-dist v5 ESM import
import * as pdfjsLib from 'pdfjs-dist'
// Worker URL — Vite'ın ?url suffix'i ile kopyalanır
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

interface Props {
  d: boolean
  onNext: () => void
}

export function Step1Upload({ d, onNext }: Props) {
  const { cvText, cvFileName, jobDescription, setCvText, setJobDescription } = useMulakatStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [extracting, setExtracting] = useState(false)
  const [fileError, setFileError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const cardBg = d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)'

  const canProceed = cvText.length >= MIN_CV_TEXT_LENGTH && jobDescription.length >= MIN_JOB_DESC_LENGTH

  async function extractText(file: File) {
    if (file.type !== 'application/pdf') {
      setFileError('Lütfen PDF formatında dosya yükleyin.')
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`Dosya boyutu ${MAX_FILE_SIZE_MB}MB'ı geçemez.`)
      return
    }
    setFileError('')
    setExtracting(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const parts: string[] = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
        parts.push(pageText)
      }
      const text = parts.join('\n\n').trim()
      if (text.length < 20) {
        setFileError('CV metni okunamadı. Lütfen metin tabanlı (taranmamış) bir PDF kullanın.')
        setCvText('', '')
      } else {
        setCvText(text, file.name)
      }
    } catch {
      setFileError('PDF okunurken bir hata oluştu. Farklı bir dosya deneyin.')
    } finally {
      setExtracting(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) extractText(file)
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* CV Yükleme Alanı */}
      <div style={{ marginBottom: '28px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: d ? 'rgba(226,232,240,0.9)' : '#0f172a', marginBottom: '10px' }}>
          CV Dosyanız <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <div
          onClick={() => !extracting && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          style={{
            border: isDragging
              ? '2px dashed #6366f1'
              : cvText
              ? '2px solid #10b981'
              : fileError
              ? '2px dashed #ef4444'
              : d ? '2px dashed rgba(255,255,255,0.15)' : '2px dashed rgba(0,0,0,0.15)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            cursor: extracting ? 'wait' : 'pointer',
            transition: 'all 0.2s',
            background: isDragging
              ? d ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)'
              : cvText
              ? d ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)'
              : d ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && extractText(e.target.files[0])}
          />

          {extracting ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: '14px', color: d ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.7)' }}>CV okunuyor…</p>
            </div>
          ) : cvText ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <FileText size={32} style={{ color: '#10b981' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginBottom: '4px' }}>{cvFileName}</p>
                <p style={{ fontSize: '12px', color: d ? 'rgba(148,163,184,0.6)' : 'rgba(71,85,105,0.6)' }}>{cvText.length.toLocaleString('tr-TR')} karakter okundu</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setCvText('', ''); setFileError('') }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }}
              >
                <X size={14} /> Kaldır
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: d ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={24} style={{ color: '#6366f1' }} />
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: d ? 'rgba(226,232,240,0.85)' : '#0f172a', marginBottom: '4px' }}>
                  PDF CV'nizi sürükleyin veya seçin
                </p>
                <p style={{ fontSize: '13px', color: d ? 'rgba(100,116,139,0.65)' : 'rgba(100,116,139,0.75)' }}>
                  Yalnızca PDF • Maks. {MAX_FILE_SIZE_MB}MB
                </p>
              </div>
            </div>
          )}
        </div>

        {fileError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '13px', color: '#ef4444' }}>
            <AlertCircle size={14} /> {fileError}
          </div>
        )}
      </div>

      {/* İş İlanı Textarea */}
      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: d ? 'rgba(226,232,240,0.9)' : '#0f172a', marginBottom: '10px' }}>
          Pozisyon Tanımı <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value.slice(0, 2000))}
          placeholder="Başvurduğunuz pozisyonu, şirketi ve iş gereksinimlerini buraya yapıştırın veya yazın…"
          rows={6}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: '14px',
            border: d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            background: cardBg,
            color: d ? 'rgba(226,232,240,0.9)' : '#0f172a',
            fontSize: '14px',
            lineHeight: 1.65,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#6366f1' }}
          onBlur={(e) => { e.target.style.borderColor = d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: d ? 'rgba(100,116,139,0.55)' : 'rgba(100,116,139,0.65)' }}>
          <span>{jobDescription.length < MIN_JOB_DESC_LENGTH ? `En az ${MIN_JOB_DESC_LENGTH} karakter gerekli` : '✓ Hazır'}</span>
          <span>{jobDescription.length} / 2000</span>
        </div>
      </div>

      {/* İleri Butonu */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={canProceed ? 'btn-gradient-bg' : ''}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 32px',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 700,
            border: 'none',
            cursor: canProceed ? 'pointer' : 'not-allowed',
            background: canProceed
              ? undefined
              : d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            color: canProceed ? undefined : d ? 'rgba(148,163,184,0.4)' : 'rgba(100,116,139,0.5)',
            boxShadow: canProceed ? '0 8px 24px rgba(99,102,241,0.3)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          Devam Et →
        </button>
      </div>
    </div>
  )
}
