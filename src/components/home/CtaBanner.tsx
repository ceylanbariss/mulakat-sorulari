import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { PageWrapper } from '../layout/PageWrapper'
import { useAppStore } from '../../store/useAppStore'

export function CtaBanner() {
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  return (
    <section style={{ padding: '80px 0', background: d ? 'linear-gradient(180deg, #0a1020 0%, #080e1a 100%)' : 'linear-gradient(180deg, #f0f4ff 0%, #f8fafc 100%)' }}>
      <PageWrapper>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '28px',
            padding: 'clamp(48px, 8vw, 80px) clamp(32px, 6vw, 80px)',
            textAlign: 'center',
            border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(59,130,246,0.15)',
            background: d
              ? 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.1) 50%, rgba(59,130,246,0.08) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(238,242,255,0.95) 50%, rgba(255,255,255,0.9) 100%)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Ambient blobs */}
          <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 65%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-30%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
          {/* Dot grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: d ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)' : 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
          {/* Top border glow */}
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: d ? 'linear-gradient(90deg, transparent, rgba(99,179,237,0.6), transparent)' : 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)' }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 900, color: d ? 'white' : '#0f172a', marginBottom: '20px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Bugün antrenmanına başla
            </h2>
            <p style={{ color: d ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,0.8)', marginBottom: '40px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto', fontSize: '17px', lineHeight: 1.75 }}>
              Her gün biraz pratik yaparak mülakatında fark yarat.
              Hesap açmadan hemen başlayabilirsin.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <Link to="/sorular">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 16px 40px rgba(139,92,246,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-gradient-bg"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 36px', borderRadius: '16px', fontWeight: 700, fontSize: '15px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)', border: 'none', cursor: 'pointer' }}
                >
                  Hemen Başla
                  <ArrowRight size={17} />
                </motion.button>
              </Link>
              <Link to="/giris">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-gradient-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 36px', borderRadius: '16px', background: d ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)', fontSize: '15px', cursor: 'pointer', fontWeight: 600 }}
                >
                  <span className="gradient-text">Kayıt Ol — Ücretsiz</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </PageWrapper>
    </section>
  )
}
