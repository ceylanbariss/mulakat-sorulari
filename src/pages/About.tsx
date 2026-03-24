import { ChevronDown, Target, Zap, Users, Mail, ArrowUp } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { useCategories } from '../hooks/useCategories'

const STEPS = [
  {
    step: '01',
    title: 'Kategori Seç',
    desc: 'Yazılım, Kamu, Banka veya İK kategorilerinden birini seç.',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    shadow: 'rgba(59,130,246,0.3)',
  },
  {
    step: '02',
    title: 'Mod Seç',
    desc: 'Flash Card, Quiz veya Yazılı Cevap modlarından birine gir.',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    shadow: 'rgba(139,92,246,0.3)',
  },
  {
    step: '03',
    title: 'Antrenman Yap',
    desc: 'Soruları çöz, cevapları gör ve performansını takip et.',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    shadow: 'rgba(16,185,129,0.3)',
  },
]

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
      <h2
        style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: subtitle ? '12px' : '16px', letterSpacing: '-0.02em' }}
        className="text-slate-900 dark:text-white"
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: '16px', maxWidth: '480px', margin: '0 auto 16px', lineHeight: 1.6 }} className="text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
      <div style={{ width: '60px', height: '3px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '2px', margin: '0 auto' }} />
    </div>
  )
}

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="border-b border-slate-100 dark:border-slate-700/60 last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '20px 0', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ fontWeight: 600, fontSize: '16px', lineHeight: 1.4 }} className="text-slate-900 dark:text-white">
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ flexShrink: 0 }}
          className="text-slate-400"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ fontSize: '15px', paddingBottom: '20px', lineHeight: 1.75 }} className="text-slate-500 dark:text-slate-400">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const cardStyle = {
  borderRadius: '16px',
  padding: '32px',
  border: '1px solid rgba(226,232,240,0.8)',
}

const cardLight = 'bg-white dark:bg-slate-800 dark:border-slate-700'
const cardShadow = { boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }

