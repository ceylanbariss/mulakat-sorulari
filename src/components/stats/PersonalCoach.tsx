import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, CreditCard, ListChecks, PenLine, ChevronDown, ChevronUp, X, ArrowRight } from 'lucide-react'
import type { TrainingStats, TrainingSession, CategoryStat } from '../../hooks/useTrainingStats'
import { useAuthStore } from '../../store/useAuthStore'
import { useWrongAnswers, type WrongAnswerRecord } from '../../hooks/useWrongAnswers'

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_CATEGORIES = ['yazilim', 'kamu', 'banka', 'ik']

const CATEGORY_LABELS: Record<string, string> = {
  yazilim: 'Yazılım', kamu: 'Kamu', banka: 'Banka', ik: 'İnsan Kaynakları',
}
const MODE_LABELS: Record<string, string> = {
  flashcard: 'Flash Card', quiz: 'Quiz Modu', written: 'Yazılı Cevap',
}
const MODE_ICONS: Record<string, React.ElementType> = {
  flashcard: CreditCard, quiz: ListChecks, written: PenLine,
}
const MODE_COLORS: Record<string, string> = {
  flashcard: '#f97316', quiz: '#6366f1', written: '#10b981',
}
const DIFFICULTY_COLORS: Record<string, string> = {
  kolay: '#34D399', orta: '#F59E0B', zor: '#EF4444',
}
const DIFFICULTY_LABELS: Record<string, string> = {
  kolay: 'Kolay', orta: 'Orta', zor: 'Zor',
}

// ── Algorithm Types ───────────────────────────────────────────────────────────

interface WeakTopic {
  category: string
  score: number | null
  priority: 'Kritik' | 'Geliştirilmeli' | 'İyi' | 'Henüz başlanmadı'
  color: string
  text: string
}

interface CategoryWrong {
  category: string
  totalWrong: number
  wrongRate: number
  level: 'kritik' | 'gelistir' | 'dikkat'
  color: string
  badgeText: string
  text: string
}

interface ModeSuggestion {
  text: string
  mode?: string
}

interface Pattern {
  text: string
  type: 'warning' | 'error' | 'info'
}

interface Goals {
  daily: string
  weekly: string
  motivation: string
}

// ── Algorithms ────────────────────────────────────────────────────────────────

function analyzeWeakTopics(categoryStats: CategoryStat[]): WeakTopic[] {
  const studied = new Set(categoryStats.map(c => c.category))
  const results: WeakTopic[] = []

  for (const cat of categoryStats) {
    if (cat.score < 60) {
      results.push({
        category: cat.category, score: cat.score, priority: 'Kritik', color: '#ef4444',
        text: `${CATEGORY_LABELS[cat.category] ?? cat.category} alanında ciddi eksikler var. Temel kavramları tekrar gözden geçir.`,
      })
    } else if (cat.score < 80) {
      results.push({
        category: cat.category, score: cat.score, priority: 'Geliştirilmeli', color: '#f97316',
        text: `${CATEGORY_LABELS[cat.category] ?? cat.category} alanında gelişime açık noktalar mevcut. Pratik yapmaya devam et.`,
      })
    } else {
      results.push({ category: cat.category, score: cat.score, priority: 'İyi', color: '#10b981', text: '' })
    }
  }

  for (const cat of ALL_CATEGORIES) {
    if (!studied.has(cat)) {
      results.push({ category: cat, score: null, priority: 'Henüz başlanmadı', color: '#64748b', text: '' })
    }
  }

  return results
}

