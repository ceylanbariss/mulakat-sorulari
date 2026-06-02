import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, LogOut } from 'lucide-react'
import { careerTestQuestions } from '../../data/careerTestQuestions'
import type { AreaScores } from '../../data/careerTestQuestions'
import { ALAN_KEYS } from './it-kariyer-data'
import { useAppStore } from '../../store/useAppStore'
import './it-kariyer-testi.css'

// Map new careerTestQuestions keys → it-kariyer-data keys (for ResultPage compatibility)
const KEY_MAP: Record<keyof AreaScores, string> = {
  yazilim: 'yazilim',
  veri: 'veri',
  siberGuvenlik: 'siber',
  devops: 'devops',
  sistemAg: 'ag_sistem',
  uxui: 'ux',
  itDestek: 'destek',
  projeYonetimi: 'proje',
}

const SORULAR = careerTestQuestions.map(q => ({
  id: q.id,
  soru: q.question,
  secenekler: q.options.map(opt => ({
    metin: opt.text,
    puanlar: Object.fromEntries(
      Object.entries(opt.scores).map(([k, v]) => [KEY_MAP[k as keyof AreaScores], v])
    ) as Partial<Record<string, number>>,
  })),
}))

const STORAGE_KEY = 'careerTest_progress'
const EXPIRY_MS = 24 * 60 * 60 * 1000

interface SavedProgress {
  currentQuestion: number
  answers: Record<number, number>
}

function loadProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.timestamp > EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return { currentQuestion: data.currentQuestion, answers: data.answers }
  } catch {
    return null
  }
}

function saveProgress(currentQuestion: number, answers: Record<number, number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    currentQuestion,
    answers,
    timestamp: Date.now(),
  }))
}

function calcScores(answers: Record<number, number>) {
  const p: Record<string, number> = Object.fromEntries(ALAN_KEYS.map(k => [k, 0]))
  Object.entries(answers).forEach(([sIdx, secIndex]) => {
    const soru = SORULAR[Number(sIdx)]
    if (!soru) return
    const sec = soru.secenekler[secIndex]
    if (!sec) return
    Object.entries(sec.puanlar).forEach(([alan, puan]) => {
      p[alan] = (p[alan] ?? 0) + (puan ?? 0)
    })
  })
  return p
}

export default function QuizPage() {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [advancing, setAdvancing] = useState(false)
  const [showResume, setShowResume] = useState(false)
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null)
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  useEffect(() => {
    const prog = loadProgress()
    if (prog && Object.keys(prog.answers).length > 0) {
      setSavedProgress(prog)
      setShowResume(true)
    }
  }, [])

  const isLast = currentIndex === SORULAR.length - 1
  const soru = SORULAR[currentIndex]
  const progress = ((currentIndex + 1) / SORULAR.length) * 100
  const currentAnswer = answers[currentIndex] ?? null

  const handleSelect = (optIndex: number) => {
    if (advancing) return
    const updated = { ...answers, [currentIndex]: optIndex }
    setAnswers(updated)
    saveProgress(currentIndex, updated)
    if (isLast) {
      setTimeout(() => {
        localStorage.removeItem(STORAGE_KEY)
        sessionStorage.setItem('it_kariyer_puanlar', JSON.stringify(calcScores(updated)))
        navigate('/it-kariyer-testi/sonuc')
      }, 350)
    } else {
      setAdvancing(true)
      setTimeout(() => {
        setAdvancing(false)
        const nextIndex = currentIndex + 1
        setCurrentIndex(nextIndex)
        saveProgress(nextIndex, updated)
      }, 350)
    }
  }

  const handleBack = () => {
    if (currentIndex > 0 && !advancing) setCurrentIndex(i => i - 1)
  }

  const handleExit = () => {
    if (window.confirm('Testi sonlandırmak istediğine emin misin?')) {
      navigate('/it-kariyer-testi')
    }
  }

  const handleResume = () => {
    if (savedProgress) {
      setAnswers(savedProgress.answers)
      setCurrentIndex(savedProgress.currentQuestion)
    }
    setShowResume(false)
  }

  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAnswers({})
    setCurrentIndex(0)
    setShowResume(false)
  }

  const navBtnBase: React.CSSProperties = {
    border: 'none', borderRadius: '12px',
    padding: '12px 24px', fontSize: '15px', fontWeight: 700,
    cursor: 'pointer', transition: 'opacity 0.2s, transform 0.2s',
  }

  return (
    <>
      <div className="kt-page">
        <div style={{ maxWidth: 680, width: '100%' }}>

          {/* Resume Banner */}
          {showResume && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '1.25rem',
                padding: '14px 18px',
                borderRadius: '14px',
                background: d ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
                border: '1.5px solid rgba(99,102,241,0.3)',
                display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
              }}
            >
              <span style={{ flex: 1, fontSize: '14px', color: d ? '#a5b4fc' : '#4f46e5', fontWeight: 600 }}>
                Kaldığın yerden devam etmek ister misin?
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleResume}
                  style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  Devam Et
                </button>
                <button
                  onClick={handleRestart}
                  style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: 'transparent', border: '1px solid rgba(99,102,241,0.35)', color: d ? '#94a3b8' : '#64748b', cursor: 'pointer' }}
                >
                  Başa Dön
                </button>
              </div>
            </motion.div>
          )}

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

              <p style={{ fontSize: '12.5px', color: d ? '#64748b' : '#94a3b8', marginBottom: '1.4rem', paddingLeft: '46px' }}>
                ℹ️ Lütfen sana en uygun olanı seç.
              </p>

              {/* Options – 2×2 card grid */}
              <motion.div
                key={`opts-${currentIndex}`}
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                initial="hidden"
                animate="show"
                className="kt-options-grid"
              >
                {soru.secenekler.map((sec, i) => {
                  const selected = currentAnswer === i
                  return (
                    <motion.button
                      key={i}
                      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                      transition={{ duration: 0.2 }}
                      className={`kt-option-card${selected ? ' kt-option-card--selected' : ''}`}
                      onClick={() => handleSelect(i)}
                      disabled={advancing}
                    >
                      {sec.metin}
                    </motion.button>
                  )
                })}
              </motion.div>

              {!hasAnswer && (
                <p style={{ fontSize: '12px', color: d ? '#64748b' : '#94a3b8', marginTop: '14px' }}>
                  ℹ️ Devam etmek için bir seçenek seçmelisin.
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
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
                padding: '10px 20px', fontSize: '14px',
              }}
            >
              <ChevronLeft size={15} /> Geri
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
