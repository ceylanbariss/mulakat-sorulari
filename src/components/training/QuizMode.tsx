import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, Save, PauseCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { type Question } from '../../data/questions'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { PageWrapper } from '../layout/PageWrapper'
import { useAuthStore } from '../../store/useAuthStore'
import { addDocument, trainingSessionsCol } from '../../lib/firestore'

interface Props {
  questions: Question[]
  kategori: string
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

interface OptionButtonProps {
  label: string
  text: string
  selected: string | null
  isCorrect: boolean
  index: number
  onClick: () => void
}

function OptionButton({ label, text, selected, isCorrect, index, onClick }: OptionButtonProps) {
  const [hovered, setHovered] = useState(false)
  const isSelected = selected === label
  const answered = !!selected

  let bg = 'rgba(255,255,255,0.04)'
  let border = 'rgba(255,255,255,0.1)'
  let textColor = 'rgba(255,255,255,0.88)'
  let letterBg = 'rgba(255,255,255,0.1)'
  let letterColor = 'rgba(255,255,255,0.65)'
  let letterText = label

  if (!answered && hovered) {
    bg = 'rgba(139,92,246,0.1)'
    border = 'rgba(139,92,246,0.45)'
    letterBg = 'rgba(139,92,246,0.2)'
    letterColor = '#a78bfa'
  }

  if (answered) {
    if (isCorrect) {
      bg = 'rgba(16,185,129,0.12)'
      border = 'rgba(16,185,129,0.45)'
      textColor = 'rgba(167,243,208,0.9)'
      letterBg = 'rgba(16,185,129,0.28)'
      letterColor = '#34d399'
      letterText = '✓'
    } else if (isSelected) {
      bg = 'rgba(239,68,68,0.12)'
      border = 'rgba(239,68,68,0.45)'
      textColor = 'rgba(252,165,165,0.9)'
      letterBg = 'rgba(239,68,68,0.28)'
      letterColor = '#f87171'
      letterText = '✗'
    } else {
      bg = 'rgba(255,255,255,0.02)'
      border = 'rgba(255,255,255,0.05)'
      textColor = 'rgba(255,255,255,0.28)'
      letterBg = 'rgba(255,255,255,0.05)'
      letterColor = 'rgba(255,255,255,0.22)'
    }
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileTap={!answered ? { scale: 0.995 } : {}}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={!!answered}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '16px 20px',
        borderRadius: '12px',
        border: `1px solid ${border}`,
        background: bg,
        color: textColor,
        fontSize: '15px',
        fontWeight: 500,
        cursor: answered ? 'default' : 'pointer',
        transition: 'all 0.18s',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '12px',
      }}
    >
      <span style={{
        width: '32px',
        height: '32px',
        minWidth: '32px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: 700,
        background: letterBg,
        color: letterColor,
        transition: 'all 0.18s',
      }}>
        {letterText}
      </span>
      <span style={{ lineHeight: 1.5 }}>{text}</span>
    </motion.button>
  )
}

