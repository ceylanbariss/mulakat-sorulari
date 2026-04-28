import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, MousePointer2, Save, PauseCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { type Question } from '../../data/questions'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/useAuthStore'
import { addDocument, trainingSessionsCol } from '../../lib/firestore'

interface Props {
  questions: Question[]
  kategori: string
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

type Result = 'correct' | 'partial' | 'wrong'

const RESULT_CONFIG = {
  correct: { label: '✓ Bildim', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  partial: { label: '~ Karıştırdım', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  wrong: { label: '✗ Bilmedim', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
}

const BUTTON_STYLE: Record<Result, { label: string; color: string; bg: string; hoverBg: string; border: string }> = {
  wrong: { label: '✗ Bilmedim', color: '#f87171', bg: 'rgba(239,68,68,0.08)', hoverBg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.35)' },
  partial: { label: '~ Karıştırdım', color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', hoverBg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.35)' },
  correct: { label: '✓ Bildim', color: '#34d399', bg: 'rgba(16,185,129,0.08)', hoverBg: 'rgba(16,185,129,0.22)', border: 'rgba(16,185,129,0.35)' },
}

function ResultButton({ result, onClick }: { result: Result; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const cfg = BUTTON_STYLE[result]
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        height: '52px',
        borderRadius: '12px',
        fontWeight: 600,
        fontSize: '14px',
        border: `1px solid ${cfg.border}`,
        background: hovered ? cfg.hoverBg : cfg.bg,
        color: cfg.color,
        cursor: 'pointer',
        transition: 'background 0.18s',
        letterSpacing: '0.01em',
      }}
    >
      {cfg.label}
    </motion.button>
  )
}

export function FlashCardMode({ questions, kategori }: Props) {
  const navigate = useNavigate()
  const [deck, setDeck] = useState(() => shuffle(questions))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [done, setDone] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [earlyFinish, setEarlyFinish] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'save' | 'pause' | null>(null)
  const [resumeData, setResumeData] = useState<{ deckIds: string[]; index: number; results: Result[] } | null>(null)

  useEffect(() => {
    const u = useAuthStore.getState().user
    if (!u) return
    const key = `mulakat_session_${u.uid}_${kategori}_flashcard`
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
    const idMap = new Map(questions.map(q => [q.id, q]))
    const restored = resumeData.deckIds.map(id => idMap.get(id)).filter((q): q is Question => q !== undefined)
    if (restored.length) { setDeck(restored); setIndex(resumeData.index); setResults(resumeData.results) }
    setResumeData(null)
  }

  const handleNewSession = () => {
    const u = useAuthStore.getState().user
    if (u) localStorage.removeItem(`mulakat_session_${u.uid}_${kategori}_flashcard`)
    setResumeData(null)
  }

  const handleFinishAndSave = () => {
    setConfirmAction(null)
    if (results.length === 0) return
    const u = useAuthStore.getState().user
    if (u) {
      const correctCount = results.filter(r => r === 'correct').length
      const partialCount = results.filter(r => r === 'partial').length
      const wrongCount = results.filter(r => r === 'wrong').length
      addDocument(trainingSessionsCol(), {
        userId: u.uid, mode: 'flashcard', category: kategori,
        totalQuestions: results.length, correctCount, partialCount, wrongCount,
        score: Math.round((correctCount / results.length) * 100),
      }).catch(() => {})
      localStorage.removeItem(`mulakat_session_${u.uid}_${kategori}_flashcard`)
    }
    setEarlyFinish(true)
    setDone(true)
  }

  const handlePauseLater = () => {
    setConfirmAction(null)
    const u = useAuthStore.getState().user
    if (u) {
      localStorage.setItem(
        `mulakat_session_${u.uid}_${kategori}_flashcard`,
        JSON.stringify({ deckIds: deck.map(q => q.id), index, results, savedAt: Date.now() })
      )
    }
    navigate(`/sorular/${kategori}`)
  }

  const current = deck[index]
  const progress = (index / deck.length) * 100

  const goNext = useCallback(
    (result: Result) => {
      setDirection(result === 'correct' ? 'right' : result === 'wrong' ? 'left' : null)
      const newResults = [...results, result]
      setResults(newResults)
      setTimeout(() => {
        if (index + 1 >= deck.length) {
          const user = useAuthStore.getState().user
          if (user) {
            const correctCount = newResults.filter(r => r === 'correct').length
            const partialCount = newResults.filter(r => r === 'partial').length
            const wrongCount = newResults.filter(r => r === 'wrong').length
            addDocument(trainingSessionsCol(), {
              userId: user.uid,
              mode: 'flashcard',
              category: kategori,
              totalQuestions: deck.length,
              correctCount,
              partialCount,
              wrongCount,
              score: Math.round((correctCount / deck.length) * 100),
            }).catch(() => {})
          }
          setDone(true)
        } else {
          setIndex((i) => i + 1)
          setFlipped(false)
          setDirection(null)
        }
      }, 200)
    },
    [index, deck.length, results, kategori]
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f) }
      if (flipped) {
        if (e.code === 'ArrowLeft') goNext('wrong')
        if (e.code === 'ArrowDown') goNext('partial')
        if (e.code === 'ArrowRight') goNext('correct')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [flipped, goNext])

  const restart = () => {
    setDeck(shuffle(questions))
    setIndex(0)
    setFlipped(false)
    setResults([])
    setDone(false)
    setDirection(null)
    toast.success('Yeni oturum başlatıldı!')
  }

  // ── Oturum bitti ──
  if (done) {
    const correct = results.filter((r) => r === 'correct').length
    const partial = results.filter((r) => r === 'partial').length
    const wrong = results.filter((r) => r === 'wrong').length
    const pct = Math.round((correct / deck.length) * 100)

    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #060c18 0%, #090f1e 50%, #0a1020 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          style={{ width: '100%', maxWidth: '480px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '48px 40px' }}
        >
          {/* Emoji + başlık */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{ fontSize: '64px', lineHeight: 1, marginBottom: '20px' }}
            >
              {pct >= 70 ? '🎉' : pct >= 40 ? '💪' : '📚'}
            </motion.div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              {earlyFinish ? 'Erken Tamamlandı!' : 'Oturum Tamamlandı!'}
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>
              {earlyFinish ? `${results.length}/${deck.length} soruyu tamamladın` : `${deck.length} soruyu tamamladın`}
            </p>
            <div style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '999px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <span style={{ fontSize: '32px', fontWeight: 700, background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>%{pct}</span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>başarı</span>
            </div>
          </div>

          {/* 3 stat kutusu */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
            {([
              { key: 'correct', value: correct, label: 'Bildim',      color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
              { key: 'partial', value: partial, label: 'Karıştırdım', color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
              { key: 'wrong',   value: wrong,   label: 'Bilmedim',    color: '#f87171', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)' },
            ] as const).map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                style={{ borderRadius: '12px', padding: '16px 12px', textAlign: 'center', background: item.bg, border: `1px solid ${item.border}` }}
              >
                <p style={{ fontSize: '28px', fontWeight: 800, color: item.color, lineHeight: 1, marginBottom: '6px' }}>{item.value}</p>
                <p style={{ fontSize: '11px', color: item.color, fontWeight: 600, opacity: 0.85 }}>{item.label}</p>
              </motion.div>
            ))}
          </div>

          {/* 8px progress bar */}
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginBottom: '32px' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(correct / deck.length) * 100}%` }} transition={{ delay: 0.3, duration: 0.8 }} style={{ background: '#10b981', height: '100%' }} />
            <motion.div initial={{ width: 0 }} animate={{ width: `${(partial / deck.length) * 100}%` }} transition={{ delay: 0.5, duration: 0.8 }} style={{ background: '#f59e0b', height: '100%' }} />
            <motion.div initial={{ width: 0 }} animate={{ width: `${(wrong / deck.length) * 100}%` }} transition={{ delay: 0.7, duration: 0.8 }} style={{ background: '#ef4444', height: '100%' }} />
          </div>

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
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/istatistikler')}
              style={{ height: '52px', borderRadius: '12px', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontWeight: 600, fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              📊 İstatistiklerime Git
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Ana ekran ──
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #060c18 0%, #090f1e 50%, #0a1020 100%)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Üst bar ── */}
      <div className="sticky top-0 z-10 glass border-b border-white/8">
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/sorular/${kategori}`)}>
              <ArrowLeft size={16} /> Çık
            </Button>
            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'white', minWidth: '3.5rem', textAlign: 'right' }}>
              {index + 1}<span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>/{deck.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Kart alanı ── */}
      <div style={{ paddingTop: '80px', paddingBottom: '48px', paddingLeft: '16px', paddingRight: '16px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: direction === 'right' ? 60 : direction === 'left' ? -60 : 0, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction === 'right' ? -40 : direction === 'left' ? 40 : 0, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="cursor-pointer"
                onClick={() => setFlipped((f) => !f)}
                style={{ perspective: '1200px' }}
              >
                <motion.div
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                  style={{ transformStyle: 'preserve-3d', minHeight: 'clamp(320px, 50vh, 420px)', position: 'relative' }}
                >
                  {/* ─ Ön yüz (Soru) ─ */}
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      borderRadius: '20px',
                      background: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 0 0 1px rgba(99,102,241,0.1), 0 40px 80px -20px rgba(99,102,241,0.3)',
                      padding: 'clamp(20px, 5vw, 40px)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px',
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    {/* Top accent line */}
                    <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />

                    {/* Üst: SORU badge + kategori */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '4px 14px', borderRadius: '999px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em' }}>
                        Soru
                      </span>
                      <Badge variant={current.category as 'yazilim' | 'kamu' | 'banka' | 'ik'}>{current.subcategory || current.category}</Badge>
                      <Badge variant={current.difficulty as 'kolay' | 'orta' | 'zor'}>{current.difficulty}</Badge>
                    </div>

                    {/* Soru metni */}
                    <p style={{ fontSize: '20px', fontWeight: 700, color: 'white', lineHeight: 1.7, textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {current.question}
                    </p>

                    {/* Alt: tıklama ipucu */}
                    <div className="hidden sm:flex items-center justify-center">
                      <motion.div
                        animate={{ opacity: [0.45, 1, 0.45] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 18px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(148,163,184,0.75)', fontSize: '12px', fontWeight: 600 }}
                      >
                        <MousePointer2 size={12} />
                        Tıkla veya Space'e bas
                      </motion.div>
                    </div>
                  </div>

                  {/* ─ Arka yüz (Cevap) ─ */}
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.12) 100%)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(99,102,241,0.25)',
                      boxShadow: '0 0 0 1px rgba(99,102,241,0.15), 0 40px 80px -20px rgba(99,102,241,0.4)',
                      padding: 'clamp(20px, 5vw, 40px)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }} />

                    {/* CEVAP badge */}
                    <div>
                      <span style={{ padding: '4px 14px', borderRadius: '999px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em' }}>
                        Cevap
                      </span>
                    </div>

                    {/* Cevap metni */}
                    <p style={{ fontSize: 'clamp(15px, 4vw, 20px)', color: 'rgba(226,232,240,0.9)', lineHeight: 1.65, flex: 1, overflow: 'auto' }}>
                      {current.answer}
                    </p>

                    {/* Tag'ler */}
                    {current.hints && current.hints.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flexShrink: 0 }}>
                        {current.hints.map((h) => (
                          <span
                            key={h}
                            style={{ padding: '3px 10px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(196,181,253,0.85)', fontSize: '11px', fontWeight: 500, background: 'rgba(99,102,241,0.12)', whiteSpace: 'nowrap' }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Sonuç butonları ── */}
          <AnimatePresence>
            {flipped && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', gap: '10px', marginTop: '20px' }}
              >
                {(['wrong', 'partial', 'correct'] as Result[]).map((r) => (
                  <ResultButton key={r} result={r} onClick={() => goNext(r)} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Klavye kısayolları ipucu */}
          {!flipped && (
            <div className="mt-5 hidden sm:flex items-center justify-center gap-8 text-xs text-slate-600">
              <span>← Bilmedim</span>
              <span>↓ Karıştırdım</span>
              <span>Bildim →</span>
            </div>
          )}

          {/* Sonuç noktaları */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '24px', flexWrap: 'wrap', maxWidth: '320px', margin: '24px auto 0' }}>
            {results.map((r, i) => (
              <div key={i} className={cn('w-2 h-2 rounded-full', RESULT_CONFIG[r].dot)} />
            ))}
          </div>

          {/* Erken çıkış butonları */}
          {results.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '28px', justifyContent: 'center' }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setConfirmAction('save')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s' }}
              >
                <Save size={12} /> Bitir & Kaydet
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setConfirmAction('pause')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s' }}
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
                ? `${results.length}/${deck.length} soru tamamlandı. İlerleme kaydedilecek ve oturum sona erecek.`
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
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Yarım Kalan Oturum</p>
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