function computeCategoryWrongs(sessions: TrainingSession[]): CategoryWrong[] {
  const catMap: Record<string, { totalWrong: number; totalQ: number }> = {}
  for (const s of sessions) {
    if (!catMap[s.category]) catMap[s.category] = { totalWrong: 0, totalQ: 0 }
    catMap[s.category].totalWrong += s.wrongCount
    catMap[s.category].totalQ += s.totalQuestions
  }

  return Object.entries(catMap)
    .filter(([, v]) => v.totalWrong > 0)
    .map(([cat, v]) => {
      const wrongRate = v.totalQ > 0 ? Math.round((v.totalWrong / v.totalQ) * 100) : 0
      const level: CategoryWrong['level'] =
        v.totalWrong >= 10 || wrongRate >= 40 ? 'kritik' :
        v.totalWrong >= 5 || wrongRate >= 25 ? 'gelistir' : 'dikkat'
      const color = level === 'kritik' ? '#ef4444' : level === 'gelistir' ? '#f97316' : '#f59e0b'
      const badgeText = level === 'kritik' ? 'Kritik' : level === 'gelistir' ? 'Gözden Geçir' : 'Dikkat Et'
      const catName = CATEGORY_LABELS[cat] ?? cat
      const text =
        level === 'kritik' ? `${catName} kategorisinde çok sayıda tekrarlayan hata var. Bu konuyu sıfırdan ele al.` :
        level === 'gelistir' ? `${catName} kategorisinde eksikler mevcut. İlgili soruları tekrar çalış.` :
        `${catName} kategorisinde küçük hatalar var. Gözden geçir.`
      return { category: cat, totalWrong: v.totalWrong, wrongRate, level, color, badgeText, text }
    })
    .sort((a, b) => b.totalWrong - a.totalWrong)
}

function analyzeModes(modeStats: Record<string, number>, categoryStats: CategoryStat[]): ModeSuggestion[] {
  const suggestions: ModeSuggestion[] = []
  const usedModes = new Set(Object.keys(modeStats))

  if (usedModes.size === 1 && usedModes.has('flashcard'))
    suggestions.push({ text: 'Quiz Modu dene: çoktan seçmeli sorular sınav refleksini geliştirir.', mode: 'quiz' })

  const weakCats = categoryStats.filter(c => c.score < 70)
  if (weakCats.length > 0)
    suggestions.push({
      text: `Flash Card ile tekrar: ${CATEGORY_LABELS[weakCats[0].category] ?? weakCats[0].category} gibi zayıf konularda temel kavramları pekiştir.`,
      mode: 'flashcard',
    })

  const strongCats = categoryStats.filter(c => c.score >= 80)
  if (strongCats.length > 0)
    suggestions.push({
      text: `Yazılı Cevap moduna geç: ${CATEGORY_LABELS[strongCats[0].category] ?? strongCats[0].category} konusunda derinlemesine kavrama için ideal.`,
      mode: 'written',
    })

  if (usedModes.size === 1) {
    const notUsed = ['flashcard', 'quiz', 'written'].filter(m => !usedModes.has(m))
    if (notUsed[0])
      suggestions.push({
        text: `${MODE_LABELS[notUsed[0]]} modunu henüz denemediksin — farklı yöntemler gelişimini hızlandırır.`,
        mode: notUsed[0],
      })
  }

  if (suggestions.length === 0)
    suggestions.push({ text: 'Tüm modları dengeli kullanıyorsun. Bu şekilde devam et!' })

  return suggestions
}

function analyzePatterns(sessions: TrainingSession[], categoryStats: CategoryStat[]): Pattern[] {
  const patterns: Pattern[] = []
  const dayMs = 24 * 60 * 60 * 1000
  const seen = new Set<string>()

  for (const cat of categoryStats) {
    if (cat.totalSessions < 2) continue
    const catSessions = [...sessions.filter(s => s.category === cat.category)].sort(
      (a, b) => ((a as any).createdAt?.toMillis?.() ?? 0) - ((b as any).createdAt?.toMillis?.() ?? 0),
    )
    if (catSessions.length >= 2) {
      const last = catSessions[catSessions.length - 1].score
      const prev = catSessions[catSessions.length - 2].score
      const label = CATEGORY_LABELS[cat.category] ?? cat.category
      if (last < prev - 2) {
        patterns.push({ text: `${label} kategorisinde skor düşüyor — konuyu farklı bir kaynaktan tekrar çalış.`, type: 'error' })
      } else if (Math.abs(last - prev) < 5 && catSessions.length >= 3) {
        patterns.push({ text: `${label} kategorisinde ilerleme durağan — ezber yerine kavramaya odaklan.`, type: 'warning' })
      }
    }
  }

  const now = Date.now()
  for (let i = 0; i < 7; i++) {
    const dayStart = now - (i + 1) * dayMs
    const dayEnd = now - i * dayMs
    const count = sessions.filter(s => {
      const t = (s as any).createdAt?.toMillis?.() ?? 0
      return t >= dayStart && t < dayEnd
    }).length
    if (count >= 3 && !seen.has('overload')) {
      seen.add('overload')
      patterns.push({ text: 'Aralıklı tekrar daha etkili — günde 1-2 antrenman yeterli, yoğun çalışmayı dengele.', type: 'warning' })
      break
    }
  }

  if (sessions.length >= 2) {
    const latestTime = (sessions[0] as any).createdAt?.toMillis?.() ?? 0
    const prevTime = (sessions[1] as any).createdAt?.toMillis?.() ?? 0
    if ((latestTime - prevTime) / dayMs > 7)
      patterns.push({ text: 'Uzun aradan sonra başarı düşer — kısa günlük seanslar daha verimli.', type: 'info' })
  }

  return patterns
}