export function About() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'
  const { categories } = useCategories()

  const totalQuestions = categories.reduce((sum, cat) => sum + (cat.count ?? 0), 0)
  const categoryNamesStr = categories.length > 1
    ? categories.slice(0, -1).map(c => c.label).join(', ') + ' ve ' + categories[categories.length - 1].label
    : categories.length === 1 ? categories[0].label : 'Yazılım, Kamu, Banka ve İK'

  const FAQ = [
    { q: 'Uygulama ücretsiz mi?', a: 'Evet, temel özellikler tamamen ücretsizdir.' },
    { q: 'Sorular ne kadar güncel?', a: 'Soru havuzumuz uzman ekibimiz tarafından düzenli olarak güncellenmektedir.' },
    { q: 'Hesap açmadan kullanabilir miyim?', a: 'Evet, antrenman modlarını üye olmadan da kullanabilirsiniz. Ancak ilerlemenizi kaydetmek için giriş yapmanız gerekir.' },
    { q: 'Hangi kategoriler mevcut?', a: `${categoryNamesStr} kategorilerinde ${totalQuestions > 0 ? `${totalQuestions}+` : 'binlerce'} soru bulunmaktadır.` },
    { q: 'Mobil uyumlu mu?', a: 'Evet, uygulama tüm ekran boyutlarına uyumlu responsive tasarıma sahiptir.' },
    { q: 'Soruları favorilere ekleyebilir miyim?', a: 'Evet, giriş yaptıktan sonra soruları favorilerinize ekleyebilirsiniz.' },
  ]

  const FEATURES = [
    {
      icon: Target,
      title: 'Hedef Odaklı',
      desc: 'Gerçek mülakat sorularıyla pratik yaparak hedefinize ulaşın.',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadow: 'rgba(59,130,246,0.25)',
    },
    {
      icon: Zap,
      title: 'Hızlı Antrenman',
      desc: '3 farklı modda anında antrenman yapmaya başlayın.',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      shadow: 'rgba(139,92,246,0.25)',
    },
    {
      icon: Users,
      title: 'Uzman İçerik',
      desc: `Alanında uzman kişiler tarafından hazırlanan ${totalQuestions > 0 ? `${totalQuestions}+` : 'binlerce'} soru.`,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadow: 'rgba(16,185,129,0.25)',
    },
  ]

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      <div className="relative z-10">
        {/* ── Hero ── */}
        <div style={{
          paddingTop: '120px',
          paddingBottom: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          </div>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 900, color: d ? 'white' : '#0f172a', marginBottom: '16px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                Mülakatına hazırlanmanın<br />en akıllı yolu
              </h1>
              <p style={{ color: d ? 'rgba(148,163,184,0.75)' : 'rgba(71,85,105,0.8)', maxWidth: '500px', margin: '0 auto', fontSize: '17px', lineHeight: 1.75 }}>
                İş mülakatlarına hazırlanmayı kolaylaştıran, akıllı antrenman sistemiyle fark yaratmanı sağlayan bir platform.
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

          {/* Misyon */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ ...cardStyle, ...cardShadow, marginTop: '64px', padding: '40px 48px', position: 'relative', overflow: 'hidden' }}
            className={cardLight}
          >
            {/* Sol accent çizgisi */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'linear-gradient(180deg, #3b82f6, #8b5cf6)', borderRadius: '16px 0 0 16px' }} />
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', position: 'relative' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0, boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>
                🎯
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.01em' }} className="text-slate-900 dark:text-white">
                  Misyonumuz
                </h2>
                <p style={{ lineHeight: 1.8, fontSize: '15px', maxWidth: '680px' }} className="text-slate-500 dark:text-slate-400">
                  Her adayın karşısına geçtiği mülakata tam hazırlıklı çıkmasını istiyoruz. Gerçek mülakat sorularıyla
                  antrenman yaparak kendinize olan güveninizi artırın, eksiklerinizi tespit edin ve kariyer hedefinize ulaşın.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Özellikler */}
          <section style={{ marginTop: '80px' }}>
            <SectionTitle title="Neden Bizi Seçmelisiniz?" subtitle="Mülakat hazırlığını daha verimli ve etkili hale getiren özellikler" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {FEATURES.map(({ icon: Icon, title, desc, gradient, shadow }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -4 }}
                  style={{ ...cardStyle, ...cardShadow, cursor: 'default' }}
                  className={cardLight}
                >
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: `0 4px 16px ${shadow}` }}>
                    <Icon size={24} color="white" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.01em' }} className="text-slate-900 dark:text-white">
                    {title}
                  </h3>
                  <p style={{ fontSize: '15px', lineHeight: 1.7 }} className="text-slate-500 dark:text-slate-400">
                    {desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Nasıl Çalışır */}
          <section style={{ marginTop: '80px' }}>
            <SectionTitle title="Nasıl Çalışır?" subtitle="3 adımda mülakat hazırlığına başla" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {STEPS.map(({ step, title, desc, gradient, shadow }, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  whileHover={{ y: -4 }}
                  style={{ ...cardStyle, ...cardShadow, textAlign: 'center' }}
                  className={cardLight}
                >
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: `0 4px 16px ${shadow}` }}>
                    <span style={{ color: 'white', fontSize: '16px', fontWeight: 800 }}>{parseInt(step)}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }} className="text-slate-900 dark:text-white">
                    {title}
                  </h3>
                  <p style={{ fontSize: '15px', lineHeight: 1.7 }} className="text-slate-500 dark:text-slate-400">
                    {desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* SSS */}
          <section style={{ marginTop: '80px' }}>
            <SectionTitle title="Sık Sorulan Sorular" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ ...cardShadow, borderRadius: '20px', padding: '8px 40px', border: '1px solid rgba(226,232,240,0.8)' }}
              className={cardLight}
            >
              {FAQ.map((item, i) => (
                <FaqItem key={item.q} {...item} index={i} />
              ))}
            </motion.div>
          </section>

          {/* İletişim */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ ...cardShadow, marginTop: '80px', borderRadius: '20px', padding: '48px 40px', border: '1px solid rgba(226,232,240,0.8)', textAlign: 'center' }}
            className={cardLight}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 16px rgba(59,130,246,0.3)' }}>
              <Mail size={24} color="white" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }} className="text-slate-900 dark:text-white">
              İletişim
            </h2>
            <p style={{ marginBottom: '24px', fontSize: '15px', lineHeight: 1.6 }} className="text-slate-500 dark:text-slate-400">
              Soru, öneri veya hata bildirimi için bize ulaşın.
            </p>
            <a
              href="mailto:iletisim@mulakatsorulari.com"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
              }}
            >
              <Mail size={16} />
              iletisim@mulakatsorulari.com
            </a>
          </motion.div>

          {/* Yukarı Dön */}
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToTop}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <ArrowUp size={14} /> Yukarı Dön
            </motion.button>
          </div>

        </div>
      </div>
    </div>
  )
}
