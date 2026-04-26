import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { SORULAR, ALAN_KEYS } from './it-kariyer-data'
import { useAppStore } from '../../store/useAppStore'
import './it-kariyer-testi.css'

function calcScores(answers: (number[] | null)[]) {
  const p: Record<string, number> = Object.fromEntries(ALAN_KEYS.map(k => [k, 0]))
  answers.forEach((secIndices, sIndex) => {
    if (secIndices !== null) {
      secIndices.forEach(secIndex => {
        const sec = SORULAR[sIndex].secenekler[secIndex]
        Object.entries(sec.puanlar).forEach(([alan, puan]) => {
          p[alan] = (p[alan] ?? 0) + (puan ?? 0)
        })
      })
    }
  })
  return p
}

export default function QuizPage() {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cevaplar, setCevaplar] = useState<(number[] | null)[]>(Array(SORULAR.length).fill(null))
  const [advancing, setAdvancing] = useState(false)
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  const isLast = currentIndex === SORULAR.length - 1
  const soru = SORULAR[currentIndex]
  const progress = (currentIndex / SORULAR.length) * 100

  const handleSelect = (optIndex: number) => {
    if (advancing) return
    const current = cevaplar[currentIndex] ?? []
    const newSelection = current.includes(optIndex)
      ? current.filter(i => i !== optIndex)
      : [...current, optIndex]
    const newCevaplar = [...cevaplar]
    newCevaplar[currentIndex] = newSelection.length ? newSelection : null
    setCevaplar(newCevaplar)
  }

  const handleNext = () => {
    if (!currentAnswers.length || advancing) return
    setAdvancing(true)
    setTimeout(() => {
      setAdvancing(false)
      setCurrentIndex(i => i + 1)
    }, 300)
  }

  const handleBack = () => {
    if (currentIndex > 0 && !advancing) {
      setCurrentIndex(i => i - 1)
    }
  }

  const handleFinish = () => {
    sessionStorage.setItem('it_kariyer_puanlar', JSON.stringify(calcScores(cevaplar)))
    navigate('/it-kariyer-testi/sonuc')
  }

  const currentAnswers = cevaplar[currentIndex] ?? []
  const isSelected = (i: number) => currentAnswers.includes(i)

  return (
    <div className="kt-page">
      <div style={{ maxWidth: 680, width: '100%' }}>

        {/* Progress */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '8px',
          }}>
            <span style={{ fontSize: '13px', color: d ? '#64748b' : '#475569', fontWeight: 500 }}>
              Soru {currentIndex + 1} / {SORULAR.length}
            </span>
            <span style={{ fontSize: '13px', color: d ? '#64748b' : '#475569' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="kt-progress-track">
            <div className="kt-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="kt-card"
            style={{ padding: '28px 24px', marginBottom: '1.25rem' }}
          >
            <h2 style={{
              fontSize: 'clamp(1rem, 2.4vw, 1.2rem)',
              fontWeight: 700,
              color: d ? '#f1f5f9' : '#0f172a',
              marginBottom: '1.5rem',
              lineHeight: 1.45,
            }}>
              {soru.soru}
            </h2>

            <motion.div
              key={`secenekler-${currentIndex}`}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.07 } },
              }}
              initial="hidden"
              animate="show"
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {soru.secenekler.map((sec, i) => (
                <motion.button
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.22 }}
                  className={`kt-option${isSelected(i) ? ' kt-selected' : ''}`}
                  onClick={() => handleSelect(i)}
                  disabled={advancing}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span style={{
                    flexShrink: 0,
                    width: '18px', height: '18px',
                    borderRadius: '5px',
                    border: isSelected(i) ? '2px solid #6366f1' : `2px solid ${d ? '#334155' : '#cbd5e1'}`,
                    background: isSelected(i) ? '#6366f1' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}>
                    {isSelected(i) && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span style={{
                    color: isSelected(i) ? '#818cf8' : '#6366f1',
                    fontWeight: 700,
                    fontSize: '13px',
                    flexShrink: 0,
                  }}>
                    {String.fromCharCode(65 + i)})
                  </span>
                  {sec.metin}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleBack}
            disabled={currentIndex === 0 || advancing}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '10px 16px', borderRadius: '10px',
              background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
              color: currentIndex === 0 ? (d ? '#334155' : '#94a3b8') : (d ? '#94a3b8' : '#475569'),
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: 500,
              transition: 'color 0.2s',
            }}
          >
            <ChevronLeft size={15} /> Geri
          </button>

          {isLast ? (
            <button
              onClick={handleFinish}
              disabled={!currentAnswers.length}
              style={{
                background: currentAnswers.length
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : (d ? '#1e293b' : '#e2e8f0'),
                color: currentAnswers.length ? 'white' : (d ? '#334155' : '#94a3b8'),
                border: 'none', borderRadius: '12px',
                padding: '12px 24px', fontSize: '15px', fontWeight: 700,
                cursor: currentAnswers.length ? 'pointer' : 'not-allowed',
                boxShadow: currentAnswers.length ? '0 4px 18px rgba(99,102,241,0.35)' : 'none',
                transition: 'opacity 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { if (currentAnswers.length) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1.03)' } }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
            >
              Sonuçları Gör →
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!currentAnswers.length || advancing}
              style={{
                background: currentAnswers.length
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : (d ? '#1e293b' : '#e2e8f0'),
                color: currentAnswers.length ? 'white' : (d ? '#334155' : '#94a3b8'),
                border: 'none', borderRadius: '12px',
                padding: '12px 24px', fontSize: '15px', fontWeight: 700,
                cursor: currentAnswers.length && !advancing ? 'pointer' : 'not-allowed',
                boxShadow: currentAnswers.length ? '0 4px 18px rgba(99,102,241,0.35)' : 'none',
                transition: 'opacity 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { if (currentAnswers.length) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1.03)' } }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
            >
              İleri →
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
