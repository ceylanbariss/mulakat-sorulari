import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronRight, CreditCard, ListChecks, PenLine, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Badge } from '../components/ui/Badge'
import { useCategories } from '../hooks/useCategories'
import { useQuestions } from '../hooks/useQuestions'
import { useAppStore } from '../store/useAppStore'
import { getAll, subcategoriesCol, where } from '../lib/firestore'

const MODES = [
  {
    id: 'flashcard',
    label: 'Flash Card',
    description: 'Soruyu gör, cevabı aç',
    icon: CreditCard,
    gradientLight: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    gradientDark: 'linear-gradient(135deg, rgba(251,146,60,0.12) 0%, rgba(234,88,12,0.08) 100%)',
    borderLight: 'rgba(251,146,60,0.3)',
    borderDark: 'rgba(251,146,60,0.2)',
    iconBg: 'rgba(251,146,60,0.15)',
    iconColor: '#ea580c',
    glow: 'rgba(251,146,60,0.28)',
    badge: 'Hızlı Tekrar',
  },
  {
    id: 'quiz',
    label: 'Quiz Modu',
    description: 'Şıklı test (4 seçenek)',
    icon: ListChecks,
    gradientLight: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
    gradientDark: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
    borderLight: 'rgba(99,102,241,0.3)',
    borderDark: 'rgba(139,92,246,0.2)',
    iconBg: 'rgba(99,102,241,0.15)',
    iconColor: '#6366f1',
    glow: 'rgba(99,102,241,0.28)',
    badge: 'Çoktan Seçmeli',
  },
  {
    id: 'written',
    label: 'Yazılı Cevap',
    description: 'Kendin yaz, karşılaştır',
    icon: PenLine,
    gradientLight: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
    gradientDark: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.08) 100%)',
    borderLight: 'rgba(16,185,129,0.3)',
    borderDark: 'rgba(16,185,129,0.2)',
    iconBg: 'rgba(16,185,129,0.15)',
    iconColor: '#059669',
    glow: 'rgba(16,185,129,0.28)',
    badge: 'Derinlemesine',
  },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
}

