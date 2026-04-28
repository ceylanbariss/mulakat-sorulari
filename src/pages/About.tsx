import {
  BookOpen, Zap, Bot, FileText, TrendingUp, Newspaper,
  ArrowRight, ArrowUp, ChevronRight, CheckCircle2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

// ── Veri ────────────────────────────────────────────────────────────────────

const MODULES = [
  {
    route: '/sorular',
    icon: BookOpen,
    label: 'Soru Bankası',
    badge: '3.000+ Soru',
    desc: 'IT/Bilişim, Yapay Zeka, Kamu, Banka ve İK kategorilerinde sektör profesyonelleriyle derlenen güncel sorular.',
    accent: '#3b82f6',
    gradient: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
    glow: 'rgba(59,130,246,0.22)',
    preview: '/previews/preview-sorular.png',
    previewPos: 'top',
  },
  {
    route: '/mulakat-sim',
    icon: Bot,
    label: 'AI Mülakat Simülasyonu',
    badge: 'Yeni',
    desc: "CV'ni ve iş ilanını yükle, AI ile gerçekçi mülakat yap, detaylı performans raporu al.",
    accent: '#10b981',
    gradient: 'linear-gradient(135deg,#059669,#10b981)',
    glow: 'rgba(16,185,129,0.22)',
    preview: '/previews/preview-mulakat.png',
    previewPos: 'top',
  },
  {
    route: '/cv-olustur',
    icon: FileText,
    label: 'Akıllı CV Oluşturucu',
    badge: 'AI Destekli',
    desc: "Sıfırdan CV oluştur veya iş ilanına göre AI ile optimize et. ATS uyumluluğunu anlık takip et.",
    accent: '#f59e0b',
    gradient: 'linear-gradient(135deg,#d97706,#f59e0b)',
    glow: 'rgba(245,158,11,0.22)',
    preview: '/previews/preview-cv.png',
    previewPos: 'top',
  },
  {
    route: '/it-kariyer-testi',
    icon: Zap,
    label: 'IT Kariyer Testi',
    badge: '30+ Soru',
    desc: 'Hangi IT kariyer alanının sana en uygun olduğunu 5 alan ve anlık rapor ile keşfet.',
    accent: '#8b5cf6',
    gradient: 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
    glow: 'rgba(139,92,246,0.22)',
    preview: '/previews/preview-kariyer.png',
    previewPos: 'top',
  },
  {
    route: '/istatistikler',
    icon: TrendingUp,
    label: 'Performans Koçu',
    badge: 'Kişisel',
    desc: 'Antrenman geçmişini analiz et, zayıf konularını öğren, mod önerisi ve haftalık hedef al.',
    accent: '#ef4444',
    gradient: 'linear-gradient(135deg,#dc2626,#ef4444)',
    glow: 'rgba(239,68,68,0.22)',
    preview: '/previews/preview-istatistikler.png',
    previewPos: 'top',
  },
  {
    route: '/haberler',
    icon: Newspaper,
    label: 'Kariyer & Sektör Haberleri',
    badge: 'Güncel',
    desc: 'Mülakat tüyoları, sektör güncellemeleri ve platform yenilikleri tek bir akışta.',
    accent: '#06b6d4',
    gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)',
    glow: 'rgba(6,182,212,0.22)',
    preview: '/previews/preview-haberler.png',
    previewPos: 'top',
  },
]

