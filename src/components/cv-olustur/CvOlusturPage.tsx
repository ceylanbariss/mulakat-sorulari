import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth'
import {
  Upload, FileText, X, Download, RotateCcw,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Camera, LayoutTemplate, Type,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../store/useAppStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useCvStore } from '../../store/useCvStore'
import { saveCvSession } from '../../lib/firestore'
import type { CvOptimizeResponse, CvTemplateId, PhotoShape } from '../../types/cv'
import { CvTemplate } from './CvTemplate'
import { CvEditor } from './CvEditor'
import { AtsPanel } from './AtsPanel'
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../../config/cvConfig'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// ─── Constants ────────────────────────────────────────────────────────────────
const COLOR_PRESETS = ['#6366f1', '#1e3a5f', '#374151', '#047857', '#000000']

const TEMPLATES: { id: CvTemplateId; label: string; desc: string }[] = [
  { id: 'modern', label: 'Modern', desc: 'Renkli & Dengeli' },
  { id: 'klasik', label: 'Klasik', desc: 'Serif & Ortalı' },
  { id: 'profesyonel', label: 'Profesyonel', desc: 'Sol Başlıklı' },
  { id: 'zarif', label: 'Zarif', desc: 'İnce & Şık' },
  { id: 'guclu', label: 'Güçlü', desc: 'Kalın & Çarpıcı' },
]

const SHAPES: { value: PhotoShape; label: string }[] = [
  { value: 'square', label: '▪' },
  { value: 'rounded', label: '▢' },
  { value: 'circle', label: '●' },
]

