import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lightbulb, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { type Question } from '../../data/questions'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface Props {
  questions: Question[]
  kategori: string
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

type SelfScore = 'correct' | 'partial' | 'wrong'

const SELF_SCORE_STYLE: Record<SelfScore, { label: string; color: string; bg: string; hoverBg: string; border: string }> = {
  wrong:   { label: '✗ Yanlış', color: '#f87171', bg: 'rgba(239,68,68,0.08)',   hoverBg: 'rgba(239,68,68,0.2)',   border: 'rgba(239,68,68,0.35)' },
  partial: { label: '~ Kısmi',  color: '#fbbf24', bg: 'rgba(245,158,11,0.08)',  hoverBg: 'rgba(245,158,11,0.2)',  border: 'rgba(245,158,11,0.35)' },
  correct: { label: '✓ Tam',    color: '#34d399', bg: 'rgba(16,185,129,0.08)', hoverBg: 'rgba(16,185,129,0.22)', border: 'rgba(16,185,129,0.35)' },
}

function SelfScoreButton({ score, onClick }: { score: SelfScore; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const cfg = SELF_SCORE_STYLE[score]
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
      }}
    >
      {cfg.label}
    </motion.button>
  )
}

export function WrittenMode({ questions, kategori }: Props) {
  const navigate = useNavigate()
  const [deck] = useState(() => shuffle(questions))
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [results, setResults] = useState<SelfScore[]>([])
  const [done, setDone] = useState(false)
  const [focused, setFocused] = useState(false)

  const current = deck[index]
  const progress = Math.round(((index) / deck.length) * 100)

  const handleReveal = () => setShowAnswer(true)

  const handleScore = (score: SelfScore) => {
    setResults((r) => [...r, score])
    if (index + 1 >= deck.length) {
      setDone(true)
    } else {
      setIndex((i) => i + 1)
      setAnswer('')
      setShowAnswer(false)
      setShowHints(false)
    }
  }

  const restart = () => {
    setIndex(0)
    setAnswer('')
    setShowAnswer(false)
    setShowHints(false)
    setResults([])
    setDone(false)
  }

  // ── Bitti ──
  if (done) {
    const correct = results.filter((r) => r === 'correct').length
    const partial = results.filter((r) => r === 'partial').length
    const wrong   = results.filter((r) => r === 'wrong').length
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #060c18 0%, #090f1e 50%, #0a1020 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          style={{ width: '100%', maxWidth: '480px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '48px 40px' }}
        >
          {/* Emoji + başlık */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{ fontSize: '64px', lineHeight: 1, marginBottom: '20px' }}
            >
              ✍️
            </motion.div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
              Tüm Sorular Tamamlandı!
            </h1>
          </div>

          {/* 3 stat kutusu */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
            {([
              { key: 'correct', value: correct, label: 'Tam',    color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
              { key: 'partial', value: partial, label: 'Kısmi',  color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
              { key: 'wrong',   value: wrong,   label: 'Yanlış', color: '#f87171', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)' },
            ] as const).map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                style={{ borderRadius: '12px', padding: '16px 12px', textAlign: 'center', background: item.bg, border: `1px solid ${item.border}` }}
              >
                <p style={{ fontSize: '32px', fontWeight: 800, color: item.color, lineHeight: 1, marginBottom: '6px' }}>{item.value}</p>
                <p style={{ fontSize: '11px', color: item.color, fontWeight: 600, opacity: 0.85 }}>{item.label}</p>
              </motion.div>
            ))}
          </div>

          {/* 8px progress bar */}
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginBottom: '32px' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(correct / deck.length) * 100}%` }} transition={{ delay: 0.3, duration: 0.8 }} style={{ background: '#10b981', height: '100%' }} />
            <motion.div initial={{ width: 0 }} animate={{ width: `${(partial  / deck.length) * 100}%` }} transition={{ delay: 0.5, duration: 0.8 }} style={{ background: '#f59e0b', height: '100%' }} />
            <motion.div initial={{ width: 0 }} animate={{ width: `${(wrong   / deck.length) * 100}%` }} transition={{ delay: 0.7, duration: 0.8 }} style={{ background: '#ef4444', height: '100%' }} />
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
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/sorular/${kategori}`)}>
              <ArrowLeft size={16} /> Çık
            </Button>
            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #10b981, #059669)' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'white', minWidth: '3.5rem', textAlign: 'right' }}>
              {index + 1}<span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>/{deck.length}</span>
            </span>
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
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            >
              {/* Soru kartı */}
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                padding: '32px 36px',
                marginBottom: '20px',
              }}>
                {/* Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <Badge variant={current.category as 'yazilim' | 'kamu' | 'banka' | 'ik'}>{current.subcategory || current.category}</Badge>
                  <Badge variant={current.difficulty as 'kolay' | 'orta' | 'zor'}>{current.difficulty}</Badge>
                </div>

                {/* Soru */}
                <p style={{ fontSize: '22px', fontWeight: 700, color: 'white', lineHeight: 1.5, marginBottom: '20px' }}>
                  {current.question}
                </p>

                {/* İpucu butonu — soru altında sola hizalı */}
                {current.hints && current.hints.length > 0 && !showHints && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowHints(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', border: '1px solid rgba(255,193,7,0.4)', background: 'rgba(255,193,7,0.1)', color: '#fbbf24', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Lightbulb size={13} /> İpucu
                  </motion.button>
                )}

                {/* Hints gösterilince */}
                {showHints && current.hints && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}
                  >
                    {current.hints.map((h) => (
                      <span key={h} style={{ padding: '4px 12px', borderRadius: '999px', border: '1px solid rgba(255,193,7,0.3)', background: 'rgba(255,193,7,0.1)', color: '#fbbf24', fontSize: '12px', fontWeight: 500 }}>
                        {h}
                      </span>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Textarea */}
              <div style={{ marginBottom: '16px' }}>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  disabled={showAnswer}
                  placeholder="Cevabınızı buraya yazın..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: `1px solid ${focused ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.12)'}`,
                    background: showAnswer ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: focused ? '0 0 0 3px rgba(139,92,246,0.15)' : 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.65,
                    minHeight: '180px',
                    opacity: showAnswer ? 0.55 : 1,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Cevabımı Gör butonu */}
              {!showAnswer && (
                <motion.button
                  whileHover={{ filter: 'brightness(1.1)', boxShadow: '0 16px 40px rgba(16,185,129,0.45)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReveal}
                  style={{
                    width: '100%',
                    height: '52px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  Cevabımı Gör
                </motion.button>
              )}

              {/* Model Cevap + Değerlendirme */}
              <AnimatePresence>
                {showAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Model cevap */}
                    <div style={{
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.25)',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      marginBottom: '20px',
                    }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                        Model Cevap
                      </p>
                      <p style={{ fontSize: '15px', color: 'rgba(226,232,240,0.88)', lineHeight: 1.7 }}>
                        {current.answer}
                      </p>
                    </div>

                    {/* Değerlendirme */}
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: '12px', textAlign: 'center' }}>
                      Cevabınızı değerlendirin:
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {(['wrong', 'partial', 'correct'] as SelfScore[]).map((s) => (
                        <SelfScoreButton key={s} score={s} onClick={() => handleScore(s)} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
