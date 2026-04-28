import { useAppStore } from '../store/useAppStore'

export function KullanimSartlari() {
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  const cardBg = d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
  const cardBorder = d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textColor = d ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
  const headingColor = d ? '#fff' : '#0f172a'

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 80px' }}>
      <h1 style={{
        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        marginBottom: '8px',
        color: headingColor,
      }}>
        MülakatSoruları.com.tr Üyelik Sözleşmesi
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
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>1. Taraflar</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            1.1. İşbu Üyelik Sözleşmesi (“Sözleşme”), MülakatSoruları.com.tr (“Site”) ile Site’ye üye olan gerçek kişiler (“Üye”) arasında akdedilmiştir.
            <br />
            1.2. Üye, Site’ye üye olarak Site’den sunulan içeriklerden faydalanmak, bilgi paylaşmak ve Site’nin özelliklerini kullanmak istemektedir.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>2. Üyelik Koşulları</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            2.1. Üye, Site’ye üye olabilmek için doğru ve güncel bilgiler sağlamakla yükümlüdür. Yanlış veya yanıltıcı bilgi veren Üye, doğabilecek tüm sonuçlardan sorumludur.
            <br />
            2.2. Üyelik yalnızca 18 yaşını doldurmuş gerçek kişiler için geçerlidir.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>3. Site’nin Kullanım Hak ve Yükümlülükleri</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            3.1. Site, kullanıcılarına ücretsiz bilgi ve içerik sunar; ücretli hizmet yoktur.
            <br />
            3.2. Platform tarafından sunulan yapay zeka analizleri, algoritmik bir tahminleme olup kesinlik içermez. Bu analizlere dayanarak alınan kararlardan (mülakat başarısızlığı, maddi/manevi kayıplar vb.) Platform hiçbir şekilde sorumlu tutulamaz; içerikler profesyonel danışmanlık mahiyetinde değildir.
            <br />
            3.3. Site, teknik nedenlerle erişimde meydana gelebilecek aksaklıklar, hatalar veya kesintilerden sorumlu değildir.
            <br />
            3.4. Platform, kullanıcı deneyimini iyileştirmek amacıyla çerezler kullanmaktadır. Çerezler aracılığıyla işlenen veriler hakkında detaylı bilgiye Çerez Politikası'ndan ulaşabilirsiniz.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>4. Üye’nin Yükümlülükleri</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            4.1. Üye, Site’yi hukuka ve genel ahlak kurallarına uygun olarak kullanacağını kabul eder.
            <br />
            4.2. Üye, Site’deki içerikleri izinsiz kopyalayamaz, dağıtamaz veya üçüncü taraflarla ticari amaçla paylaşamaz.
            <br />
            4.3. Üye, Site’ye zarar verecek yazılım, virüs, bot veya otomatik sistem kullanamaz.
            <br />
            4.4. Üye, diğer üyelerin hesaplarını izinsiz kullanamaz ve başka bir kişi adına işlem yapamaz.
            <br />
            4.5. Üye, sisteme yüklediği CV veya belgelerde yer alan üçüncü kişilere (referans, aile bireyi vb.) ait kişisel veriler için ilgili kişilerden KVKK kapsamında gerekli izinleri aldığını, aksine bir durumda tüm sorumluluğun kendisine ait olduğunu beyan ve taahhüt eder.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>5. Sözleşmenin Feshi</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            5.1. Üye, istediği zaman üyeliğini sonlandırabilir.
            <br />
            5.2. Site, Üye’nin Sözleşme hükümlerini ihlal etmesi durumunda üyeliği askıya alma veya sonlandırma hakkına sahiptir.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>6. Gizlilik ve Kişisel Veriler</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            6.1. Site, üyelerin kişisel verilerini 6698 sayılı KVKK ve ilgili mevzuata uygun olarak işleyecektir.
            <br />
            6.2. Kişisel verilerin işlenmesine ilişkin detaylı bilgi için Üye, Açık Rıza ve Aydınlatma Metnini inceleyebilir ve onaylayabilir.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>7. Üyelik Onayı</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            7.1. Üye, Site’ye üye olurken, gerekli kutucuğu işaretleyerek Sözleşme’yi kabul eder.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>8. Yetkili Mahkeme</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            İşbu sözleşmeden doğacak uyuşmazlıklarda [Bilecik/Ankara] Mahkemeleri ve İcra Daireleri yetkilidir.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>9. Fikri Mülkiyet</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            Platform içerisinde yer alan tüm yazılım, tasarım, mülakat soruları veri tabanı ve yapay zeka çıktı formatları MülakatSoruları.com.tr’nin fikri mülkiyetindedir. Üye, bu içerikleri ticari amaçla kopyalayamaz veya dağıtamaz.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>10. Veri İhlali Bildirimi</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            İşlenen kişisel verilerin kanuni olmayan yollarla başkaları tarafından elde edilmesi hâlinde, Platform bu durumu en kısa sürede (72 saat içerisinde) ilgili kişiye ve Kişisel Verileri Koruma Kurulu’na bildirir.
          </p>
        </div>

      </div>
    </div>
  )
}