export function QuizMode({ questions, kategori }: Props) {
  const navigate = useNavigate()
  const quizQuestions = questions.filter((q) => q.options && q.options.length > 0)
  const [deck] = useState(() => shuffle(quizQuestions))
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [wrongAnswers, setWrongAnswers] = useState<Question[]>([])
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [earlyFinish, setEarlyFinish] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'save' | 'pause' | null>(null)
  const [resumeData, setResumeData] = useState<{ deckIds: string[]; index: number; score: number; wrongIds: string[] } | null>(null)

  useEffect(() => {
    const u = useAuthStore.getState().user
    if (!u) return
    const key = `mulakat_session_${u.uid}_${kategori}_quiz`
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved?.deckIds?.length && saved.index > 0) setResumeData(saved)
      }
    } catch { /* ignore */ }
  }, [kategori])

  const handleResume = () => {
    if (!resumeData) return
    const idMap = new Map(quizQuestions.map(q => [q.id, q]))
    const restored = resumeData.deckIds.map(id => idMap.get(id)).filter((q): q is Question => q !== undefined)
    const restoredWrong = resumeData.wrongIds.map(id => idMap.get(id)).filter((q): q is Question => q !== undefined)
    if (restored.length) {
      setIndex(resumeData.index)
      setScore(resumeData.score)
      setWrongAnswers(restoredWrong)
    }
    setResumeData(null)
  }

  const handleNewSession = () => {
    const u = useAuthStore.getState().user
    if (u) localStorage.removeItem(`mulakat_session_${u.uid}_${kategori}_quiz`)
    setResumeData(null)
  }

  const handleFinishAndSave = () => {
    setConfirmAction(null)
    if (index === 0 && !selected) return
    const answered = selected ? index + 1 : index
    if (answered === 0) return
    const u = useAuthStore.getState().user
    if (u) {
      addDocument(trainingSessionsCol(), {
        userId: u.uid, mode: 'quiz', category: kategori,
        totalQuestions: answered, correctCount: score,
        partialCount: 0, wrongCount: wrongAnswers.length,
        score: Math.round((score / answered) * 100),
      }).catch(() => {})
      localStorage.removeItem(`mulakat_session_${u.uid}_${kategori}_quiz`)
    }
    setEarlyFinish(true)
    setDone(true)
  }

  const handlePauseLater = () => {
    setConfirmAction(null)
    const u = useAuthStore.getState().user
    if (u) {
      localStorage.setItem(
        `mulakat_session_${u.uid}_${kategori}_quiz`,
        JSON.stringify({ deckIds: deck.map(q => q.id), index, score, wrongIds: wrongAnswers.map(q => q.id), savedAt: Date.now() })
      )
    }
    navigate(`/sorular/${kategori}`)
  }

  const current = deck[index]
  const progress = (index / deck.length) * 100

  if (!quizQuestions.length) {
    return (
      <PageWrapper className="py-16 text-center">
        <p className="text-slate-500 dark:text-slate-400 mb-4">Bu kategoride quiz sorusu bulunamadı.</p>
        <Button variant="outline" onClick={() => navigate(`/sorular/${kategori}`)}>
          <ArrowLeft size={16} /> Geri Dön
        </Button>
      </PageWrapper>
    )
  }

  const handleSelect = (optionLabel: string) => {
    if (selected) return
    setSelected(optionLabel)
    const isCorrect = current.options?.find((o) => o.correct)?.label === optionLabel
    if (isCorrect) {
      setScore((s) => s + 1)
      const newStreak = streak + 1
      setStreak(newStreak)
      setMaxStreak((m) => Math.max(m, newStreak))
      if (newStreak === 3) toast.success('🔥 3 doğru üst üste!')
      if (newStreak === 5) toast.success('🚀 5 doğru üst üste! Harika!')
    } else {
      setStreak(0)
      setWrongAnswers((w) => [...w, current])
    }
  }

  const goNext = () => {
    if (index + 1 >= deck.length) {
      const user = useAuthStore.getState().user
      if (user) {
        addDocument(trainingSessionsCol(), {
          userId: user.uid,
          mode: 'quiz',
          category: kategori,
          totalQuestions: deck.length,
          correctCount: score,
          partialCount: 0,
          wrongCount: wrongAnswers.length,
          score: Math.round((score / deck.length) * 100),
        }).catch(() => {})
      }
      setDone(true)
    } else {
      setIndex((i) => i + 1)
      setSelected(null)
    }
  }

  const restart = () => {
    setIndex(0)
    setSelected(null)
    setScore(0)
    setDone(false)
    setWrongAnswers([])
    setStreak(0)
    setMaxStreak(0)
    toast.success('Yeni quiz başlatıldı!')
  }

  // ── Bitti ──
  if (done) {
    const pct = Math.round((score / deck.length) * 100)
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #060c18 0%, #090f1e 50%, #0a1020 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          style={{ width: '100%', maxWidth: '600px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px' }}
        >
          {/* Emoji + başlık */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{ fontSize: '64px', lineHeight: 1, marginBottom: '20px' }}
            >
              {pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '💪'}
            </motion.div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              {earlyFinish ? 'Erken Tamamlandı!' : 'Quiz Tamamlandı!'}
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>
              {earlyFinish ? `${score + wrongAnswers.length}/${deck.length} soruyu yanıtladın` : `${deck.length} soruyu yanıtladın`}
            </p>

            {/* İstatistik satırı */}
            <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', padding: '0 28px' }}>
                <p style={{ fontSize: '36px', fontWeight: 800, color: '#34d399', lineHeight: 1, letterSpacing: '-0.02em' }}>{score}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', fontWeight: 500 }}>/ {deck.length} Doğru</p>
              </div>
              <div style={{ width: '1px', height: '52px', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'center', padding: '0 28px' }}>
                <p style={{ fontSize: '36px', fontWeight: 800, color: '#818cf8', lineHeight: 1, letterSpacing: '-0.02em' }}>%{pct}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', fontWeight: 500 }}>Başarı</p>
              </div>
              {maxStreak > 1 && (
                <>
                  <div style={{ width: '1px', height: '52px', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ textAlign: 'center', padding: '0 28px' }}>
                    <p style={{ fontSize: '36px', fontWeight: 800, color: '#fbbf24', lineHeight: 1, letterSpacing: '-0.02em' }}>{maxStreak}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', fontWeight: 500 }}>Max Seri</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 8px progress bar */}
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginBottom: '12px' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(score / deck.length) * 100}%` }} transition={{ delay: 0.3, duration: 0.8 }} style={{ background: '#10b981', height: '100%' }} />
            <motion.div initial={{ width: 0 }} animate={{ width: `${(wrongAnswers.length / deck.length) * 100}%` }} transition={{ delay: 0.5, duration: 0.8 }} style={{ background: '#ef4444', height: '100%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '28px' }}>
            <span style={{ color: '#34d399' }}>{score} Doğru</span>
            <span style={{ color: '#f87171' }}>{wrongAnswers.length} Yanlış</span>
          </div>

          {/* Yanlış cevaplar */}
          {wrongAnswers.length > 0 && (
            <div style={{ borderRadius: '16px', padding: '20px', marginBottom: '28px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#fca5a5', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <XCircle size={13} /> Yanlış Cevaplar ({wrongAnswers.length})
              </p>
              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {wrongAnswers.map((q) => (
                  <p key={q.id} style={{ fontSize: '13px', color: 'rgba(252,165,165,0.8)', lineHeight: 1.6, paddingLeft: '12px', borderLeft: '3px solid rgba(239,68,68,0.45)', margin: 0 }}>
                    {q.question}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Butonlar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <motion.button
              whileHover={{ filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={restart}
              style={{ height: '52px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}
            >
              <RotateCcw size={16} /> Tekrar Başla
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/sorular/${kategori}`)}
              style={{ height: '52px', borderRadius: '12px', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '14px', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} /> Kategoriye Dön
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  const correctOption = current.options?.find((o) => o.correct)
  const isAnsweredCorrect = selected === correctOption?.label

  // ── Ana ekran ──
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #060c18 0%, #090f1e 50%, #0a1020 100%)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Üst bar ── */}
      <div className="sticky top-0 z-10 glass border-b border-white/8">
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/sorular/${kategori}`)}>
              <ArrowLeft size={16} /> Çık
            </Button>
            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #8b5cf6, #6366f1)' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600 }}>
              <span style={{ color: '#34d399' }}>{score} ✓</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                {index + 1}<span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>/{deck.length}</span>
              </span>
              {streak >= 2 && <span style={{ color: '#f59e0b', fontWeight: 700 }}>{streak} 🔥</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── İçerik ── */}
      <div style={{ padding: '48px 24px', flex: 1 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <AnimatePresence mode="wait">

            <motion.div
              key={index}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Soru kartı */}
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                padding: '32px 36px',
                marginBottom: '32px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <Badge variant={current.category as 'yazilim' | 'kamu' | 'banka' | 'ik'}>{current.subcategory || current.category}</Badge>
                  <Badge variant={current.difficulty as 'kolay' | 'orta' | 'zor'}>{current.difficulty}</Badge>
                </div>
                <p style={{ fontSize: '22px', fontWeight: 700, color: 'white', lineHeight: 1.5, margin: 0 }}>
                  {current.question}
                </p>
              </div>

              {/* Şıklar */}
              <div style={{ marginBottom: '8px' }}>
                {current.options?.map((option, i) => (
                  <OptionButton
                    key={option.label}
                    label={option.label}
                    text={option.text}
                    selected={selected}
                    isCorrect={!!option.correct}
                    index={i}
                    onClick={() => handleSelect(option.label)}
                  />
                ))}
              </div>

              {/* Açıklama + Sonraki */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div style={{
                      borderRadius: '16px',
                      padding: '20px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      background: isAnsweredCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${isAnsweredCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}>
                      {isAnsweredCorrect
                        ? <CheckCircle size={18} style={{ color: '#34d399', flexShrink: 0, marginTop: '2px' }} />
                        : <XCircle size={18} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
                      }
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px', color: isAnsweredCorrect ? '#6ee7b7' : '#fca5a5' }}>
                          {isAnsweredCorrect ? 'Doğru!' : 'Yanlış!'}
                        </p>
                        <p style={{ fontSize: '14px', color: 'rgba(226,232,240,0.8)', lineHeight: 1.65 }}>{current.answer}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={goNext}
                      className="btn-gradient-bg"
                      style={{ width: '100%', padding: '16px', borderRadius: '14px', color: 'white', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
                    >
                      {index + 1 >= deck.length ? '🎉 Sonuçları Gör' : 'Sonraki Soru →'}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* Erken çıkış butonları */}
          {index > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'center' }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setConfirmAction('save')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Save size={12} /> Bitir & Kaydet
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setConfirmAction('pause')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                <PauseCircle size={12} /> Sonra Devam Et
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Onayla dialog */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '32px', maxWidth: '360px', width: '100%', textAlign: 'center' }}
          >
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
              {confirmAction === 'save' ? '💾 Bitir & Kaydet' : '⏸ Sonra Devam Et'}
            </p>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '28px', lineHeight: 1.6 }}>
              {confirmAction === 'save'
                ? `${index}/${deck.length} soru tamamlandı. İlerleme kaydedilecek ve oturum sona erecek.`
                : 'İlerleme yerel olarak kaydedilecek. Geri döndüğünde kaldığın yerden devam edebilirsin.'}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setConfirmAction(null)}
                style={{ flex: 1, height: '44px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                İptal
              </button>
              <button
                onClick={confirmAction === 'save' ? handleFinishAndSave : handlePauseLater}
                style={{ flex: 1, height: '44px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
              >
                Onayla
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Devam et dialog */}
      {resumeData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '32px', maxWidth: '360px', width: '100%', textAlign: 'center' }}
          >
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏸</div>
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Yarım Kalan Quiz</p>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '28px', lineHeight: 1.6 }}>
              {resumeData.index}/{resumeData.deckIds.length} soruyu tamamlamıştın. Kaldığın yerden devam etmek ister misin?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleNewSession}
                style={{ flex: 1, height: '44px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                Yeni Başla
              </button>
              <button
                onClick={handleResume}
                style={{ flex: 1, height: '44px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
              >
                Devam Et
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
