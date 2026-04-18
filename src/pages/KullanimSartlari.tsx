import { useAppStore } from '../store/useAppStore'

export function KullanimSartlari() {
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  const cardBg = d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
  const cardBorder = d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 80px' }}>
      <h1 style={{
        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        marginBottom: '8px',
        color: d ? '#fff' : '#0f172a',
      }}>
        Kullanım Şartları
      </h1>
      <p style={{ fontSize: '14px', color: d ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', marginBottom: '40px' }}>
        Son güncelleme: Nisan 2026
      </p>

      <div style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: '16px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}>
        {[
          {
            title: '1. Hizmetin Kapsamı',
            text: 'mulakatsorulari.com.tr, mülakat hazırlığı amacıyla soru bankası, antrenman modları ve AI destekli simülasyon sunan ücretsiz bir eğitim platformudur.',
          },
          {
            title: '2. Kullanıcı Sorumlulukları',
            text: 'Platforma kayıt olurken gerçek ve doğru bilgi sağlamanız gerekmektedir. Hesabınızın güvenliğinden siz sorumlusunuz. Platformu yasalara aykırı, zararlı veya başkalarını rahatsız edecek şekillerde kullanamazsınız.',
          },
          {
            title: '3. Fikri Mülkiyet',
            text: 'Sitede yer alan tüm içerikler (sorular, tasarım, yazılım kodu) mulakatsorulari.com.tr\'ye aittir. İçerikler izinsiz kopyalanamaz, dağıtılamaz veya ticari amaçla kullanılamaz.',
          },
          {
            title: '4. Hizmet Kesintileri',
            text: 'Platform bakım, güncelleme veya teknik nedenlerle zaman zaman erişilemez olabilir. Bu durumlardan kaynaklanan kayıplar için sorumluluk kabul edilmez.',
          },
          {
            title: '5. Değişiklikler',
            text: 'Bu kullanım şartları önceden bildirim yapılmaksızın güncellenebilir. Güncel şartları düzenli olarak kontrol etmenizi öneririz.',
          },
          {
            title: '6. İletişim',
            text: 'Kullanım şartlarıyla ilgili sorularınız için iletişim sayfamızdan bize ulaşabilirsiniz.',
          },
        ].map(({ title, text }) => (
          <div key={title}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: d ? '#fff' : '#0f172a' }}>
              {title}
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: d ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', margin: 0 }}>
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
