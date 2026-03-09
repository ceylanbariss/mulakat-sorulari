import { motion } from 'framer-motion'
import { CreditCard, ListChecks, PenLine, FolderSearch, Target, Trophy } from 'lucide-react'
import { PageWrapper } from '../layout/PageWrapper'
import { useAppStore } from '../../store/useAppStore'

const STEPS = [
  {
    num: 1,
    Icon: FolderSearch,
    label: 'Kategori Seç',
    desc: 'Yazılım, Kamu, Banka veya İK kategorilerinden hazırlanmak istediğin alanı seç.',
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.2)',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  },
  {
    num: 2,
    Icon: Target,
    label: 'Mod Seç',
    desc: 'Flash Card, Quiz veya Yazılı Cevap modlarından sana uygun olanı seç.',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.2)',
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  },
  {
    num: 3,
    Icon: Trophy,
    label: 'Antrenman Yap',
    desc: 'Soruları çöz, cevapları gör ve performansını adım adım geliştir.',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.2)',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
]

const MODES = [
  { icon: CreditCard, label: 'Flash Card', desc: 'Soruyu gör, cevabı aç', color: '#3b82f6' },
  { icon: ListChecks, label: 'Quiz Modu', desc: 'Şıklı test', color: '#8b5cf6' },
  { icon: PenLine, label: 'Yazılı Cevap', desc: 'Kendin yaz, karşılaştır', color: '#10b981' },
]

export function HowItWorks() {
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  return (
    <section id="nasil-calisir" className="py-28 relative overflow-hidden" style={{ background: d ? 'linear-gradient(180deg, #080e1a 0%, #0a1020 100%)' : 'linear-gradient(180deg, #f0f4ff 0%, #f8fafc 100%)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <PageWrapper className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '56px' }}
        >
          <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '999px', border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', background: d ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)', color: d ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,0.8)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '20px' }}>
            Nasıl Çalışır?
          </span>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: d ? 'white' : '#0f172a', letterSpacing: '-0.03em', marginBottom: '14px' }}>
            3 adımda mülakata hazırlan
          </h2>
          <p style={{ color: d ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.75)', fontSize: '17px', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto' }}>
            Basit ve etkili bir antrenman akışıyla hedefinize ulaş.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 relative" style={{ gap: '20px', marginBottom: '20px' }}>
          {/* Gradient connector — desktop only */}
          <div className="hidden md:block" style={{
            position: 'absolute',
            top: '44px',
            left: 'calc(16.67% + 28px)',
            right: 'calc(16.67% + 28px)',
            height: '1px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981)',
            opacity: d ? 0.4 : 0.3,
          }} />

          {STEPS.map(({ num, Icon, label, desc, color, glow, gradient }, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
              className="flex flex-col items-center text-center relative"
            style={{ borderRadius: '24px', padding: '28px 20px', gap: '16px', background: d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.75)', border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)', backdropFilter: 'blur(12px)' }}
            >
              {/* Step number badge */}
              <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', width: '28px', height: '28px', borderRadius: '50%', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, color: 'white', boxShadow: `0 4px 12px ${glow}` }}>
                {num}
              </div>

              {/* Icon */}
              <div style={{ position: 'relative', marginTop: '8px' }}>
                <div style={{ position: 'absolute', inset: '-10px', borderRadius: '50%', background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`, filter: 'blur(8px)' }} />
                <div style={{ position: 'relative', width: '72px', height: '72px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}14`, border: `1px solid ${color}28` }}>
                  <Icon size={28} style={{ color }} strokeWidth={1.5} />
                </div>
              </div>

              <div>
                <h3 style={{ fontWeight: 800, color: d ? 'white' : '#0f172a', fontSize: '18px', marginBottom: '10px', letterSpacing: '-0.02em' }}>{label}</h3>
                <p style={{ fontSize: '14px', color: d ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.7)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mode cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          style={{ borderRadius: '24px', padding: '32px', marginTop: '4px', background: d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.75)', border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)', backdropFilter: 'blur(12px)' }}
        >
          <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: d ? 'rgba(100,116,139,0.7)' : 'rgba(100,116,139,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '24px' }}>
            3 Antrenman Modu
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {MODES.map(({ icon: Icon, label, desc, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '16px', background: d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)', border: d ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} style={{ color }} strokeWidth={1.75} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: d ? 'white' : '#0f172a', fontSize: '14px' }}>{label}</p>
                  <p style={{ fontSize: '12px', color: d ? 'rgba(100,116,139,0.7)' : 'rgba(71,85,105,0.65)', marginTop: '2px' }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </PageWrapper>
    </section>
  )
}
