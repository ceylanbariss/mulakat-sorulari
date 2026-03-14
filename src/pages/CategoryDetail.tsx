import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronRight, CreditCard, ListChecks, PenLine, ArrowRight, FileText, Layers } from 'lucide-react'
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
    leftBorder: '#F97316',
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
    leftBorder: '#818CF8',
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
    leftBorder: '#34D399',
  },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
}

function difficultyBorderColor(difficulty: string): string {
  if (difficulty === 'kolay') return '#34D399'
  if (difficulty === 'orta') return '#F59E0B'
  return '#EF4444'
}

export function CategoryDetail() {
  const { kategori } = useParams<{ kategori: string }>()
  const navigate = useNavigate()
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  const [subcats, setSubcats] = useState<Array<{ _id: string; name: string; slug: string; parentId?: string }>>([])
  // selectedPath: her seviyede seçilen node (en derin seçim filtreyi belirler)
  const [selectedPath, setSelectedPath] = useState<Array<{ _id: string; slug: string; name: string }>>([])

  useEffect(() => {
    if (!kategori) return
    setSelectedPath([])
    getAll<{ name: string; slug: string; orderIndex?: number; parentId?: string }>(subcategoriesCol(), where('categoryId', '==', kategori))
      .then(docs => {
        const sorted = [...docs].sort((a, b) => ((a as any).orderIndex ?? 0) - ((b as any).orderIndex ?? 0))
        setSubcats(sorted as any)
      })
  }, [kategori])

  // Top-level alanlar
  const topLevel = subcats.filter(s => !s.parentId || s.parentId === '')
  const isHierarchical = topLevel.length > 0

  // Verilen parentId'nin doğrudan çocukları
  const getChildren = (parentId: string) => subcats.filter(s => s.parentId === parentId)

  // Bir node'un tüm torun slug'ları (recursive)
  function getAllDescendantSlugs(nodeId: string): string[] {
    const children = subcats.filter(s => s.parentId === nodeId)
    if (!children.length) return []
    return children.flatMap(c => [c.slug, ...getAllDescendantSlugs(c._id)])
  }

  // Seçili en derin node + tüm torunları → question filter slugs
  function getFilterSlugs(): string[] | undefined {
    if (!selectedPath.length) return undefined
    const deepest = selectedPath[selectedPath.length - 1]
    const descendants = getAllDescendantSlugs(deepest._id)
    return descendants.length > 0 ? descendants : [deepest.slug]
  }

  // Seviye seçim handler
  function handleSelect(level: number, node: { _id: string; slug: string; name: string } | null) {
    if (!node) setSelectedPath(prev => prev.slice(0, level))
    else setSelectedPath(prev => [...prev.slice(0, level), node])
  }

  function toggleSub(slug: string) {
    // flat kategoriler için (isHierarchical === false)
    setSelectedPath(prev => {
      const exists = prev.find(p => p.slug === slug)
      if (exists) return []
      const node = subcats.find(s => s.slug === slug)
      return node ? [{ _id: node._id, slug: node.slug, name: node.name }] : prev
    })
  }

  const { categories, loading: catsLoading } = useCategories()
  const filterSlugs = getFilterSlugs()
  const { questions, allCategoryQuestions, loading: qsLoading } = useQuestions(kategori, filterSlugs)

  // Alt dal (ve çocukları) altındaki toplam soru sayısını hesapla
  function getSubCount(nodeId: string, nodeSlug: string) {
    if (!allCategoryQuestions) return 0
    const descendants = getAllDescendantSlugs(nodeId)
    const validSlugs = new Set([nodeSlug, ...descendants])
    return allCategoryQuestions.filter(q => q.subcategory && validSlugs.has(q.subcategory)).length
  }

  if (catsLoading || qsLoading) return null // Veya loading spinner

  const category = categories.find((c) => c.id === kategori)

  if (!category) {
    return (
      <PageWrapper className="py-10">
        <p className="text-slate-500 dark:text-slate-400">Kategori bulunamadı.</p>
      </PageWrapper>
    )
  }

  // Segmented control button style helpers
  const segmentBtn = (active: boolean, accentColor: string, small = false) => ({
    flexShrink: 0 as const,
    padding: small ? '6px 14px' : '7px 16px',
    borderRadius: 999,
    fontSize: small ? 12 : 13,
    fontWeight: active ? 700 : 500,
    cursor: 'pointer' as const,
    border: 'none' as const,
    outline: 'none' as const,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
    background: active ? (d ? 'rgba(255,255,255,0.14)' : '#ffffff') : 'transparent',
    color: active ? accentColor : d ? 'rgba(148,163,184,0.65)' : 'rgba(100,116,139,0.7)',
    boxShadow: active ? (d ? '0 1px 8px rgba(0,0,0,0.4)' : '0 1px 6px rgba(0,0,0,0.13)') : 'none',
  })

  // Segmented control container style
  const segmentContainer = {
    display: 'flex' as const,
    gap: 2,
    overflowX: 'auto' as const,
    scrollbarWidth: 'none' as const,
    padding: '4px',
    borderRadius: 999,
    background: d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
  }

  return (
    <div className="min-h-screen pb-16" style={{ paddingTop: '120px' }}>
      <PageWrapper>
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-16 flex-wrap"
        >
          <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight size={14} />
          <Link to="/sorular" className="hover:text-slate-900 dark:hover:text-white transition-colors">Sorular</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 dark:text-white font-medium">{category.label}</span>
        </motion.nav>

        {/* Başlık — Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-20"
          style={{
            position: 'relative',
            overflow: 'hidden',
            minHeight: '180px',
            borderRadius: '20px',
            padding: '32px',
            background: `linear-gradient(135deg, ${category.color}22 0%, transparent 60%)`,
            borderTop: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
            borderRight: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
            borderBottom: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
            borderLeft: `3px solid ${category.color}`,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Watermark emoji */}
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '180px',
            opacity: 0.06,
            userSelect: 'none',
            lineHeight: 1,
            pointerEvents: 'none',
          }}>
            {category.emoji}
          </div>

          {/* İçerik */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full" style={{ position: 'relative', zIndex: 1 }}>
            {/* İkon */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl flex-shrink-0"
              style={{
                backgroundColor: category.bgColor,
                border: `1px solid ${category.color}44`,
                boxShadow: `0 0 32px ${category.color}55`,
              }}
            >
              {category.emoji}
            </div>

            {/* Metin */}
            <div className="flex flex-col gap-2 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                {category.label}
              </h1>
              {category.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {category.description}
                </p>
              )}
              {/* Badge satırı */}
              <div className="flex items-center gap-3 flex-wrap mt-1">
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  borderRadius: 999, padding: '4px 12px',
                  fontSize: 13, fontWeight: 600,
                  color: d ? 'rgba(226,232,240,0.9)' : '#334155',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: category.color, flexShrink: 0 }} />
                  <FileText size={12} style={{ color: category.color }} />
                  {questions.length} Soru
                </div>
                {subcats.length > 0 && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    borderRadius: 999, padding: '4px 12px',
                    fontSize: 13, fontWeight: 600,
                    color: d ? 'rgba(226,232,240,0.9)' : '#334155',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: category.color, flexShrink: 0 }} />
                    <Layers size={12} style={{ color: category.color }} />
                    {isHierarchical ? topLevel.length : subcats.length} Alan
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filtreler */}
        {subcats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-24"
          >
            {isHierarchical ? (
              /* N-kademeli hiyerarşik filtre */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
                {[0, 1, 2].map(level => {
                  const parentId = level === 0 ? '' : selectedPath[level - 1]?._id
                  if (level > 0 && !selectedPath[level - 1]) return null
                  const items = getChildren(parentId ?? '').sort((a, b) => getSubCount(b._id, b.slug) - getSubCount(a._id, a.slug))
                  if (!items.length) return null
                  const levelLabel = ['Alan', 'Alt Alan', 'Rol'][level]
                  const currentSelection = selectedPath[level]
                  const isActive = (item: { _id: string }) => currentSelection?._id === item._id
                  const accentColor = category?.color ?? '#3b82f6'
                  const small = level > 0

                  return (
                    <motion.div
                      key={level}
                      initial={level > 0 ? { opacity: 0, y: -6 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="flex items-center gap-6 mb-6">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 m-0">{levelLabel}</p>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-white/5"></div>
                      </div>
                      <div
                        className="[&::-webkit-scrollbar]:hidden"
                        style={segmentContainer}
                      >
                        <button
                          onClick={() => handleSelect(level, null)}
                          style={segmentBtn(!currentSelection, accentColor, small)}
                        >
                          Tümü
                        </button>
                        {items.map(item => {
                          const active = isActive(item)
                          return (
                            <button
                              key={item._id}
                              onClick={() => handleSelect(level, active ? null : { _id: item._id, slug: item.slug, name: item.name })}
                              style={segmentBtn(active, accentColor, small)}
                            >
                              {item.name}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              /* Düz (flat) filtre — diğer kategoriler */
              <>
                <div className="flex items-center gap-6 mb-6">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 m-0">Alt Dal</p>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/5"></div>
                </div>
                <div
                  className="[&::-webkit-scrollbar]:hidden"
                  style={segmentContainer}
                >
                  <button
                    onClick={() => setSelectedPath([])}
                    style={segmentBtn(selectedPath.length === 0, category?.color ?? '#3b82f6')}
                  >
                    Tümü
                  </button>
                  {[...subcats].sort((a, b) => getSubCount(b._id, b.slug) - getSubCount(a._id, a.slug)).map(sub => {
                    const active = selectedPath.some(p => p.slug === sub.slug)
                    return (
                      <button
                        key={sub.slug}
                        onClick={() => toggleSub(sub.slug)}
                        style={segmentBtn(active, category?.color ?? '#3b82f6')}
                      >
                        {sub.name}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
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
                  onClick={() => navigate(`/antrenman/${mode.id}?kategori=${kategori}${filterSlugs ? `&altdal=${filterSlugs.join(',')}` : ''}`)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '20px',
                    padding: '24px',
                    background: d ? mode.gradientDark : mode.gradientLight,
                    borderTop: `1px solid ${d ? mode.borderDark : mode.borderLight}`,
                    borderRight: `1px solid ${d ? mode.borderDark : mode.borderLight}`,
                    borderBottom: `1px solid ${d ? mode.borderDark : mode.borderLight}`,
                    borderLeft: `4px solid ${mode.leftBorder}`,
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
            {questions.slice(0, 5).map((q) => (
              <motion.div
                key={q.id}
                variants={fadeUp}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                style={{
                  background: d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
                  borderTop: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                  borderRight: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                  borderBottom: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                  borderLeft: `3px solid ${difficultyBorderColor(q.difficulty)}`,
                  borderRadius: '20px',
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: d ? 'none' : '0 2px 16px rgba(0,0,0,0.05)',
                }}
              >
                <p style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: d ? 'rgba(226,232,240,0.9)' : '#0f172a', lineHeight: 1.65, margin: 0 }}>
                  {q.question}
                </p>
                <div style={{ flexShrink: 0 }}>
                  {q.difficulty === 'kolay' && (
                    <span className="inline-flex items-center justify-center rounded-full border border-green-500/30 bg-green-500/20 px-4 py-1.5 text-xs font-semibold text-green-400 whitespace-nowrap" style={{ minWidth: '72px' }}>
                      ✓ Kolay
                    </span>
                  )}
                  {q.difficulty === 'orta' && (
                    <span className="inline-flex items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/20 px-4 py-1.5 text-xs font-semibold text-amber-400 whitespace-nowrap" style={{ minWidth: '72px' }}>
                      ◆ Orta
                    </span>
                  )}
                  {q.difficulty === 'zor' && (
                    <span className="inline-flex items-center justify-center rounded-full border border-red-500/30 bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-400 whitespace-nowrap" style={{ minWidth: '72px' }}>
                      ✦ Zor
                    </span>
                  )}
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
