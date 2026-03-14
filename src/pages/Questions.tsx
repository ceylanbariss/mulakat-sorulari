import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Code2, Landmark, Banknote, Users, ArrowRight } from 'lucide-react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { useCategories } from '../hooks/useCategories'
import { useAppStore } from '../store/useAppStore'

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
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  )
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (loading) return null

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ paddingTop: '120px', paddingBottom: '160px' }}>
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
            className="grid grid-cols-1 sm:grid-cols-2"
            style={{ gap: '20px' }}
          >
            {categories.map((cat, i) => {
              const Icon = ICONS[cat.id as keyof typeof ICONS]
              const isLastOdd = categories.length % 2 !== 0 && i === categories.length - 1

              const baseColor = d ? '#0f172a' : '#f8fafc'
              const textPrimary = d ? 'rgba(241,245,249,0.95)' : '#0f172a'
              const textSecondary = d ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,0.85)'

              // Mobil responsive değerler
              const cardPadding = isMobile ? '16px' : '28px'
              const iconBoxSize = isMobile ? '32px' : '40px'
              const iconBoxRadius = isMobile ? '8px' : '10px'
              const iconSize = isMobile ? 16 : 20
              const titleSize = isMobile ? '18px' : '22px'
              const watermarkSize = isMobile ? 96 : 160
              const watermarkRight = isMobile ? '8px' : '-20px'
              const watermarkBottom = isMobile ? '8px' : '-10px'
              const watermarkOpacity = isMobile ? 0.06 : (d ? 0.1 : 0.07)

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
                    padding: cardPadding,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: isMobile ? 'auto' : '180px',
                    background: `linear-gradient(135deg, ${cat.color}33 0%, ${baseColor} 70%)`,
                    border: `1px solid ${cat.color}30`,
                    transition: 'box-shadow 0.3s, border-color 0.3s',
                    ...(isLastOdd && !isMobile ? { gridColumn: 'span 2' } : {}),
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
                  {/* Clip container — glow ve watermark'ı kard içinde tutar */}
                  <div style={{
                    position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '20px',
                    pointerEvents: 'none',
                  }}>
                    {/* Sağ radial glow */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: `radial-gradient(ellipse at 80% 50%, ${cat.color}40 0%, transparent 60%)`,
                    }} />

                    {/* Büyük ikon watermark */}
                    <div style={{
                      position: 'absolute', right: watermarkRight, bottom: watermarkBottom,
                      opacity: watermarkOpacity,
                      lineHeight: 1,
                    }}>
                      {Icon
                        ? <Icon size={watermarkSize} style={{ color: cat.color }} strokeWidth={0.75} />
                        : <span style={{ fontSize: `${watermarkSize}px` }}>{cat.emoji}</span>
                      }
                    </div>
                  </div>

                  {/* İçerik */}
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
                    {/* Üst: küçük ikon + başlık */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: iconBoxSize, height: iconBoxSize,
                        borderRadius: iconBoxRadius,
                        background: `${cat.color}20`,
                        border: `1px solid ${cat.color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {Icon
                          ? <Icon size={iconSize} style={{ color: cat.color }} strokeWidth={1.75} />
                          : <span style={{ fontSize: iconSize }}>{cat.emoji}</span>
                        }
                      </div>
                      <h2 style={{ fontSize: titleSize, fontWeight: 700, color: textPrimary, letterSpacing: '-0.01em', margin: 0 }}>
                        {cat.label}
                      </h2>
                    </div>

                    {/* Açıklama */}
                    <p style={{
                      fontSize: '14px', color: textSecondary, lineHeight: 1.6, flex: 1,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                    }}>
                      {cat.description}
                    </p>

                    {/* Alt: soru sayısı badge + Başla */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                        borderRadius: 999, padding: isMobile ? '3px 10px' : '4px 12px',
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
      </div>
    </div>
  )
}
