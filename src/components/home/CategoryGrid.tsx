import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Code2, Landmark, Banknote, Users } from 'lucide-react'
import { PageWrapper } from '../layout/PageWrapper'
import { useCategories } from '../../hooks/useCategories'
import { useAppStore } from '../../store/useAppStore'

const ICONS = {
  yazilim: Code2,
  kamu: Landmark,
  banka: Banknote,
  ik: Users,
} as const

const GLOW_COLORS: Record<string, string> = {
  yazilim: 'rgba(59,130,246,0.25)',
  kamu: 'rgba(16,185,129,0.25)',
  banka: 'rgba(245,158,11,0.25)',
  ik: 'rgba(139,92,246,0.25)',
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const cardVariant = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
}

// Bento layout: [0] col-span-3, [1] col-span-2, [2] col-span-2, [3] col-span-3
const SPANS = [3, 2, 2, 3]

export function CategoryGrid() {
  const navigate = useNavigate()
  const { categories, loading } = useCategories()
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  if (loading) return null // Veya loading spinner

  return (
    <section className="pt-28 pb-32 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <PageWrapper className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', paddingTop: '48px', marginBottom: '56px' }}
        >
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: d ? 'white' : '#0f172a', letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.15 }}>
            Hangi alanda hazırlanıyorsun?
          </h2>
          <p style={{ color: d ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.75)', fontSize: '17px', lineHeight: 1.7, maxWidth: '420px', margin: '0 auto' }}>
            4 farklı kategoride, 80 uzman soruyla mülakata hazırlan.
          </p>
        </motion.div>

        {/* Bento grid — 2 cols on mobile, 5 cols bento on desktop */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 md:grid-cols-5"
          style={{ gap: '14px' }}
        >
          {categories.map((cat, i) => {
            const Icon = ICONS[cat.id as keyof typeof ICONS]
            const glow = GLOW_COLORS[cat.id] || 'rgba(59,130,246,0.25)'
            const span = SPANS[i % SPANS.length]
            const spanClass = span === 3 ? 'col-span-1 md:col-span-3' : 'col-span-1 md:col-span-2'

            return (
              <motion.div
                key={cat.id}
                variants={cardVariant}
                onClick={() => navigate(`/sorular/${cat.id}`)}
                whileHover={{ y: -6, transition: { duration: 0.22 } }}
                className={spanClass}
                style={{
                  borderRadius: '20px',
                  padding: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  overflow: 'hidden',
                  position: 'relative',
                  minHeight: '180px',
                  background: d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.75)',
                  border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                  backdropFilter: 'blur(12px)',
                  transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.3s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px rgba(255,255,255,0.12), 0 20px 60px -10px ${glow}`
                    ; (e.currentTarget as HTMLDivElement).querySelector<HTMLElement>('.bento-top-line')!.style.opacity = '1'
                    ; (e.currentTarget as HTMLDivElement).querySelector<HTMLElement>('.bento-arrow')!.style.opacity = '1'
                    ; (e.currentTarget as HTMLDivElement).querySelector<HTMLElement>('.bento-arrow')!.style.transform = 'translateY(0)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                    ; (e.currentTarget as HTMLDivElement).querySelector<HTMLElement>('.bento-top-line')!.style.opacity = '0'
                    ; (e.currentTarget as HTMLDivElement).querySelector<HTMLElement>('.bento-arrow')!.style.opacity = '0'
                    ; (e.currentTarget as HTMLDivElement).querySelector<HTMLElement>('.bento-arrow')!.style.transform = 'translateY(-4px)'
                }}
              >
                {/* Top gradient line */}
                <div className="bento-top-line" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${cat.color}60, transparent)`, opacity: 0, transition: 'opacity 0.3s' }} />

                {/* Icon + arrow */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${cat.color}18`, border: `1px solid ${cat.color}30`, flexShrink: 0 }}>
                    {Icon ? <Icon size={20} style={{ color: cat.color }} strokeWidth={1.75} /> : <span style={{ fontSize: 20 }}>{cat.emoji}</span>}
                  </div>
                  <div className="bento-arrow" style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', opacity: 0, transform: 'translateY(-4px)', transition: 'opacity 0.2s, transform 0.2s' }}>
                    <ArrowUpRight size={14} style={{ color: d ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }} />
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 800, color: d ? 'white' : '#0f172a', fontSize: '16px', marginBottom: '6px', letterSpacing: '-0.02em' }}>{cat.label}</h3>
                  <p style={{ fontSize: '13px', color: d ? 'rgba(148,163,184,0.65)' : 'rgba(71,85,105,0.7)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                    {cat.description}
                  </p>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: d ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: d ? 'rgba(100,116,139,0.8)' : 'rgba(100,116,139,0.9)', letterSpacing: '0.03em' }}>
                    {cat.count} Soru
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: cat.color, letterSpacing: '0.05em' }}>
                    Başla →
                  </span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </PageWrapper>
    </section>
  )
}