export function CategoryDetail() {
  const { kategori } = useParams<{ kategori: string }>()
  const navigate = useNavigate()
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  const [selectedSubs, setSelectedSubs] = useState<string[]>([])
  const [subcats, setSubcats] = useState<Array<{ _id: string; name: string; slug: string }>>([])

  useEffect(() => {
    if (!kategori) return
    setSelectedSubs([])
    getAll<{ name: string; slug: string; orderIndex?: number }>(subcategoriesCol(), where('categoryId', '==', kategori))
      .then(docs => {
        const sorted = [...docs].sort((a, b) => ((a as any).orderIndex ?? 0) - ((b as any).orderIndex ?? 0))
        setSubcats(sorted as any)
      })
  }, [kategori])

  function toggleSub(slug: string) {
    setSelectedSubs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  const { categories, loading: catsLoading } = useCategories()
  const { questions, loading: qsLoading } = useQuestions(kategori, selectedSubs.length > 0 ? selectedSubs : undefined)

  if (catsLoading || qsLoading) return null // Veya loading spinner

  const category = categories.find((c) => c.id === kategori)

  if (!category) {
    return (
      <PageWrapper className="py-10">
        <p className="text-slate-500 dark:text-slate-400">Kategori bulunamadı.</p>
      </PageWrapper>
    )
  }

  return (
    <div className="min-h-screen pb-16" style={{ paddingTop: '120px' }}>
      <PageWrapper>
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-6 flex-wrap"
        >
          <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight size={14} />
          <Link to="/sorular" className="hover:text-slate-900 dark:hover:text-white transition-colors">Sorular</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 dark:text-white font-medium">{category.label}</span>
        </motion.nav>

        {/* Başlık */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 sm:gap-5 mb-6"
        >
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-sm flex-shrink-0"
            style={{ backgroundColor: category.bgColor }}
          >
            {category.emoji}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{category.label}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{questions.length} soru</p>
          </div>
        </motion.div>

        {/* Alt Dal Filtresi */}
        {subcats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Alt Dal</p>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginTop: 12 }}>
              {/* "Tümü" chip */}
              <button
                onClick={() => setSelectedSubs([])}
                style={{
                  flexShrink: 0, padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  border: selectedSubs.length === 0 ? `1px solid ${category?.color ?? '#3b82f6'}60` : d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                  background: selectedSubs.length === 0 ? `${category?.color ?? '#3b82f6'}18` : d ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
                  color: selectedSubs.length === 0 ? category?.color ?? '#3b82f6' : d ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,0.8)',
                }}
              >
                Tümü
              </button>
              {subcats.map(sub => {
                const active = selectedSubs.includes(sub.slug)
                return (
                  <button
                    key={sub.slug}
                    onClick={() => toggleSub(sub.slug)}
                    style={{
                      flexShrink: 0, padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      border: active ? `1px solid ${category?.color ?? '#3b82f6'}60` : d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                      background: active ? `${category?.color ?? '#3b82f6'}18` : d ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
                      color: active ? category?.color ?? '#3b82f6' : d ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,0.8)',
                      outline: active ? `2px solid ${category?.color ?? '#3b82f6'}30` : 'none',
                      outlineOffset: 1,
                    }}
                  >
                    {sub.name}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Mod Seçimi */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 mt-4">Antrenman Modunu Seç</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {MODES.map((mode, i) => {
              const Icon = mode.icon
              return (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  onClick={() => navigate(`/antrenman/${mode.id}?kategori=${kategori}${selectedSubs.length > 0 ? `&altdal=${selectedSubs.join(',')}` : ''}`)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '20px',
                    padding: '24px',
                    background: d ? mode.gradientDark : mode.gradientLight,
                    border: `1px solid ${d ? mode.borderDark : mode.borderLight}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 40px -8px ${mode.glow}` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
                >
                  {/* Top glow line */}
                  <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: `linear-gradient(90deg, transparent, ${mode.iconColor}70, transparent)` }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: mode.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={22} style={{ color: mode.iconColor }} strokeWidth={1.75} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: mode.iconColor, background: mode.iconBg, padding: '4px 10px', borderRadius: '999px', letterSpacing: '0.03em' }}>
                      {mode.badge}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: '16px', color: d ? 'rgba(226,232,240,0.95)' : '#0f172a', marginBottom: '6px' }}>{mode.label}</h3>
                    <p style={{ fontSize: '13px', color: d ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.75)', lineHeight: 1.6 }}>{mode.description}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: mode.iconColor }}>
                    Başla <ArrowRight size={13} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Soru Listesi Önizlemesi */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 mt-4">Soru Önizlemesi</h2>
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4">
            {questions.slice(0, 5).map((q, i) => (
              <motion.div
                key={q.id}
                variants={fadeUp}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                style={{
                  background: d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
                  border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                  borderRadius: '20px',
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: d ? 'none' : '0 2px 16px rgba(0,0,0,0.05)',
                }}
              >
                <span style={{ fontSize: '20px', fontWeight: 900, color: d ? 'rgba(100,116,139,0.35)' : 'rgba(203,213,225,1)', minWidth: '2rem', userSelect: 'none', lineHeight: 1.5 }} className="hidden sm:block">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: d ? 'rgba(226,232,240,0.9)' : '#0f172a', lineHeight: 1.65, marginBottom: '12px' }}>{q.question}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Badge variant={q.difficulty as 'kolay' | 'orta' | 'zor'}>
                      {q.difficulty === 'kolay' ? 'Kolay' : q.difficulty === 'orta' ? 'Orta' : 'Zor'}
                    </Badge>
                    {q.subcategory && <Badge>{q.subcategory}</Badge>}
                  </div>
                </div>
              </motion.div>
            ))}
            {questions.length > 5 && (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
                +{questions.length - 5} soru daha — antrenman modunu seçerek tümünü çöz
              </div>
            )}
          </motion.div>
        </motion.div>
      </PageWrapper>
    </div>
  )
}
