import { useRef, useState } from 'react'
import { Upload, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import mammoth from 'mammoth'
import { useMulakatStore } from '../../store/useMulakatStore'
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MIN_CV_TEXT_LENGTH,
  MIN_JOB_DESC_LENGTH,
} from '../../config/mulakatConfig'

// pdfjs-dist v5 ESM import
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const FILE_TYPE_ICON: Record<string, string> = {
  pdf: '📄',
  docx: '📝',
  doc: '📝',
  txt: '📃',
}

function getFileExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

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
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')

  const cardBg = d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)'

  // Dosya veya yapıştırma metninden biri yeterliyse ileri aktif
  const effectiveCvText = cvText || pasteText
  const canProceed = effectiveCvText.length >= MIN_CV_TEXT_LENGTH && jobDescription.length >= MIN_JOB_DESC_LENGTH

  async function extractText(file: File) {
    const ext = getFileExt(file.name)
    const allowed = ['pdf', 'doc', 'docx', 'txt']

    if (!allowed.includes(ext)) {
      setFileError('Bu dosya formatı desteklenmiyor. PDF, Word veya TXT yükleyin.')
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`Dosya ${MAX_FILE_SIZE_MB}MB'dan büyük. Daha küçük bir dosya deneyin.`)
      return
    }

    setFileError('')
    setExtracting(true)
    // Dosya yüklenince yapıştırma alanını temizle
    setPasteText('')

    try {
      let text = ''

      if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const parts: string[] = []
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          parts.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
        }
        text = parts.join('\n\n').trim()
        if (text.length < 20) {
          setFileError('PDF okunamadı. Dosya taranmış görsel içeriyorsa Word veya TXT formatında yükleyin.')
          setCvText('', '')
          return
        }
      } else if (ext === 'docx' || ext === 'doc') {
        try {
          const arrayBuffer = await file.arrayBuffer()
          const result = await mammoth.extractRawText({ arrayBuffer })
          text = result.value.trim()
          if (text.length < 20) {
            setFileError('Word dosyası okunamadı. PDF veya TXT formatında deneyin.')
            setCvText('', '')
            return
          }
        } catch {
          setFileError('Word dosyası okunamadı. PDF veya TXT formatında deneyin.')
          setCvText('', '')
          return
        }
      } else if (ext === 'txt') {
        text = (await file.text()).trim()
        if (text.length < 20) {
          setFileError('Dosyadan metin çıkarılamadı. Dosyanın metin içerdiğinden emin olun veya CV metninizi aşağıya yapıştırın.')
          setCvText('', '')
          return
        }
      }

      setCvText(text, file.name)
    } catch {
      setFileError('Dosya okunurken bir hata oluştu. Farklı bir dosya deneyin.')
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

  function handlePasteChange(val: string) {
    setPasteText(val)
    // Yapıştırılınca yüklü dosyayı temizle
    if (val && cvText) setCvText('', '')
  }

  const ext = getFileExt(cvFileName)
  const fileIcon = FILE_TYPE_ICON[ext] ?? '📄'

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* CV Yükleme Alanı */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: d ? 'rgba(226,232,240,0.9)' : '#0f172a', marginBottom: '8px' }}>
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
            borderRadius: '14px',
            padding: '20px',
            textAlign: 'center',
            cursor: extracting ? 'wait' : 'pointer',
            transition: 'all 0.2s',
            opacity: pasteText ? 0.5 : 1,
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
            accept=".pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && extractText(e.target.files[0])}
          />

          {extracting ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: '13px', color: d ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.7)' }}>CV okunuyor…</p>
            </div>
          ) : cvText ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px', lineHeight: 1 }}>{fileIcon}</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginBottom: '2px' }}>{cvFileName}</p>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: d ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={18} style={{ color: '#6366f1' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: d ? 'rgba(226,232,240,0.85)' : '#0f172a', marginBottom: '2px' }}>
                  CV'nizi sürükleyin veya seçin
                </p>
                <p style={{ fontSize: '12px', color: d ? 'rgba(100,116,139,0.65)' : 'rgba(100,116,139,0.75)' }}>
                  PDF, Word veya TXT • Maks. {MAX_FILE_SIZE_MB}MB
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

      {/* Manuel yapıştırma (collapse) */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setPasteOpen((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', fontWeight: 600,
            color: d ? 'rgba(148,163,184,0.7)' : 'rgba(100,116,139,0.75)',
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          {pasteOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          CV metnini yapıştırmak istiyorum
        </button>

        {pasteOpen && (
          <div style={{ marginTop: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: d ? 'rgba(148,163,184,0.7)' : 'rgba(100,116,139,0.75)', marginBottom: '6px' }}>
              CV Metninizi Yapıştırın
            </label>
            <textarea
              value={pasteText}
              onChange={(e) => handlePasteChange(e.target.value)}
              placeholder="CV içeriğinizi buraya kopyalayıp yapıştırın…"
              style={{
                width: '100%', boxSizing: 'border-box',
                minHeight: '120px', resize: 'vertical',
                padding: '10px 14px', borderRadius: '12px',
                border: pasteText
                  ? '1px solid #10b981'
                  : d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                background: cardBg,
                color: d ? 'rgba(226,232,240,0.9)' : '#0f172a',
                fontSize: '13px', lineHeight: 1.65, fontFamily: 'inherit',
                outline: 'none',
                opacity: cvText ? 0.5 : 1,
              }}
              onFocus={(e) => { e.target.style.borderColor = '#6366f1' }}
              onBlur={(e) => { e.target.style.borderColor = pasteText ? '#10b981' : d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            />
            {pasteText && (
              <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                ✓ {pasteText.length.toLocaleString('tr-TR')} karakter
              </p>
            )}
          </div>
        )}
      </div>

      {/* İş İlanı Textarea */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: d ? 'rgba(226,232,240,0.9)' : '#0f172a', marginBottom: '8px' }}>
          Pozisyon Tanımı <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value.slice(0, 2000))}
          placeholder="Başvurduğunuz pozisyonu, şirketi ve iş gereksinimlerini buraya yapıştırın veya yazın…"
          rows={3}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '12px',
            border: d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            background: cardBg,
            color: d ? 'rgba(226,232,240,0.9)' : '#0f172a',
            fontSize: '13px',
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
      <div>
        <button
          onClick={() => {
            // Yapıştırma metni kullanılıyorsa store'a aktar
            if (!cvText && pasteText.length >= MIN_CV_TEXT_LENGTH) {
              setCvText(pasteText, 'Manuel giriş')
            }
            onNext()
          }}
          disabled={!canProceed}
          className={canProceed ? 'btn-gradient-bg' : ''}
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            zIndex: 10,
            gap: '8px',
            padding: '11px 28px',
            borderRadius: '12px',
            fontSize: '14px',
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