const STATS = [
  { value: '3.000+', label: 'Uzman Soru', gradient: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' },
  { value: '5', label: 'Kategori', gradient: 'linear-gradient(135deg,#8b5cf6,#06b6d4)' },
  { value: '3', label: 'Antrenman Modu', gradient: 'linear-gradient(135deg,#10b981,#3b82f6)' },
]

const KARIYER_STATS = [
  { value: '30+', label: 'Kariyer Sorusu', gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  { value: '5', label: 'IT Kariyer Alanı', gradient: 'linear-gradient(135deg,#06b6d4,#8b5cf6)' },
  { value: 'Anlık', label: 'Sonuç Raporu', gradient: 'linear-gradient(135deg,#10b981,#059669)' },
]

// ── Ana bileşen ──────────────────────────────────────────────────────────────

export function About() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  const cardBg = d ? 'rgba(13,15,32,0.9)' : '#ffffff'
  const cardBorder = d ? 'rgba(255,255,255,0.07)' : 'rgba(226,232,240,0.9)'
  const cardShadow = d ? '0 4px 32px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.06)'
  const textPrimary = d ? 'rgba(255,255,255,0.92)' : '#0f172a'
  const textMuted = d ? 'rgba(148,163,184,0.7)' : '#64748b'
  const dividerColor = d ? 'rgba(255,255,255,0.06)' : 'rgba(226,232,240,0.8)'

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient glow blobs */}
      {d && <>
        <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.055) 0%,transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', top: '40%', right: '-15%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(6,182,212,0.04) 0%,transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: '10%', left: '20%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,0.03) 0%,transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />
      </>}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section style={{ paddingTop: '100px', paddingBottom: '80px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', alignItems: 'center' }}>

            {/* Sol: metin */}
            <motion.div
              initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
              style={{ flex: '1 1 300px', minWidth: '280px' }}
            >
              <div style={{ marginBottom: '16px' }}>
                <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: d ? 'rgba(139,92,246,0.12)' : 'rgba(59,130,246,0.08)', color: d ? '#a78bfa' : '#3b82f6', border: `1px solid ${d ? 'rgba(139,92,246,0.25)' : 'rgba(59,130,246,0.2)'}` }}>
                  Türkiye'nin Kariyer Platformu
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '20px', color: textPrimary }}>
                Türkiye'nin{' '}
                <span style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Mülakat Hazırlık
                </span>{' '}
                Platformu
              </h1>
              <p style={{ fontSize: '16px', lineHeight: 1.8, color: textMuted, maxWidth: '520px', marginBottom: '32px' }}>
                Kariyer hedeflerine ulaşmak için en doğru, en hazırlıklı aday olma yolunda mulakatsorulari.com.tr yanında...
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/sorular" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', borderRadius: '10px', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white', fontSize: '15px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
                  Hemen Başla <ArrowRight size={16} />
                </Link>
                <Link to="/mulakat-sim" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', borderRadius: '10px', background: d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: textPrimary, fontSize: '15px', fontWeight: 600, textDecoration: 'none', border: `1px solid ${cardBorder}` }}>
                  AI Mülakat Dene <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>

            {/* Sağ: logo showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.15 }}
              style={{ flexShrink: 0, position: 'relative' }}
            >
              <div style={{ width: '288px', height: '288px', borderRadius: '50%', background: d ? 'rgba(124,58,237,0.08)' : 'rgba(59,130,246,0.06)', border: `1px solid ${d ? 'rgba(124,58,237,0.2)' : 'rgba(59,130,246,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: d ? '0 0 80px rgba(124,58,237,0.15),0 0 40px rgba(6,182,212,0.08)' : '0 0 60px rgba(59,130,246,0.1)', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '-16px', borderRadius: '50%', border: `1px solid ${d ? 'rgba(124,58,237,0.1)' : 'rgba(59,130,246,0.08)'}` }} />
                <img src="/logosade.png" alt="mulakatsorulari.com.tr" style={{ width: '288px', height: '288px', objectFit: 'contain', filter: d ? 'drop-shadow(0 0 20px rgba(124,58,237,0.4))' : 'none', borderRadius: '50%' }} />
              </div>
            </motion.div>

          </div>
        </section>

        {/* ── MODÜLLER ─────────────────────────────────────────────────── */}
        <section style={{ paddingBottom: '80px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: d ? '#a78bfa' : '#7c3aed', marginBottom: '10px' }}>Modüllerimiz</p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em', marginBottom: '12px' }}>
              Platformu Keşfet
            </h2>
            <p style={{ fontSize: '15px', color: textMuted, maxWidth: '460px', margin: '0 auto', lineHeight: 1.65 }}>
              6 modül, tek hedef: seni mülakata hazır götürmek.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: '20px' }}>
            {MODULES.map(({ route, icon: Icon, label, badge, desc, accent, gradient, glow, preview, previewPos }, i) => (
              <motion.div
                key={route}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -6 }}
              >
                <Link
                  to={route}
                  style={{ display: 'block', borderRadius: '16px', background: cardBg, border: `1px solid ${cardBorder}`, overflow: 'hidden', textDecoration: 'none', boxShadow: cardShadow, transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${accent}50`
                    e.currentTarget.style.boxShadow = `0 12px 40px ${glow}`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = cardBorder
                    e.currentTarget.style.boxShadow = cardShadow
                  }}
                >
                  {/* Screenshot preview */}
                  <div style={{ height: '180px', position: 'relative', overflow: 'hidden', background: 'rgba(8,10,24,0.97)' }}>
                    <img
                      src={preview}
                      alt={label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: previewPos, display: 'block', transition: 'transform 0.4s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                    {/* Alt gradient geçişi — kart bilgisine yumuşak bağlantı */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: `linear-gradient(to bottom, transparent, ${cardBg})`, pointerEvents: 'none' }} />
                    {/* Aksan glow */}
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: `radial-gradient(circle,${glow.replace('0.22', '0.5')} 0%,transparent 70%)`, filter: 'blur(16px)', pointerEvents: 'none' }} />
                  </div>

                  {/* Kart bilgisi */}
                  <div style={{ padding: '18px 22px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px ${glow}` }}>
                          <Icon size={18} color="white" />
                        </div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, letterSpacing: '-0.01em' }}>{label}</h3>
                      </div>
                      <span style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 600, background: `${accent}18`, color: accent, border: `1px solid ${accent}30`, whiteSpace: 'nowrap' }}>{badge}</span>
                    </div>
                    <p style={{ fontSize: '13.5px', lineHeight: 1.65, color: textMuted }}>{desc}</p>
                    <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: accent }}>
                      Keşfet <ArrowRight size={13} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── MİSYON ───────────────────────────────────────────────────── */}
        <section style={{ paddingBottom: '80px' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ borderRadius: '20px', overflow: 'hidden', background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow, display: 'flex', flexWrap: 'wrap' }}
          >
            {/* Sol: metin */}
            <div style={{ flex: '1 1 300px', padding: '56px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: d ? '#a78bfa' : '#7c3aed', marginBottom: '12px' }}>Vizyon & Misyon</p>
              <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em', marginBottom: '20px', lineHeight: 1.2 }}>
                Neden Var Olduk?
              </h2>
              <p style={{ fontSize: '15px', lineHeight: 1.85, color: textMuted, marginBottom: '28px' }}>
                Mülakat süreçleri çoğu zaman adayları yalnız bırakır. Kaynaklar dağınık, sorular belirsiz, geri bildirim yetersiz. Biz bu dengesizliği kırmak için yola çıktık. Amacımız tek: seni o mülakata gerçekten hazır götürmek.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Uzman onaylı, güncel soru havuzu', 'AI destekli gerçekçi mülakat deneyimi', 'Kişiselleştirilmiş performans analizi'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: textMuted }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sağ: logo */}
            <div style={{ flex: '1 1 240px', background: d ? 'rgba(124,58,237,0.04)' : 'rgba(59,130,246,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderLeft: `1px solid ${cardBorder}`, minHeight: '280px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ position: 'absolute', borderRadius: '50%', border: `1px solid ${d ? `rgba(124,58,237,${0.12 - i * 0.03})` : `rgba(59,130,246,${0.1 - i * 0.025})`}`, width: `${i * 100 + 80}px`, height: `${i * 100 + 80}px` }} />
              ))}
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <img src="/logosade.png" alt="mulakatsorulari.com.tr" style={{ width: '160px', height: '160px', objectFit: 'contain', filter: d ? 'drop-shadow(0 0 30px rgba(124,58,237,0.35))' : 'drop-shadow(0 4px 16px rgba(0,0,0,0.08))' }} />
              </div>
              <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '6px 10px', borderRadius: '6px', background: d ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '11px', fontWeight: 600, color: '#6ee7b7' }}>
                #1 Mülakat Platformu
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── İSTATİSTİKLER ────────────────────────────────────────────── */}
        <section style={{ paddingBottom: '80px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: d ? '#a78bfa' : '#7c3aed', marginBottom: '10px' }}>Rakamlarla Platform</p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2rem)', fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em' }}>
              mulakatsorulari.com.tr'de Ne Var?
            </h2>
          </motion.div>

          {/* Platform stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ borderRadius: '16px', background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}
          >
            {STATS.map(({ value, label, gradient }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ padding: '44px 24px', textAlign: 'center', borderRight: i < STATS.length - 1 ? `1px solid ${dividerColor}` : 'none' }}
              >
                <div style={{ fontSize: 'clamp(2rem,3.5vw,2.8rem)', fontWeight: 900, background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px', letterSpacing: '-0.02em' }}>{value}</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: textMuted }}>{label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* IT Kariyer stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
            style={{ marginTop: '16px', borderRadius: '16px', background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow, overflow: 'hidden' }}
          >
            <div style={{ padding: '14px 24px', borderBottom: `1px solid ${dividerColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
              <Zap size={13} color={d ? '#a78bfa' : '#7c3aed'} />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: d ? '#a78bfa' : '#7c3aed' }}>IT Kariyer Testi</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
              {KARIYER_STATS.map(({ value, label, gradient }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1 }}
                  style={{ padding: '32px 24px', textAlign: 'center', borderRight: i < KARIYER_STATS.length - 1 ? `1px solid ${dividerColor}` : 'none' }}
                >
                  <div style={{ fontSize: 'clamp(1.75rem,3vw,2.4rem)', fontWeight: 900, background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '6px', letterSpacing: '-0.02em' }}>{value}</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: textMuted }}>{label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section style={{ paddingBottom: '40px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ borderRadius: '20px', padding: '64px 40px', background: d ? 'linear-gradient(135deg,rgba(124,58,237,0.12) 0%,rgba(6,182,212,0.06) 100%)' : 'linear-gradient(135deg,rgba(59,130,246,0.07) 0%,rgba(139,92,246,0.05) 100%)', border: `1px solid ${d ? 'rgba(124,58,237,0.18)' : 'rgba(59,130,246,0.15)'}`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}
          >
            {d && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.1) 0%,transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />}
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.5rem)', fontWeight: 900, color: textPrimary, letterSpacing: '-0.03em', marginBottom: '12px', lineHeight: 1.15 }}>
                Mülakatına Hazır mısın?
              </h2>
              <p style={{ fontSize: '16px', color: textMuted, marginBottom: '36px', lineHeight: 1.6 }}>
                Hemen başla, farkı hisset.
              </p>
              <Link to="/sorular" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 32px', borderRadius: '12px', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: 'white', fontSize: '16px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 6px 24px rgba(124,58,237,0.4)', letterSpacing: '-0.01em' }}>
                Sorulara Göz At <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Yukarı Dön */}
        <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={scrollToTop}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}
          >
            <ArrowUp size={13} /> Yukarı Dön
          </motion.button>
        </div>

      </div>
    </div>
  )
}