function generateGoals(totalSessions: number, avgScore: number): Goals {
  const daily = totalSessions < 5 ? '10 soru çöz' : totalSessions <= 15 ? '15 soru çöz' : '20 soru çöz'
  const weekly = totalSessions < 5 ? '3 farklı kategoride antrenman yap' : totalSessions <= 15 ? 'Zayıf kategorine 2 antrenman ayır' : 'Tüm kategorilerde en az 1 antrenman'
  const motivation =
    avgScore >= 90 ? 'Mükemmel performans! Yeni kategoriler keşfetme zamanı.' :
    avgScore >= 70 ? 'Harika gidiyorsun! Şimdi derinlemesine çalışma zamanı.' :
    'Süreklilik başarının anahtarı, her gün küçük adımlar at.'
  return { daily, weekly, motivation }
}

function getFilteredWrongs(data: WrongAnswerRecord[], filter: 'all' | 'mostWrong' | 'byCategory') {
  if (filter === 'mostWrong') return [...data].sort((a, b) => b.wrongCount - a.wrongCount)
  if (filter === 'byCategory') return [...data].sort((a, b) => (a.category ?? '').localeCompare(b.category ?? ''))
  return data
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WrongQuestionRow({
  wr, d, textPrimary, textSecondary, onClick,
}: {
  wr: WrongAnswerRecord; d: boolean; textPrimary: string; textSecondary: string; onClick: () => void
}) {
  const diffColor = DIFFICULTY_COLORS[wr.difficulty] ?? '#94a3b8'
  const diffLabel = DIFFICULTY_LABELS[wr.difficulty] ?? wr.difficulty
  const catLabel = CATEGORY_LABELS[wr.category] ?? wr.category

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
        background: 'transparent', transition: 'background 0.15s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
    >
      {/* Left: difficulty badge + question */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <span style={{
          fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: 999,
          background: diffColor + '20', color: diffColor, flexShrink: 0, marginTop: '2px',
        }}>
          {diffLabel}
        </span>
        <p style={{
          fontSize: '13px', fontWeight: 500, color: textPrimary, lineHeight: 1.5, margin: 0,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {wr.questionText}
        </p>
      </div>

      {/* Right: category chip + wrong count */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
        <span style={{
          fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: 999,
          background: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: textSecondary,
        }}>
          {catLabel}
        </span>
        <span style={{
          fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: 999,
          background: 'rgba(239,68,68,0.15)', color: '#ef4444',
        }}>
          {wr.wrongCount}x yanlış
        </span>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  stats: TrainingStats
  d: boolean
}

export function PersonalCoach({ stats, d }: Props) {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { data: wrongAnswers, loading: wrongLoading } = useWrongAnswers(user?.uid)

  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [wrongQsOpen, setWrongQsOpen] = useState(false)
  const [wrongFilter, setWrongFilter] = useState<'all' | 'mostWrong' | 'byCategory'>('all')
  const [selectedWrong, setSelectedWrong] = useState<WrongAnswerRecord | null>(null)

  const cardBg = d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)'
  const cardBorder = d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'
  const textPrimary = d ? 'rgba(226,232,240,0.9)' : '#0f172a'
  const textSecondary = d ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.8)'
  const divider = d ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)'

  const insufficient = stats.totalSessions < 2

  function handleAnalyze() {
    if (state !== 'idle' || insufficient) return
    setState('loading')
    setTimeout(() => setState('done'), 300)
  }

  // Pre-compute analysis
  const weakTopics = analyzeWeakTopics(stats.categoryStats)
  const categoryWrongs = computeCategoryWrongs(stats.sessions)
  const modeSuggestions = analyzeModes(stats.modeStats, stats.categoryStats)
  const patterns = analyzePatterns(stats.sessions, stats.categoryStats)
  const goals = generateGoals(stats.totalSessions, stats.avgScore)
  const filteredWrongs = getFilteredWrongs(wrongAnswers, wrongFilter)

  const subLabel = (color: string) => ({
    fontSize: '11px' as const,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color,
    marginBottom: '14px',
  })

  const innerCard = (accentColor: string) => ({
    borderRadius: '16px',
    padding: '20px',
    background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
    borderTop: `1px solid ${accentColor}25`,
    borderRight: `1px solid ${accentColor}25`,
    borderBottom: `1px solid ${accentColor}25`,
    borderLeft: `3px solid ${accentColor}`,
  })

  const filterChipStyle = (active: boolean) => ({
    flexShrink: 0 as const,
    padding: '5px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    cursor: 'pointer' as const,
    border: 'none' as const,
    transition: 'all 0.15s',
    background: active ? (d ? 'rgba(255,255,255,0.14)' : '#ffffff') : 'transparent',
    color: active ? (d ? 'rgba(226,232,240,0.9)' : '#0f172a') : textSecondary,
    boxShadow: active ? (d ? '0 1px 6px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.1)') : 'none',
  })

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{ marginTop: '32px', background: cardBg, border: cardBorder, borderRadius: '20px', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: textPrimary, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Zap size={20} style={{ color: '#f59e0b' }} />
            Kişisel Koç
          </h2>
          {state !== 'done' && (
            <button
              onClick={handleAnalyze}
              disabled={state === 'loading' || insufficient}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '12px',
                background: insufficient ? (d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: insufficient ? textSecondary : 'white',
                fontSize: '14px', fontWeight: 700,
                border: 'none', cursor: insufficient ? 'not-allowed' : 'pointer',
                opacity: state === 'loading' ? 0.7 : 1, transition: 'opacity 0.2s',
              }}
            >
              {state === 'loading' ? (
                <>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                  Hesaplıyor…
                </>
              ) : 'Analiz Et'}
            </button>
          )}
        </div>

        {/* ── Insufficient data ── */}
        {insufficient && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px', lineHeight: 1 }}>🤖</div>
            <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.7, margin: 0 }}>
              En az 2 antrenman tamamladıktan sonra analiz yapılabilir.
            </p>
          </div>
        )}

        {/* ── Idle state ── */}
        {!insufficient && state === 'idle' && (
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px', lineHeight: 1 }}>🤖</div>
            <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.75, margin: 0 }}>
              Antrenman verilerini analiz ederek sana özel öneriler, hedefler ve hata pattern'leri çıkartıyorum.
              <br />
              <span style={{ fontWeight: 600, color: d ? 'rgba(148,163,184,0.9)' : '#475569' }}>
                Başlamak için "Analiz Et" butonuna tıkla.
              </span>
            </p>
          </div>
        )}

        {/* ── Results ── */}
        <AnimatePresence>
          {state === 'done' && !insufficient && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

              {/* 2x2 Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '16px' }}>

                {/* Card 1 — Zayıf Konular */}
                <div style={innerCard('#ef4444')}>
                  <p style={subLabel('#ef4444')}>Zayıf Konular</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {weakTopics.map(topic => (
                      <div key={topic.category}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: topic.text ? '4px' : 0 }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: topic.color + '20', color: topic.color, flexShrink: 0 }}>
                            {topic.priority}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, flex: 1 }}>
                            {CATEGORY_LABELS[topic.category] ?? topic.category}
                          </span>
                          {topic.score !== null && (
                            <span style={{ fontSize: '12px', fontWeight: 700, color: topic.color, flexShrink: 0 }}>%{topic.score}</span>
                          )}
                        </div>
                        {topic.text && (
                          <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.55, margin: 0 }}>{topic.text}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* EK 1: Kategori Bazlı Yanlış Dağılımı */}
                  {categoryWrongs.length > 0 && (
                    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: divider }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: d ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.7)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        📌 Kategori Bazlı Yanlış Dağılımı
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {categoryWrongs.map(cw => (
                          <div key={cw.category}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: cw.color + '20', color: cw.color, flexShrink: 0 }}>
                                {cw.badgeText}
                              </span>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, flex: 1 }}>
                                {CATEGORY_LABELS[cw.category] ?? cw.category}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: cw.color, flexShrink: 0 }}>
                                {cw.totalWrong} yanlış · %{cw.wrongRate}
                              </span>
                            </div>
                            <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.55, margin: 0 }}>{cw.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card 2 — Mod Önerileri */}
                <div style={innerCard('#6366f1')}>
                  <p style={subLabel('#6366f1')}>Mod Önerileri</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {modeSuggestions.map((s, i) => {
                      const ModeIcon = s.mode ? MODE_ICONS[s.mode] : null
                      const modeColor = s.mode ? (MODE_COLORS[s.mode] ?? '#6366f1') : '#6366f1'
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          {ModeIcon ? (
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, background: modeColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ModeIcon size={14} style={{ color: modeColor }} />
                            </div>
                          ) : (
                            <span style={{ fontSize: '16px', lineHeight: '28px', flexShrink: 0 }}>✓</span>
                          )}
                          <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.55, margin: '4px 0 0 0' }}>{s.text}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Card 3 — Hata Analizi */}
                <div style={innerCard('#f59e0b')}>
                  <p style={subLabel('#f59e0b')}>Hata Analizi</p>
                  {patterns.length === 0 ? (
                    <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.65, margin: 0 }}>
                      Henüz yeterli veri yok, antrenmanlarına devam et.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {patterns.map((p, i) => {
                        const c = p.type === 'error' ? '#ef4444' : p.type === 'warning' ? '#f59e0b' : '#3b82f6'
                        const sym = p.type === 'error' ? '↓' : p.type === 'warning' ? '!' : 'i'
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, background: c + '20', color: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, marginTop: '1px' }}>
                              {sym}
                            </span>
                            <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.55, margin: 0 }}>{p.text}</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Card 4 — Hedefler */}
                <div style={innerCard('#10b981')}>
                  <p style={subLabel('#10b981')}>Hedefler</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: textSecondary, margin: '0 0 4px 0' }}>Günlük Hedef</p>
                      <p style={{ fontSize: '22px', fontWeight: 900, color: textPrimary, letterSpacing: '-0.02em', margin: 0 }}>{goals.daily}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: textSecondary, margin: '0 0 4px 0' }}>Haftalık Hedef</p>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, margin: 0 }}>{goals.weekly}</p>
                    </div>
                    <p style={{ fontSize: '13px', fontStyle: 'italic', color: textSecondary, lineHeight: 1.65, borderTop: divider, paddingTop: '12px', margin: 0 }}>
                      "{goals.motivation}"
                    </p>
                  </div>
                </div>
              </div>

              {/* ── EK 2: Yanlış Sorularım Accordion ── */}
              <div style={{ marginTop: '20px', borderTop: divider, paddingTop: '16px' }}>
                {/* Accordion Header */}
                <button
                  onClick={() => setWrongQsOpen(v => !v)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
                    background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')}
                >
                  <span style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ❌ Yanlış Yaptığım Sorular
                    {!wrongLoading && (
                      <span style={{ fontSize: '12px', fontWeight: 600, color: textSecondary }}>
                        ({wrongAnswers.length} soru)
                      </span>
                    )}
                  </span>
                  {wrongQsOpen
                    ? <ChevronUp size={16} style={{ color: textSecondary, flexShrink: 0 }} />
                    : <ChevronDown size={16} style={{ color: textSecondary, flexShrink: 0 }} />}
                </button>

                {/* Accordion Body */}
                <AnimatePresence>
                  {wrongQsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ paddingTop: '16px' }}>
                        {/* Filter chips */}
                        <div style={{
                          display: 'flex', gap: '4px', marginBottom: '12px',
                          padding: '4px', borderRadius: 999,
                          background: d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          width: 'fit-content',
                        }}>
                          {(['all', 'mostWrong', 'byCategory'] as const).map(f => (
                            <button key={f} onClick={() => setWrongFilter(f)} style={filterChipStyle(wrongFilter === f)}>
                              {f === 'all' ? 'Tümü' : f === 'mostWrong' ? 'En Çok Yanlış' : 'Kategoriye Göre'}
                            </button>
                          ))}
                        </div>

                        {/* Content */}
                        {wrongLoading ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
                          </div>
                        ) : filteredWrongs.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                            <div style={{ fontSize: '36px', marginBottom: '10px', lineHeight: 1 }}>🎉</div>
                            <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.65, margin: 0 }}>
                              Henüz yanlış soru kaydın yok. Antrenmanlarına devam et!
                            </p>
                          </div>
                        ) : wrongFilter === 'byCategory' ? (
                          /* Grouped by category */
                          Object.entries(
                            filteredWrongs.reduce((acc, wr) => {
                              const key = wr.category ?? 'diger'
                              if (!acc[key]) acc[key] = []
                              acc[key].push(wr)
                              return acc
                            }, {} as Record<string, WrongAnswerRecord[]>)
                          ).map(([cat, items]) => (
                            <div key={cat} style={{ marginBottom: '12px' }}>
                              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: textSecondary, margin: '0 0 6px 12px' }}>
                                {CATEGORY_LABELS[cat] ?? cat} ({items.length})
                              </p>
                              {items.map(wr => (
                                <WrongQuestionRow key={wr._id} wr={wr} d={d} textPrimary={textPrimary} textSecondary={textSecondary} onClick={() => setSelectedWrong(wr)} />
                              ))}
                            </div>
                          ))
                        ) : (
                          /* Flat list */
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {filteredWrongs.map(wr => (
                              <WrongQuestionRow key={wr._id} wr={wr} d={d} textPrimary={textPrimary} textSecondary={textSecondary} onClick={() => setSelectedWrong(wr)} />
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Wrong Question Detail Modal ── */}
      <AnimatePresence>
        {selectedWrong && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '24px',
            }}
            onClick={() => setSelectedWrong(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                background: d ? '#1e293b' : '#ffffff',
                borderRadius: '20px',
                padding: '28px',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
                border: d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
              }}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: (DIFFICULTY_COLORS[selectedWrong.difficulty] ?? '#94a3b8') + '20', color: DIFFICULTY_COLORS[selectedWrong.difficulty] ?? '#94a3b8' }}>
                    {DIFFICULTY_LABELS[selectedWrong.difficulty] ?? selectedWrong.difficulty}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: textSecondary }}>
                    {CATEGORY_LABELS[selectedWrong.category] ?? selectedWrong.category}
                  </span>
                  {selectedWrong.subcategory && (
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: textSecondary }}>
                      {selectedWrong.subcategory}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedWrong(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, padding: '4px', borderRadius: '8px', flexShrink: 0 }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Question text */}
              <p style={{ fontSize: '16px', fontWeight: 700, color: d ? 'rgba(226,232,240,0.95)' : '#0f172a', lineHeight: 1.65, marginBottom: '20px' }}>
                {selectedWrong.questionText}
              </p>

              {/* Correct answer */}
              {selectedWrong.correctAnswer && (
                <div style={{ borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10b981', marginBottom: '6px' }}>
                    Doğru Cevap
                  </p>
                  <p style={{ fontSize: '14px', color: d ? 'rgba(226,232,240,0.9)' : '#0f172a', lineHeight: 1.6, margin: 0 }}>
                    {selectedWrong.correctAnswer}
                  </p>
                </div>
              )}

              {/* Wrong count + actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: textSecondary }}>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>{selectedWrong.wrongCount}x</span> yanlış yapıldı
                </span>
                <button
                  onClick={() => { setSelectedWrong(null); navigate(`/sorular/${selectedWrong.category}`) }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '10px 18px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white', fontSize: '13px', fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  Bu konuyu çalış <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
