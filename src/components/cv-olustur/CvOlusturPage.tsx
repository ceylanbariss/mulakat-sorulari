import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import { Download, Save, RotateCcw, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../store/useAppStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useCvStore } from '../../store/useCvStore'
import { saveCvSession } from '../../lib/firestore'
import type { CvOptimizeResponse } from '../../types/cv'
import { CvTemplate } from './CvTemplate'
import { CvUploadStep } from './CvUploadStep'
import { JobDescStep } from './JobDescStep'
import { CvEditor } from './CvEditor'
import { AtsPanel } from './AtsPanel'

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

function detectLanguage(text: string): 'tr' | 'en' {
  const trChars = (text.match(/[ğüşıöçĞÜŞİÖÇ]/g) ?? []).length
  return trChars > 5 ? 'tr' : 'en'
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function Steps({ current }: { current: 1 | 2 | 3 }) {
  const labels = ['CV Yükle', 'İş İlanı', 'Düzenle & İndir']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {labels.map((label, i) => {
        const num = i + 1
        const done = current > num
        const active = current === num
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: done ? '#6366f1' : active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.06)',
                color: done || active ? '#fff' : '#64748b',
                boxShadow: active ? '0 0 0 3px rgba(99,102,241,0.25)' : 'none',
              }}>
                {done ? '✓' : num}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: active ? '#818cf8' : done ? '#6366f1' : '#64748b', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 2, background: done ? '#6366f1' : 'rgba(255,255,255,0.06)', margin: '0 12px', borderRadius: 1 }} />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function CvOlusturPage() {
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'
  const user = useAuthStore(s => s.user)
  const authLoading = useAuthStore(s => s.loading)

  const {
    step, cvText, cvFileName, jobDescription,
    isProcessing, processingError,
    cvData, atsAnalysis,
    isSaving, savedSessionId,
    setProcessing, setCvData, setAtsAnalysis,
    setSaving, setSaved, goToStep, resetSession,
  } = useCvStore()

  const debouncedCvData = useDebouncedValue(cvData, 350)

  const textColor = d ? '#f1f5f9' : '#0f172a'
  const mutedColor = d ? '#64748b' : '#94a3b8'
  const borderColor = d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  const handleProcess = useCallback(async () => {
    setProcessing(true)
    try {
      const lang = detectLanguage(cvText)
      const res = await fetch('/api/cv-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, jobDescription: jobDescription || undefined, language: lang }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'API hatası')
      }
      const data = await res.json() as CvOptimizeResponse
      setCvData(data.cvData)
      setAtsAnalysis(data.atsAnalysis ?? null)
      goToStep(3)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
      setProcessing(false, msg)
      toast.error(`CV optimize edilemedi: ${msg}`)
    } finally {
      setProcessing(false)
    }
  }, [cvText, jobDescription, setProcessing, setCvData, setAtsAnalysis, goToStep])

  async function handleSave() {
    if (!user || !cvData) return
    setSaving(true)
    try {
      const id = await saveCvSession({
        userId: user.uid,
        cvData,
        atsAnalysis: atsAnalysis ?? undefined,
        jobDescription: jobDescription || undefined,
        orijinalDosyaAdi: cvFileName || undefined,
        dil: detectLanguage(cvText),
      })
      setSaved(id)
      toast.success('CV kaydedildi!')
    } catch {
      toast.error('Kaydetme başarısız.')
    } finally {
      setSaving(false)
    }
  }

  // Auth loading
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Auth gate
  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ minHeight: '100vh', paddingTop: 100, display: 'flex', justifyContent: 'center', paddingLeft: 16, paddingRight: 16 }}
      >
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>📄</div>
          <h2 style={{ color: textColor, fontSize: 22, fontWeight: 700, marginBottom: 10 }}>CV Oluştur & Optimize</h2>
          <p style={{ color: mutedColor, fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
            Bu özelliği kullanmak için giriş yapman gerekiyor. CV'ni yükle, AI ile optimize et ve profesyonel PDF olarak indir.
          </p>
          <Link to="/giris" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
            Giriş Yap
          </Link>
        </div>
      </motion.div>
    )
  }

  // Processing screen
  if (isProcessing) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 48, height: 48, border: '4px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        <p style={{ color: textColor, fontSize: 16, fontWeight: 600, margin: 0 }}>CV optimize ediliyor...</p>
        <p style={{ color: mutedColor, fontSize: 13, margin: 0 }}>AI CV'nizi analiz ediyor, bu 10-20 saniye sürebilir</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 64 }}>
      <div style={{ maxWidth: step === 3 ? '100%' : 720, margin: '0 auto', padding: step === 3 ? '0 24px' : '0 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ color: textColor, fontSize: 26, fontWeight: 800, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={24} style={{ color: '#6366f1' }} />
              CV Oluştur & Optimize
            </h1>
            <p style={{ color: mutedColor, fontSize: 13, margin: 0 }}>AI ile CV'nizi optimize edin, iş ilanına uyarlayın ve PDF olarak indirin</p>
          </div>
          {step > 1 && (
            <button
              onClick={resetSession}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${borderColor}`, color: mutedColor, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <RotateCcw size={13} /> Yeniden Başla
            </button>
          )}
        </div>

        <Steps current={step} />

        {processingError && (
          <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13 }}>
            {processingError}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <CvUploadStep d={d} onNext={() => goToStep(2)} />
          </motion.div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <JobDescStep d={d} onNext={handleProcess} onSkip={handleProcess} />
          </motion.div>
        )}

        {/* Step 3: Editor + PDF Preview */}
        {step === 3 && cvData && debouncedCvData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>

              {/* Left: Editor */}
              <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)', paddingRight: 4 }}>
                <CvEditor d={d} />
                {atsAnalysis && <AtsPanel analysis={atsAnalysis} d={d} />}
              </div>

              {/* Right: PDF Preview + Actions */}
              <div style={{ position: 'sticky', top: 88 }}>
                <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${borderColor}`, height: 'calc(100vh - 220px)', minHeight: 600 }}>
                  <PDFViewer width="100%" height="100%" showToolbar={false}>
                    <CvTemplate cvData={debouncedCvData} />
                  </PDFViewer>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <PDFDownloadLink
                    document={<CvTemplate cvData={cvData} />}
                    fileName={`${cvData.kisiselBilgiler.ad || 'cv'}-optimized.pdf`}
                    style={{ flex: 1, textDecoration: 'none' }}
                  >
                    {({ loading: pdfLoading }) => (
                      <button
                        disabled={pdfLoading}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 16px', borderRadius: 10, border: 'none', background: pdfLoading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: pdfLoading ? 'wait' : 'pointer', boxShadow: pdfLoading ? 'none' : '0 4px 14px rgba(99,102,241,0.3)' }}
                      >
                        <Download size={15} /> {pdfLoading ? 'Hazırlanıyor...' : 'PDF İndir'}
                      </button>
                    )}
                  </PDFDownloadLink>

                  <button
                    onClick={handleSave}
                    disabled={isSaving || !!savedSessionId}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 16px', borderRadius: 10, border: `1px solid ${borderColor}`, background: savedSessionId ? 'rgba(34,197,94,0.1)' : 'transparent', color: savedSessionId ? '#22c55e' : mutedColor, fontSize: 13, fontWeight: 700, cursor: isSaving || savedSessionId ? 'default' : 'pointer', transition: 'all 0.15s' }}
                  >
                    <Save size={15} />
                    {isSaving ? 'Kaydediliyor...' : savedSessionId ? 'Kaydedildi ✓' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
