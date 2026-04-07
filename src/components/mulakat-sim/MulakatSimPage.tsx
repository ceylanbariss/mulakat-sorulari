import { useLayoutEffect, useEffect, useRef, useState } from 'react'
// import { Link } from 'react-router-dom' // GEÇİCİ: auth guard kaldırıldı
import { motion } from 'framer-motion'
// import { ArrowRight } from 'lucide-react' // GEÇİCİ: auth guard kaldırıldı
import { useAppStore } from '../../store/useAppStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useMulakatStore } from '../../store/useMulakatStore'
import { StepIndicator } from './StepIndicator'
import { Step1Upload } from './Step1Upload'
import { Step2TypeSelect } from './Step2TypeSelect'
import { Step3Chat } from './Step3Chat'
import { HistoryPanel } from './HistoryPanel'
import { SplineScene } from '../ui/SplineScene'
import { Spotlight } from '../ui/Spotlight'

export function MulakatSimPage() {
  const theme = useAppStore((s) => s.theme)
  const d = theme === 'dark'
  const user = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)
  const { step, goToStep } = useMulakatStore()

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  const historyRef = useRef<HTMLDivElement>(null)
  const [scrollToHistory, setScrollToHistory] = useState(false)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [historyAutoExpand, setHistoryAutoExpand] = useState(false)

  useEffect(() => {
    if (scrollToHistory && step === 1) {
      const timer = setTimeout(() => {
        historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setScrollToHistory(false)
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [scrollToHistory, step])

  function handleFinished(saved?: boolean) {
    goToStep(1)
    if (saved) {
      setHistoryRefreshKey((k) => k + 1)
      setHistoryAutoExpand(true)
      setScrollToHistory(true)
    }
  }

  const cardBg = d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)'
  const cardBorder = d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'
  const cardShadow = '0 4px 24px rgba(0,0,0,0.07)'

  // ── Auth yükleniyor ──
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  // GEÇİCİ: Giriş yapılmamış guard devre dışı — geri almak için bu yorumu kaldır
  // if (!user) { return (...) }

  // ── Ana içerik ──
  const stepTitles = ['CV & İş İlanı', 'Mülakat Türü', 'AI ile Mülakat']
  const stepDescs = [
    "CV'nizi yükleyin ve başvurduğunuz pozisyonu açıklayın",
    'Mülakat türünü seçin, AI soruları hazırlasın',
    'Gerçek zamanlı soru-cevap seansınız',
  ]

  return (
    /* Sayfa scroll'una izin verir; kart viewport'a kilitli kalır */
    <div style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '40px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '0 24px' }}>

        {/* ── Tek büyük kart: viewport yüksekliğine kilitli ── */}
        <div style={{
          height: 'min(calc(100vh - 100px), 900px)',
          display: 'flex',
          alignItems: 'stretch',
          position: 'relative',
          background: 'rgba(2,6,23,0.96)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '28px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20"
            fill="white"
          />

          {/* ── Sol: form içeriği ── */}
          <div style={{ flex: 1, minWidth: 0, padding: '16px 28px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: step === 3 ? 'flex-start' : 'center', overflowY: step === 3 ? 'auto' : 'hidden' }}>
            {/* Başlık */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: '12px', textAlign: 'center' }}
            >
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '6px' }}>
                AI Mülakat Simülasyonu
              </h1>
              <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.65)' }}>
                {stepDescs[step - 1]}
              </p>
            </motion.div>

            {/* Adım göstergesi */}
            <StepIndicator currentStep={step} d={d} />

            {/* Adım içeriği */}
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, borderRadius: '20px', padding: '16px 24px', marginTop: '6px', ...(step === 3 ? { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: '12px' } : {}) }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: d ? 'white' : '#0f172a', marginBottom: '16px', letterSpacing: '-0.01em' }}>
                {stepTitles[step - 1]}
              </h2>

              {step === 1 && (
                <Step1Upload d={d} onNext={() => goToStep(2)} />
              )}
              {step === 2 && (
                <Step2TypeSelect d={d} onStart={() => goToStep(3)} />
              )}
              {step === 3 && (
                <Step3Chat d={d} userId={user?.uid ?? 'misafir'} onFinished={handleFinished} />
              )}
            </motion.div>
          </div>

          {/* ── Sağ: Spline robot (mobilde gizli, kart yüksekliğini doldurur) ── */}
          <div
            className="hidden xl:block"
            style={{ width: '580px', flexShrink: 0 }}
          >
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>

        </div>

        {/* ── Geçmiş — kart dışında, sayfanın alt kısmı ── */}
        {step === 1 && (
          <div ref={historyRef} style={{ marginTop: '32px' }}>
            <HistoryPanel
              userId={user?.uid ?? ''}
              d={d}
              refreshKey={historyRefreshKey}
              autoExpand={historyAutoExpand}
            />
          </div>
        )}

      </div>
    </div>
  )
}
