import { useAppStore } from '../store/useAppStore'

export function GizlilikPolitikasi() {
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
        Gizlilik Politikası
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
            title: '1. Toplanan Veriler',
            text: 'Sitemize kayıt olduğunuzda e-posta adresiniz ve şifreniz (şifreli biçimde) Firebase Authentication aracılığıyla saklanır. Antrenman istatistikleriniz ve tercihleriniz Firestore veritabanında kullanıcı hesabınıza bağlı olarak tutulur.',
          },
          {
            title: '2. Verilerin Kullanımı',
            text: 'Toplanan veriler yalnızca size kişiselleştirilmiş bir deneyim sunmak (istatistik takibi, ilerleme kaydı vb.) amacıyla kullanılır. Verileriniz üçüncü taraflarla satılmaz veya reklam amacıyla paylaşılmaz.',
          },
          {
            title: '3. Çerezler',
            text: 'Oturum yönetimi için zorunlu çerezler kullanılmaktadır. Analitik amaçlı Vercel Analytics anonim kullanım verileri toplayabilir.',
          },
          {
            title: '4. Veri Güvenliği',
            text: 'Verileriniz Google Firebase altyapısında şifreli olarak saklanmaktadır. Şifreler hiçbir zaman düz metin olarak tutulmaz.',
          },
          {
            title: '5. İletişim',
            text: 'Gizlilik politikasıyla ilgili sorularınız için iletişim sayfamızdan bize ulaşabilirsiniz.',
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
