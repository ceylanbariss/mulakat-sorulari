import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Instagram, ArrowUp } from 'lucide-react'

const links = [
  { label: 'Sorular', to: '/sorular' },
  { label: 'İstatistikler', to: '/istatistikler' },
  { label: 'Hakkımızda', to: '/hakkimizda' },
  { label: 'Giriş Yap', to: '/giris' },
]

const HEADING = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.35)',
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  marginBottom: '20px',
}

export function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer style={{ background: '#0b1120', color: 'white', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── Main grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            paddingTop: '60px',
            paddingBottom: '48px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '64px',
          }}
        >
          {/* Sol: Logo + Açıklama */}
          <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px', textDecoration: 'none' }}>
              <img src="/logo.png" alt="logo" style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: '15px', color: 'white' }}>Mülakat Soruları</span>
            </Link>
            <p style={{ fontSize: '14px', color: 'rgba(148,163,184,0.75)', lineHeight: 1.7, maxWidth: '280px' }}>
              İş mülakatlarına hazırlanmayı kolaylaştıran akıllı antrenman platformu.
            </p>
          </div>

          {/* Orta: Sayfalar */}
          <div>
            <h3 style={HEADING}>Sayfalar</h3>
            <nav style={{ display: 'flex', flexDirection: 'column' }}>
              {links.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  style={{ fontSize: '14px', color: 'rgba(148,163,184,0.7)', textDecoration: 'none', marginBottom: '12px', transition: 'color 0.2s', display: 'inline-block', width: 'fit-content' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(148,163,184,0.7)')}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Sağ: İletişim + Sosyal */}
          <div>
            <h3 style={HEADING}>İletişim</h3>
            <a
              href="mailto:iletisim@mulakatsorulari.com"
              style={{ fontSize: '14px', color: 'rgba(148,163,184,0.7)', textDecoration: 'none', display: 'block', marginBottom: '24px', transition: 'color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.textDecoration = 'underline' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(148,163,184,0.7)'; e.currentTarget.style.textDecoration = 'none' }}
            >
              iletisim@mulakatsorulari.com
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <a
                href="https://www.instagram.com/mulakatsorulari.com.tr?igsh=Nm5qenlnNzU4Z2Fy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(148,163,184,0.7)',
                  transition: 'background 0.2s, color 0.2s',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(225,48,108,0.25)'
                  e.currentTarget.style.color = '#e1306c'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.color = 'rgba(148,163,184,0.7)'
                }}
              >
                <Instagram size={17} />
              </a>
              <a
                href="https://t.me/boost/mulakatsorulari"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(148,163,184,0.7)',
                  transition: 'background 0.2s, color 0.2s',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(34,158,217,0.25)'
                  e.currentTarget.style.color = '#229ED9'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.color = 'rgba(148,163,184,0.7)'
                }}
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
            </div>
          </div>
        </motion.div>

        {/* ── Alt bar ── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '24px',
          paddingBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            © {new Date().getFullYear()} Mülakat Soruları. Tüm hakları saklıdır.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              >
                Gizlilik Politikası
              </span>
              <span>·</span>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              >
                Kullanım Şartları
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTop}
              aria-label="Yukarı dön"
              style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            >
              <ArrowUp size={15} />
            </motion.button>
          </div>
        </div>

      </div>
    </footer>
  )
}
