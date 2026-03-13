import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Code2, Landmark, Banknote, Users } from 'lucide-react'
import { PageWrapper } from '../layout/PageWrapper'
import { useCategories } from '../../hooks/useCategories'
import { useAppStore } from '../../store/useAppStore'

const ICONS = {
  yazilim: Code2,
  kamu: Landmark,
  banka: Banknote,
  ik: Users,
} as const

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const cardVariant = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
}

export function CategoryGrid() {
  const navigate = useNavigate()
  const { categories, loading } = useCategories()
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  if (loading) return null

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

        {/* Kartlar — 2 sütunlu grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-2"
          style={{ gap: '20px' }}
        >
          {categories.map((cat, i) => {
            const Icon = ICONS[cat.id as keyof typeof ICONS]
            const isLastOdd = categories.length % 2 !== 0 && i === categories.length - 1
            const baseColor = d ? '#0f172a' : '#f8fafc'
            const textPrimary = d ? 'rgba(241,245,249,0.95)' : '#0f172a'
            const textSecondary = d ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,0.85)'

            return (
              <motion.div
                key={cat.id}
                variants={cardVariant}
                onClick={() => navigate(`/sorular/${cat.id}`)}
                whileHover={{ y: -3, transition: { duration: 0.3 } }}
                className="group"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '20px',
                  padding: '28px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '180px',
                  background: `linear-gradient(135deg, ${cat.color}33 0%, ${baseColor} 70%)`,
                  border: `1px solid ${cat.color}30`,
                  transition: 'box-shadow 0.3s, border-color 0.3s',
                  ...(isLastOdd ? { gridColumn: 'span 2' } : {}),
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.boxShadow = `0 20px 40px ${cat.color}25`
                  el.style.borderColor = `${cat.color}80`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.boxShadow = 'none'
                  el.style.borderColor = `${cat.color}30`
                }}
              >
                {/* Sağ radial glow */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(ellipse at 80% 50%, ${cat.color}40 0%, transparent 60%)`,
                  pointerEvents: 'none',
                }} />

                {/* Büyük ikon watermark */}
                <div style={{
                  position: 'absolute', right: '-20px', bottom: '-10px',
                  opacity: d ? 0.1 : 0.07,
                  pointerEvents: 'none', lineHeight: 1,
                }}>
                  {Icon
                    ? <Icon size={160} style={{ color: cat.color }} strokeWidth={0.75} />
                    : <span style={{ fontSize: '160px' }}>{cat.emoji}</span>
                  }
                </div>

                {/* İçerik */}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
                  {/* Üst: küçük ikon + başlık */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px',
                      borderRadius: '10px',
                      background: `${cat.color}20`,
                      border: `1px solid ${cat.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {Icon
                        ? <Icon size={20} style={{ color: cat.color }} strokeWidth={1.75} />
                        : <span style={{ fontSize: 20 }}>{cat.emoji}</span>
                      }
                    </div>
                    <h3 style={{ fontSize: '22px', fontWeight: 700, color: textPrimary, letterSpacing: '-0.01em', margin: 0 }}>
                      {cat.label}
                    </h3>
                  </div>

                  {/* Açıklama */}
                  <p style={{
                    fontSize: '14px', color: textSecondary, lineHeight: 1.6, flex: 1,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                  }}>
                    {cat.description}
                  </p>

                  {/* Alt: soru sayısı badge + Başla */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                      borderRadius: 999, padding: '4px 12px',
                      fontSize: 13, fontWeight: 600,
                      color: d ? 'rgba(226,232,240,0.9)' : '#334155',
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                      {cat.count} Soru
                    </div>
                    <span style={{
                      fontSize: '14px', fontWeight: 700, color: cat.color,
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}>
                      Başla
                      <ArrowRight
                        size={14}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </PageWrapper>
    </section>
  )
}
