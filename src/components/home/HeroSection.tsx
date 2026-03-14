import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { PageWrapper } from '../layout/PageWrapper'
import { useAppStore } from '../../store/useAppStore'
import { useCategories } from '../../hooks/useCategories'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.25 } },
}
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
}

export function HeroSection() {
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'
  const { categories, loading: catsLoading } = useCategories()

  const totalQuestions = categories.reduce((sum, cat) => sum + (cat.count ?? 0), 0)
  const categoryCount = categories.length

  const STATS = [
    { value: catsLoading ? '…' : `${totalQuestions}+`, label: 'Uzman Soru' },
    { value: catsLoading ? '…' : String(categoryCount), label: 'Kategori' },
    { value: '3', label: 'Antrenman Modu' },
  ]

  return (
    <section
      className="noise-overlay"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        paddingTop: '64px',
        width: '100%',
        maxWidth: '100vw',
      }}
    >

      <PageWrapper className="relative z-10">
        <div style={{ paddingTop: '40px', paddingBottom: '160px' }}>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            style={{ textAlign: 'center', maxWidth: '860px', marginLeft: 'auto', marginRight: 'auto' }}
          >

            {/* Logo */}
            <motion.div
              variants={item}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '280px',
                  maxWidth: '100%',
                  height: '280px',
                }}
              >
                <img
                  src="/logo.png"
                  alt="Mülakat Soruları Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    position: 'relative',
                    zIndex: 1,
                  }}
                />
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={item}
              style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, color: d ? 'white' : '#0f172a', marginBottom: '28px' }}
            >
              {'Mülakatına '}
              <span className="gradient-text">Hazır</span>
              {' mısın?'}
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={item}
              style={{ fontSize: 'clamp(15px, 2.5vw, 19px)', color: d ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,0.85)', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '44px', lineHeight: 1.8 }}
            >
              Flash Card, Quiz ve Yazılı Cevap modlarıyla{' '}
              <strong style={{ color: d ? 'rgba(226,232,240,0.95)' : '#1e293b', fontWeight: 700 }}>4 farklı kategoride</strong>{' '}
              antrenman yap. Eksiklerini bul, güçlü yönlerini keşfet.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={item}
              style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px' }}
            >
              <Link to="/sorular">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 20px 48px -8px rgba(139,92,246,0.55)' }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-gradient-bg"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '16px 40px', borderRadius: '16px', fontWeight: 700, fontSize: '16px', boxShadow: '0 8px 28px rgba(99,102,241,0.35)', border: 'none', cursor: 'pointer' }}
                >
                  Hemen Başla
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
              <a href="#nasil-calisir">
                <motion.button
                  whileHover={{ scale: 1.03 } as any}
                  whileTap={{ scale: 0.97 }}
                  className="btn-gradient-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 36px', borderRadius: '16px', background: d ? 'rgba(9,15,30,0.85)' : 'rgba(248,250,252,0.9)', fontSize: '15px', cursor: 'pointer', fontWeight: 600 }}
                >
                  <span className="gradient-text">Nasıl Çalışır?</span>
                  <ChevronDown size={17} className="gradient-text" style={{ flexShrink: 0 }} />
                </motion.button>
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={item}
              style={{ marginTop: '72px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', minWidth: 0, width: '100%' }}
            >
              {STATS.map(({ value, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                  style={{ textAlign: 'center', padding: '28px 16px', borderRadius: '20px', background: d ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)', border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)', backdropFilter: 'blur(16px)', minWidth: 0, overflow: 'hidden' }}
                >
                  <p style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: d ? 'white' : '#0f172a', lineHeight: 1, letterSpacing: '-0.03em' }}>
                    {value}
                  </p>
                  <p style={{ fontSize: '13px', color: d ? 'rgba(100,116,139,0.9)' : 'rgba(71,85,105,0.7)', marginTop: '10px', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' as const }}>
                    {label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </PageWrapper>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)' }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ color: d ? 'rgba(100,116,139,0.5)' : 'rgba(71,85,105,0.4)' }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </motion.div>
    </section>
  )
}
