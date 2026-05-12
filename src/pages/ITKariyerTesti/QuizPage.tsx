import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, LogOut } from 'lucide-react'
import { SORULAR, ALAN_KEYS } from './it-kariyer-data'
import { useAppStore } from '../../store/useAppStore'
import './it-kariyer-testi.css'

function calcScores(answers: (number | null)[]) {
  const p: Record<string, number> = Object.fromEntries(ALAN_KEYS.map(k => [k, 0]))
  answers.forEach((secIndex, sIndex) => {
    if (secIndex !== null) {
      const sec = SORULAR[sIndex].secenekler[secIndex]
      Object.entries(sec.puanlar).forEach(([alan, puan]) => {
        p[alan] = (p[alan] ?? 0) + (puan ?? 0)
      })
    }
  })
  return p
}

export default function QuizPage() {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cevaplar, setCevaplar] = useState<(number | null)[]>(Array(SORULAR.length).fill(null))
  const [advancing, setAdvancing] = useState(false)
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  const isLast = currentIndex === SORULAR.length - 1
  const soru = SORULAR[currentIndex]
  const progress = ((currentIndex + 1) / SORULAR.length) * 100
  const currentAnswer = cevaplar[currentIndex]
  const hasAnswer = currentAnswer !== null

  const handleSelect = (optIndex: number) => {
    if (advancing) return
    const updated = [...cevaplar]
    updated[currentIndex] = optIndex
    setCevaplar(updated)
  }

  const handleNext = () => {
    if (!hasAnswer || advancing) return
    setAdvancing(true)
    setTimeout(() => {
      setAdvancing(false)
      setCurrentIndex(i => i + 1)
    }, 280)
  }

  const handleBack = () => {
    if (currentIndex > 0 && !advancing) setCurrentIndex(i => i - 1)
  }

  const handleFinish = () => {
    sessionStorage.setItem('it_kariyer_puanlar', JSON.stringify(calcScores(cevaplar)))
    navigate('/it-kariyer-testi/sonuc')
  }

  const handleExit = () => navigate('/it-kariyer-testi')

  const navBtnBase: React.CSSProperties = {
    border: 'none', borderRadius: '12px',
    padding: '12px 24px', fontSize: '15px', fontWeight: 700,
    cursor: 'pointer', transition: 'opacity 0.2s, transform 0.2s',
  }

  return (
    <>
      <div className="kt-page">
        <div style={{ maxWidth: 680, width: '100%' }}>

          {/* Progress */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: d ? '#64748b' : '#475569', fontWeight: 600 }}>
                Soru {currentIndex + 1} / {SORULAR.length}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '13px', color: d ? '#64748b' : '#475569' }}>
                  %{Math.round(progress)} tamamlandı
                </span>
                <button
                  onClick={handleExit}
                  style={{
                    padding: '5px 11px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600,
                    border: '1.5px solid #ef4444', background: 'transparent', cursor: 'pointer',
                    color: '#ef4444', display: 'flex', alignItems: 'center', gap: '5px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <LogOut size={12} /> Testten Çık
                </button>
              </div>
            </div>
            <div className="kt-progress-track">
              <div className="kt-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="kt-card"
              style={{ padding: '28px 24px', marginBottom: '1.25rem' }}
            >
              {/* Question number + text */}
              <div style={{ display: 'flex', gap: '14px', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: d ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 700, color: d ? '#a5b4fc' : '#6366f1',
                  marginTop: '1px',
                }}>
                  {currentIndex + 1}
                </div>
                <h2 style={{
                  fontSize: 'clamp(1rem, 2.4vw, 1.15rem)', fontWeight: 700,
                  color: d ? '#f1f5f9' : '#0f172a', lineHeight: 1.45, margin: 0,
                }}>
                  {soru.soru}
                </h2>
              </div>

              <p style={{ fontSize: '12.5px', color: d ? '#64748b' : '#94a3b8', marginBottom: '1.4rem', paddingLeft: '46px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                ℹ️ Lütfen sana en uygun olanı seç.
              </p>

              {/* Options */}
              <motion.div
                key={`opts-${currentIndex}`}
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                initial="hidden"
                animate="show"
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                {soru.secenekler.map((sec, i) => {
                  const selected = currentAnswer === i
                  return (
                    <motion.button
                      key={i}
                      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                      transition={{ duration: 0.2 }}
                      className={`kt-option${selected ? ' kt-selected' : ''}`}
                      onClick={() => handleSelect(i)}
                      disabled={advancing}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                      {/* Radio circle */}
                      <span style={{
                        flexShrink: 0, width: '18px', height: '18px', borderRadius: '50%',
                        border: selected ? '5px solid #6366f1' : `2px solid ${d ? '#475569' : '#cbd5e1'}`,
                        background: selected ? 'white' : 'transparent',
                        transition: 'border 0.15s',
                        boxSizing: 'border-box',
                      }} />
                      <span style={{ color: '#6366f1', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                        {String.fromCharCode(65 + i)})
                      </span>
                      <span>{sec.metin}</span>
                    </motion.button>
                  )
                })}
              </motion.div>

              {/* No-selection hint */}
              {!hasAnswer && (
                <p style={{ fontSize: '12px', color: d ? '#64748b' : '#94a3b8', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  ℹ️ Devam etmek için bir seçenek seçmelisin.
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={handleBack}
              disabled={currentIndex === 0 || advancing}
              style={{
                ...navBtnBase,
                background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                color: currentIndex === 0 ? (d ? '#334155' : '#94a3b8') : (d ? '#94a3b8' : '#475569'),
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '10px 16px', fontSize: '14px',
              }}
            >
              <ChevronLeft size={15} /> Geri
            </button>

            {isLast ? (
              <button
                onClick={handleFinish}
                disabled={!hasAnswer}
                style={{
                  ...navBtnBase,
                  background: hasAnswer ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : (d ? '#1e293b' : '#e2e8f0'),
                  color: hasAnswer ? 'white' : (d ? '#334155' : '#94a3b8'),
                  boxShadow: hasAnswer ? '0 4px 18px rgba(99,102,241,0.35)' : 'none',
                  cursor: hasAnswer ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={e => { if (hasAnswer) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1.03)' } }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
              >
                Sonuçları Gör →
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!hasAnswer || advancing}
                style={{
                  ...navBtnBase,
                  background: hasAnswer ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : (d ? '#1e293b' : '#e2e8f0'),
                  color: hasAnswer ? 'white' : (d ? '#334155' : '#94a3b8'),
                  boxShadow: hasAnswer ? '0 4px 18px rgba(99,102,241,0.35)' : 'none',
                  cursor: hasAnswer && !advancing ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={e => { if (hasAnswer) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1.03)' } }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
              >
                İleri →
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  )
}

