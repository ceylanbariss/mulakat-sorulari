import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useMulakatStore } from '../../store/useMulakatStore'
import { StepIndicator } from './StepIndicator'
import { Step1Upload } from './Step1Upload'
import { Step2TypeSelect } from './Step2TypeSelect'
import { Step3Chat } from './Step3Chat'
import { HistoryPanel } from './HistoryPanel'

export function MulakatSimPage() {
  const theme = useAppStore((s) => s.theme)
  const d = theme === 'dark'
  const user = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)
  const { step, goToStep } = useMulakatStore()

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

  // ── Giriş yapılmamış ──
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, borderRadius: '24px', textAlign: 'center', padding: '64px 40px' }}
          >
            <div style={{ fontSize: '64px', marginBottom: '24px', lineHeight: 1 }}>🤖</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: d ? 'white' : '#0f172a', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              AI Mülakat Simülasyonu
            </h2>
            <p style={{ fontSize: '15px', color: d ? 'rgba(148,163,184,0.75)' : 'rgba(71,85,105,0.75)', maxWidth: '360px', margin: '0 auto 32px', lineHeight: 1.75 }}>
              CV'nizi yükleyip yapay zeka ile gerçekçi mülakat pratiği yapmak için giriş yapın.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/giris"
                className="btn-gradient-bg"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '14px', fontSize: '14px', fontWeight: 700, boxShadow: '0 8px 24px rgba(99,102,241,0.35)', textDecoration: 'none' }}
              >
                Giriş Yap <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Ana içerik ──
  const stepTitles = ['CV & İş İlanı', 'Mülakat Türü', 'AI ile Mülakat']
  const stepDescs = [
    "CV'nizi yükleyin ve başvurduğunuz pozisyonu açıklayın",
    'Mülakat türünü seçin, AI soruları hazırlasın',
    'Gerçek zamanlı soru-cevap seansınız',
  ]

  return (
    <div style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
        {/* Başlık */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '40px', textAlign: 'center' }}
        >
          <h1 style={{ fontSize: '36px', fontWeight: 900, color: d ? 'white' : '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '8px' }}>
            AI Mülakat Simülasyonu
          </h1>
          <p style={{ fontSize: '16px', color: d ? 'rgba(148,163,184,0.65)' : 'rgba(71,85,105,0.7)' }}>
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
          style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, borderRadius: '24px', padding: '40px' }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: d ? 'white' : '#0f172a', marginBottom: '24px', letterSpacing: '-0.01em' }}>
            {stepTitles[step - 1]}
          </h2>

          {step === 1 && (
            <Step1Upload d={d} onNext={() => goToStep(2)} />
          )}
          {step === 2 && (
            <Step2TypeSelect d={d} onStart={() => goToStep(3)} />
          )}
          {step === 3 && (
            <Step3Chat d={d} userId={user.uid} onFinished={() => goToStep(1)} />
          )}
        </motion.div>

        {/* Geçmiş — sadece adım 1'de göster */}
        {step === 1 && (
          <HistoryPanel userId={user.uid} d={d} />
        )}
      </div>
    </div>
  )
}