const ALIGNS: { value: 'left' | 'center' | 'right' | 'justify'; icon: typeof AlignLeft }[] = [
  { value: 'left', icon: AlignLeft },
  { value: 'center', icon: AlignCenter },
  { value: 'right', icon: AlignRight },
  { value: 'justify', icon: AlignJustify },
]

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ num, title, children, d }: {
  num?: number; title: string; children: React.ReactNode; d: boolean
}) {
  const border = d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const bg = d ? '#0f172a' : '#ffffff'
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 12 }}>
      <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: d ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
        {num ? `${num}. ` : ''}{title}
      </p>
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CvOlusturPage() {
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.loading)

  const {
    cvText, cvFileName, jobDescription,
    isProcessing, processingError,
    cvData, atsAnalysis,
    isSaving, savedSessionId,
    template, accentColor, voice, textAlign, photoDataUrl, photoShape,
    setCvText, setJobDescription, setProcessing, setCvData, setAtsAnalysis,
    setSaving, setSaved, setTemplate, setAccentColor, setVoice, setTextAlign,
    setPhoto, resetSession,
  } = useCvStore()

  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [lastLang, setLastLang] = useState<'tr' | 'en'>('tr')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const debouncedCvData = useDebouncedValue(cvData, 350)
  const debouncedPhoto = useDebouncedValue(photoDataUrl, 400)

  const textColor = d ? '#f1f5f9' : '#0f172a'
  const mutedColor = d ? '#64748b' : '#94a3b8'
  const borderColor = d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const panelBg = d ? '#0d1117' : '#f8fafc'

  // ── File upload ──────────────────────────────────────────────────────────────
  async function processFile(file: File) {
    setFileError('')
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`Dosya ${MAX_FILE_SIZE_MB}MB'den büyük olamaz.`)
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    setFileLoading(true)
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
        setFileError('Desteklenen formatlar: PDF, DOCX, TXT')
        return
      }
      if (text.length < 20) { setFileError('Dosyadan yeterli metin çıkarılamadı.'); return }
      setCvText(text, file.name)
    } catch { setFileError('Dosya okunamadı.') }
    finally { setFileLoading(false) }
  }

  // ── Photo upload ─────────────────────────────────────────────────────────────
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target?.result as string, photoShape)
    reader.readAsDataURL(file)
  }

  // ── Generate CV ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async (language: 'tr' | 'en') => {
    if (!cvText) { toast.error('Önce CV yükleyin.'); return }
    setProcessing(true)
    setLastLang(language)
    try {
      const res = await fetch('/api/cv-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, jobDescription: jobDescription || undefined, language, voice }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'API hatası')
      }
      const data = await res.json() as CvOptimizeResponse
      setCvData(data.cvData)
      setAtsAnalysis(data.atsAnalysis ?? null)
      toast.success('CV oluşturuldu!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
      setProcessing(false, msg)
      toast.error(`CV oluşturulamadı: ${msg}`)
    } finally {
      setProcessing(false)
    }
  }, [cvText, jobDescription, voice, setProcessing, setCvData, setAtsAnalysis])

  // ── Save ─────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!user || !cvData) return
    setSaving(true)
    try {
      const id = await saveCvSession({
        userId: user.uid, cvData,
        atsAnalysis: atsAnalysis ?? undefined,
        jobDescription: jobDescription || undefined,
        orijinalDosyaAdi: cvFileName || undefined,
        dil: lastLang,
      })
      setSaved(id)
      toast.success('CV kaydedildi!')
    } catch { toast.error('Kaydetme başarısız.') }
    finally { setSaving(false) }
  }

  // ── Auth states ──────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 16px' }}>
        <div style={{ maxWidth: 440, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📄</div>
          <h2 style={{ color: textColor, fontSize: 22, fontWeight: 700, marginBottom: 10 }}>CV Oluştur & Optimize</h2>
          <p style={{ color: mutedColor, fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
            Bu özelliği kullanmak için giriş yapman gerekiyor.
          </p>
          <Link to="/giris" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
            Giriş Yap
          </Link>
        </div>
      </div>
    )
  }

  // ── Layout ───────────────────────────────────────────────────────────────────
  const btnBase: React.CSSProperties = {
    border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', background: panelBg }}>

      {/* ══ LEFT PANEL ══════════════════════════════════════════════════════════ */}
      <div style={{ width: 440, flexShrink: 0, overflowY: 'auto', borderRight: `1px solid ${borderColor}`, background: d ? '#0d1117' : '#f1f5f9' }}>
        <div style={{ padding: '20px 16px 32px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={20} style={{ color: '#6366f1' }} />
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: textColor }}>CV Oluştur & Optimize</p>
                <p style={{ margin: 0, fontSize: 10, color: mutedColor }}>Profesyonel Kariyer Asistanı</p>
              </div>
            </div>
            {cvData && (
              <button onClick={resetSession} style={{ ...btnBase, padding: '6px 10px', background: 'transparent', border: `1px solid ${borderColor}`, color: mutedColor, fontSize: 11 }}>
                <RotateCcw size={11} /> Sıfırla
              </button>
            )}
          </div>

          {/* ── 1. CV Upload ── */}
          <SectionCard num={1} title="Mevcut CV'nizi Yükleyin" d={d}>
            {!cvText ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#6366f1' : borderColor}`,
                  borderRadius: 10, padding: '20px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  cursor: 'pointer', background: dragOver ? 'rgba(99,102,241,0.04)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                {fileLoading ? (
                  <div style={{ width: 24, height: 24, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <>
                    <Upload size={18} style={{ color: '#6366f1', flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: textColor }}>PDF Seç / Sürükle</p>
                      <p style={{ margin: 0, fontSize: 11, color: mutedColor }}>PDF, DOCX, TXT (max {MAX_FILE_SIZE_MB}MB)</p>
                    </div>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: `1px solid rgba(99,102,241,0.2)` }}>
                <FileText size={18} style={{ color: '#6366f1', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, color: textColor, fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cvFileName || 'CV Yüklendi'}</p>
                  <p style={{ margin: 0, color: mutedColor, fontSize: 10 }}>{cvText.length.toLocaleString()} karakter</p>
                </div>
                <button onClick={() => { setCvText('', ''); if (fileInputRef.current) fileInputRef.current.value = '' }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor, padding: 2, display: 'flex' }}>
                  <X size={14} />
                </button>
              </div>
            )}
            {fileError && <p style={{ margin: '8px 0 0', color: '#ef4444', fontSize: 11 }}>{fileError}</p>}
          </SectionCard>

          {/* ── 2. Profile Photo ── */}
          <SectionCard num={2} title="Profil Fotoğrafı" d={d}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Photo preview */}
              <div
                onClick={() => photoInputRef.current?.click()}
                style={{
                  width: 56, height: 56, flexShrink: 0, cursor: 'pointer',
                  borderRadius: photoShape === 'circle' ? '50%' : photoShape === 'rounded' ? 10 : 4,
                  border: `2px dashed ${borderColor}`,
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: d ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                }}
              >
                {photoDataUrl
                  ? <img src={photoDataUrl} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Camera size={20} style={{ color: mutedColor }} />
                }
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />

              <div style={{ flex: 1 }}>
                {/* Shape buttons */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {SHAPES.map(s => (
                    <button key={s.value} onClick={() => setPhoto(photoDataUrl, s.value)}
                      style={{ ...btnBase, width: 32, height: 32, fontSize: 16, background: photoShape === s.value ? '#6366f1' : (d ? 'rgba(255,255,255,0.06)' : '#e2e8f0'), color: photoShape === s.value ? '#fff' : textColor }}>
                      {s.label}
                    </button>
                  ))}
                  {photoDataUrl && (
                    <button onClick={() => setPhoto(null, photoShape)}
                      style={{ ...btnBase, padding: '0 10px', height: 32, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 11 }}>
                      Sil
                    </button>
                  )}
                </div>
                <button onClick={() => photoInputRef.current?.click()}
                  style={{ ...btnBase, padding: '6px 12px', background: d ? 'rgba(255,255,255,0.06)' : '#e2e8f0', color: textColor, fontSize: 11 }}>
                  Dosya Seç
                </button>
              </div>
            </div>
          </SectionCard>

          {/* ── 3. Job Description ── */}
          <SectionCard num={3} title="Hedef İş İlanı" d={d}>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: mutedColor }}>İlanı eklerseniz CV bu pozisyona özel optimize edilir ve ATS skoru hesaplanır.</p>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="İlan metnini buraya yapıştırın..."
              rows={5}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
                background: d ? 'rgba(255,255,255,0.04)' : '#fff',
                border: `1px solid ${borderColor}`, color: textColor,
                fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: 'inherit',
              }}
            />
            <p style={{ margin: '4px 0 0', fontSize: 10, color: mutedColor, textAlign: 'right' }}>{jobDescription.length}/2000</p>
          </SectionCard>

          {/* ── 4. Design ── */}
          <SectionCard num={4} title="Tasarım ve Özelleştirme" d={d}>

            {/* Template selector */}
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: mutedColor, display: 'flex', alignItems: 'center', gap: 5 }}>
              <LayoutTemplate size={12} /> Şablon
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setTemplate(t.id)}
                  style={{
                    ...btnBase, flexDirection: 'column', gap: 2,
                    padding: '8px 4px', borderRadius: 8, fontSize: 11,
                    background: template === t.id ? '#6366f1' : (d ? 'rgba(255,255,255,0.05)' : '#f1f5f9'),
                    color: template === t.id ? '#fff' : textColor,
                    border: template === t.id ? '2px solid #6366f1' : `2px solid ${borderColor}`,
                  }}>
                  <span style={{ fontWeight: 700 }}>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Color picker */}
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: mutedColor }}>Renk & Vurgular</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
              {COLOR_PRESETS.map(c => (
                <button key={c} onClick={() => setAccentColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', flexShrink: 0,
                    boxShadow: accentColor === c ? `0 0 0 2px ${d ? '#1e293b' : '#fff'}, 0 0 0 4px ${c}` : 'none',
                    transition: 'box-shadow 0.15s',
                  }} />
              ))}
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                style={{ width: 28, height: 28, borderRadius: '50%', border: `1px dashed ${borderColor}`, cursor: 'pointer', padding: 0, background: 'transparent' }} />
            </div>

            {/* Voice toggle */}
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: mutedColor }}>Anlatım Dili</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {([['first', '1. Tekil (Yaptım)'], ['third', '3. Tekil (Yaptı)']] as const).map(([v, label]) => (
                <button key={v} onClick={() => setVoice(v)}
                  style={{ ...btnBase, flex: 1, padding: '7px 8px', fontSize: 11, background: voice === v ? '#6366f1' : (d ? 'rgba(255,255,255,0.05)' : '#f1f5f9'), color: voice === v ? '#fff' : textColor, border: voice === v ? '2px solid #6366f1' : `2px solid ${borderColor}` }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Text alignment */}
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: mutedColor, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Type size={12} /> Metin Hizalama
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {ALIGNS.map(({ value, icon: Icon }) => (
                <button key={value} onClick={() => setTextAlign(value)}
                  style={{ ...btnBase, width: 36, height: 36, background: textAlign === value ? '#6366f1' : (d ? 'rgba(255,255,255,0.05)' : '#f1f5f9'), color: textAlign === value ? '#fff' : textColor, border: textAlign === value ? '2px solid #6366f1' : `2px solid ${borderColor}` }}>
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </SectionCard>

          {/* ── Generate buttons ── */}
          {processingError && (
            <div style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12 }}>
              {processingError}
            </div>
          )}
          <button
            onClick={() => handleGenerate('tr')}
            disabled={!cvText || isProcessing}
            style={{ ...btnBase, width: '100%', padding: '13px', marginBottom: 8, fontSize: 14, background: (!cvText || isProcessing) ? (d ? 'rgba(255,255,255,0.06)' : '#e2e8f0') : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: (!cvText || isProcessing) ? mutedColor : '#fff', boxShadow: (!cvText || isProcessing) ? 'none' : '0 4px 16px rgba(99,102,241,0.3)' }}>
            {isProcessing ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Oluşturuluyor...
              </>
            ) : '✨ Türkçe CV Tasarla'}
          </button>
          <button
            onClick={() => handleGenerate('en')}
            disabled={!cvText || isProcessing}
            style={{ ...btnBase, width: '100%', padding: '13px', fontSize: 14, background: 'transparent', color: (!cvText || isProcessing) ? mutedColor : textColor, border: `1px solid ${borderColor}` }}>
            🌐 İngilizce CV Tasarla
          </button>

          {/* ── 5. CV Editor (after generation) ── */}
          {cvData && (
            <>
              <div style={{ margin: '20px 0 0', paddingTop: 16, borderTop: `1px solid ${borderColor}` }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: d ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>5. CV'yi Düzenle</p>
                <CvEditor d={d} />
              </div>
              {atsAnalysis && <AtsPanel analysis={atsAnalysis} d={d} />}
            </>
          )}

        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>

      {/* ══ RIGHT PANEL ═════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: d ? '#111827' : '#e5e7eb' }}>

        {/* Preview header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: d ? '#0d1117' : '#ffffff', borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cvData ? '#22c55e' : '#94a3b8' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: textColor }}>
              Canlı Önizleme {cvData ? `(${lastLang === 'tr' ? 'TR' : 'EN'})` : ''}
            </span>
          </div>
          {cvData && (
            <div style={{ display: 'flex', gap: 8 }}>
              <PDFDownloadLink
                document={<CvTemplate cvData={cvData} template={template} accentColor={accentColor} textAlign={textAlign} photoDataUrl={photoDataUrl} photoShape={photoShape} />}
                fileName={`${cvData.kisiselBilgiler.ad || 'cv'}.pdf`}
                style={{ textDecoration: 'none' }}
              >
                {({ loading: pdfLoading }) => (
                  <button disabled={pdfLoading} style={{ ...btnBase, padding: '7px 14px', fontSize: 12, background: pdfLoading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                    <Download size={13} /> {pdfLoading ? 'Hazırlanıyor...' : 'PDF İndir'}
                  </button>
                )}
              </PDFDownloadLink>
              <button
                onClick={handleSave}
                disabled={isSaving || !!savedSessionId}
                style={{ ...btnBase, padding: '7px 14px', fontSize: 12, background: savedSessionId ? 'rgba(34,197,94,0.1)' : 'transparent', color: savedSessionId ? '#22c55e' : mutedColor, border: `1px solid ${borderColor}` }}>
                {isSaving ? 'Kaydediliyor...' : savedSessionId ? '✓ Kaydedildi' : 'Kaydet'}
              </button>
            </div>
          )}
        </div>

        {/* PDF preview area */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {isProcessing ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: d ? '#111827' : '#e5e7eb' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', border: `4px solid ${borderColor}`, borderTopColor: '#6366f1', animation: 'spin 1s linear infinite' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 6px', color: textColor, fontSize: 16, fontWeight: 600 }}>Tasarım Oluşturuluyor...</p>
                <p style={{ margin: 0, color: mutedColor, fontSize: 13 }}>AI CV'nizi analiz ediyor, 10-20 saniye sürebilir</p>
              </div>
            </div>
          ) : debouncedCvData ? (
            <PDFViewer width="100%" height="100%" showToolbar={false}>
              <CvTemplate
                cvData={debouncedCvData}
                template={template}
                accentColor={accentColor}
                textAlign={textAlign}
                photoDataUrl={debouncedPhoto}
                photoShape={photoShape}
              />
            </PDFViewer>
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <FileText size={52} style={{ color: d ? '#374151' : '#d1d5db' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', color: d ? '#4b5563' : '#9ca3af', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                  VERİLERİ DOLDURUN VE TASARLAYIN
                </p>
                <p style={{ margin: 0, color: mutedColor, fontSize: 12 }}>CV yükleyin, ardından "Türkçe CV Tasarla" butonuna tıklayın</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
