import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Code2, Landmark, Banknote, Users, ArrowRight } from 'lucide-react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { useCategories } from '../hooks/useCategories'
import AnoAI from '../components/ui/animated-shader-background'

const ICONS = { yazilim: Code2, kamu: Landmark, banka: Banknote, ik: Users } as const

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
}

export function Questions() {
  const navigate = useNavigate()
  const { categories, loading } = useCategories()

  if (loading) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative overflow-hidden" style={{ paddingTop: '120px', paddingBottom: '160px' }}>
      <AnoAI />
      <div className="relative z-10">
        <PageWrapper>
          {/* Başlık */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
            style={{ paddingBottom: '48px' }}
          >
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">
              Mülakat Soruları
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
              Hazırlanmak istediğin kategoriyi seç ve antrenmanına hemen başla.
            </p>
          </motion.div>

          {/* Kartlar */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}
            className="sm:grid-cols-2 grid-cols-1"
          >
            {categories.map((cat, i) => {
              const Icon = ICONS[cat.id as keyof typeof ICONS]
              const isLastOdd = categories.length % 2 !== 0 && i === categories.length - 1

              return (
                <motion.div
                  key={cat.id}
                  variants={cardVariant}
                  onClick={() => navigate(`/sorular/${cat.id}`)}
                  whileHover={{ y: -3 }}
                  style={{
                    borderRadius: '16px',
                    padding: '28px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)',
                    transition: 'all 0.25s',
                    ...(isLastOdd ? { gridColumn: 'span 1' } : {}),
                  }}
                  className="hover:border-white/20 dark:hover:border-white/10"
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.2)'
                      ; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
                      ; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
                  }}
                >
                  {/* İkon */}
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: `${cat.color}18`,
                    border: `1px solid ${cat.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {Icon
                      ? <Icon size={26} style={{ color: cat.color }} strokeWidth={1.75} />
                      : <span style={{ fontSize: 26 }}>{cat.emoji}</span>
                    }
                  </div>

                  {/* Başlık */}
                  <h2
                    style={{ fontSize: '20px', fontWeight: 700, marginTop: '16px', marginBottom: '8px', letterSpacing: '-0.01em' }}
                    className="text-slate-900 dark:text-white"
                  >
                    {cat.label}
                  </h2>

                  {/* Açıklama */}
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, flex: 1 }}>
                    {cat.description}
                  </p>

                  {/* Alt bar */}
                  <div
                    style={{ marginTop: '20px', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    className="border-t border-slate-100 dark:border-slate-700/60"
                  >
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>
                      {cat.count} Soru
                    </span>
                    <span
                      style={{ fontSize: '14px', fontWeight: 600, color: cat.color, display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'gap 0.2s' }}
                    >
                      Başla <ArrowRight size={14} />
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </PageWrapper>
      </div>
    </div>
  )
}
