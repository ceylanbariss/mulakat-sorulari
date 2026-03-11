import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BarChart2, Clock, CheckCircle, Flame, Lock, ArrowRight } from 'lucide-react'
import AnoAI from '../components/ui/animated-shader-background'

const stats = [
  { label: 'Toplam Çözülen', value: '—', icon: BarChart2, color: '#3b82f6', iconBg: 'rgba(59,130,246,0.15)' },
  { label: 'Bu Hafta', value: '—', icon: Clock, color: '#8b5cf6', iconBg: 'rgba(139,92,246,0.15)' },
  { label: 'Doğru Oranı', value: '—', icon: CheckCircle, color: '#10b981', iconBg: 'rgba(16,185,129,0.15)' },
  { label: 'Streak', value: '—', icon: Flame, color: '#f59e0b', iconBg: 'rgba(245,158,11,0.15)' },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const cardVar = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
}

export function Statistics() {
  return (
    <div className="relative overflow-hidden" style={{ minHeight: '100vh', background: '#0d1524', paddingTop: '120px', paddingBottom: '80px' }}>
      <AnoAI />
      <div className="relative z-10" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── Başlık ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '40px' }}
        >
          <h1 style={{ fontSize: '40px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '0' }}>
            İlerleme Paneli
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginTop: '10px' }}>
            Antrenman geçmişin ve performansın burada görünür.
          </p>
        </motion.div>

        {/* ── Stat Kartları ── */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}
          className="grid-cols-2 grid sm:grid-cols-4"
        >
          {stats.map(({ label, value, icon: Icon, color, iconBg }) => (
            <motion.div
              key={label}
              variants={cardVar}
              style={{
                borderRadius: '16px',
                padding: '28px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Icon size={20} style={{ color }} />
              </div>
              <p style={{ fontSize: '32px', fontWeight: 700, color: 'white', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {value}
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '8px', fontWeight: 500 }}>
                {label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Kilit / Boş Durum ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', borderRadius: '20px', overflow: 'hidden' }}
        >
          {/* Sahte grafik arka planı */}
          <div style={{ padding: '40px 40px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px', marginBottom: '24px', opacity: 0.08 }}>
              {[40, 65, 35, 80, 55, 90, 70].map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '8px', background: 'linear-gradient(to top, #3b82f6, #8b5cf6)', height: `${h}%` }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '120px', opacity: 0.05 }}>
              {[55, 40, 75, 30, 85, 45, 60].map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '6px', background: 'rgba(255,255,255,0.5)', height: `${h}%` }} />
              ))}
            </div>
          </div>

          {/* Lock overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '60px 24px',
            backdropFilter: 'blur(14px)',
            background: 'rgba(13,21,36,0.72)',
          }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Lock size={28} style={{ color: 'rgba(255,255,255,0.55)' }} />
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '12px', letterSpacing: '-0.01em' }}>
              İstatistikler giriş yapmayı bekliyor
            </h3>

            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', maxWidth: '360px', margin: '0 auto', lineHeight: 1.65, marginBottom: '32px' }}>
              Antrenman sonuçların, doğru/yanlış oranın ve ilerleme grafiklerini görmek için hesabına giriş yap.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link
                to="/giris"
                className="btn-gradient-bg"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '14px', fontSize: '14px', fontWeight: 700, boxShadow: '0 8px 24px rgba(99,102,241,0.35)', textDecoration: 'none' }}
              >
                Giriş Yap <ArrowRight size={16} />
              </Link>
              <Link
                to="/sorular"
                style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                Antrenman Başlat
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
