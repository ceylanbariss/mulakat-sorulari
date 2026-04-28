import { useAppStore } from '../store/useAppStore'

export function GizlilikPolitikasi() {
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
        Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni
      </h1>
      <p style={{ fontSize: '14px', color: d ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', marginBottom: '40px' }}>
        (mulakatsorulari.com.tr)
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
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>1. Giriş</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            mulakatsorulari.com.tr platformu (“Platform”) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) ve ilgili mevzuat kapsamında kişisel verilerinizin güvenliğine önem veriyoruz.
            <br /><br />
            Bu Aydınlatma Metni, Platform üzerinden sunulan hizmetlerden faydalanmanız halinde kişisel verilerinizin hangi kapsamda işlendiği, hangi amaçlarla kullanıldığı, kimlere aktarılabileceği ve haklarınız hakkında sizleri bilgilendirmek amacıyla hazırlanmıştır.
            <br /><br />
            Platform’a üye olmanız ve hizmetlerimizi kullanmanız halinde işlenen kişisel verilerinize ilişkin detayları aşağıda bulabilirsiniz.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>2. Veri Sorumlusu</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            Kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu sıfatıyla İsmail Tayşi (Adres: Ankara/İstanbul, info@mulakatsorulari.com.tr) tarafından işlenmektedir.
            <br /><br />
            Platform, veri sorumlusu adına faaliyet gösteren gönüllü ekip üyeleri ve teknik destek sağlayıcılar ile birlikte yürütülmekte olup, bu kişiler yalnızca görevleri kapsamında ve veri sorumlusunun talimatları doğrultusunda hareket etmektedir.
            <br /><br />
            Kişisel verilerinizle ilgili taleplerinizi info@mulakatsorulari.com.tr adresi üzerinden iletebilirsiniz.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>3. Hangi Kişisel Verilerinizi İşliyoruz?</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            Platform’u kullanmanız halinde aşağıdaki kişisel verileriniz işlenebilmektedir:
            <br /><br />
            <strong>3.1 Kullanıcı Hesap ve İletişim Bilgileri</strong><br />
            • Ad, soyad<br />
            • E-posta adresi<br />
            • Telefon numarası<br /><br />
            <strong>3.2 Kullanıcı Tarafından Sağlanan İçerikler</strong><br />
            • Yüklediğiniz CV ve CV içerisinde yer alan tüm bilgiler (örneğin: fotoğraf, adres, eğitim, iş deneyimi vb.)<br />
            • Platform üzerinde oluşturduğunuz CV içerikleri<br />
            • Blog, yorum ve içerik paylaşımlarınız<br /><br />
            <strong>3.3 Mülakat ve Performans Verileri</strong><br />
            • Yapay zeka destekli mülakat simülasyonlarında verdiğiniz yanıtlar<br />
            • Mülakat performans analizleri<br />
            • Başarı ve gelişim değerlendirmeleri<br />
            • Sistem tarafından oluşturulan istatistiksel veriler<br /><br />
            <strong>3.4 İşlem Güvenliği ve Teknik Veriler</strong><br />
            • IP adresi<br />
            • Oturum ve erişim kayıtları<br />
            • Cihaz ve tarayıcı bilgileri<br />
            • Platform kullanım logları<br /><br />
            Kişisel verileriniz, işlendikleri amaçla bağlantılı, sınırlı ve ölçülü olacak şekilde işlenmektedir.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>4. Kişisel Verilerinizin İşlenme Amaçları, Hukuki Sebepleri ve Toplama Yöntemleri</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            Kişisel verileriniz; Platform üzerinden elektronik ortamda, otomatik veya kısmen otomatik yöntemlerle toplanmakta ve aşağıdaki amaçlarla işlenmektedir:
            <br /><br />
            <strong>4.1 Üyelik ve Hesap Yönetimi Süreci</strong><br />
            • <em>İşlenen Veriler:</em> Kullanıcı hesap ve iletişim bilgileri, işlem güvenliği verileri<br />
            • <em>Amaçlar:</em> Üyelik hesabının oluşturulması ve yönetilmesi, Kullanıcı kimlik doğrulama süreçlerinin yürütülmesi, Platform hizmetlerinin sunulması<br />
            • <em>Hukuki Sebep:</em> Sözleşmenin kurulması veya ifası (KVKK md. 5/2-c)<br /><br />
            <strong>4.2 Yapay Zeka Destekli Mülakat ve CV Hizmetleri</strong><br />
            • <em>İşlenen Veriler:</em> CV içerikleri, mülakat cevapları, performans verileri<br />
            • <em>Amaçlar:</em> Yapay zeka destekli mülakat simülasyonlarının gerçekleştirilmesi, CV oluşturma ve analiz süreçlerinin yürütülmesi, Kullanıcıya özel geri bildirim sağlanması, Mülakat performansının analiz edilmesi<br />
            • <em>Not:</em> Kişisel verileriniz, bu kapsamda yapay zeka sistemleri aracılığıyla otomatik olarak analiz edilmekte olup, bu analizler yalnızca kullanıcıya geri bildirim sağlamak amacıyla kullanılmaktadır.<br />
            • <em>Hukuki Sebep:</em> Sözleşmenin ifası ve veri sorumlusunun meşru menfaati (KVKK md. 5/2-c, f)<br /><br />
            <strong>4.3 Platform Geliştirme ve Kullanıcı Deneyimi</strong><br />
            • <em>İşlenen Veriler:</em> Kullanım verileri, teknik veriler, performans verileri<br />
            • <em>Amaçlar:</em> Platform performansının artırılması, Kullanıcı deneyiminin geliştirilmesi, Yeni özelliklerin geliştirilmesi, Analiz ve raporlama faaliyetlerinin yürütülmesi<br />
            • <em>Hukuki Sebep:</em> Meşru menfaat (KVKK md. 5/2-f)<br /><br />
            <strong>4.4 Hukuki Yükümlülüklerin Yerine Getirilmesi</strong><br />
            • <em>İşlenen Veriler:</em> Tüm veri kategorileri<br />
            • <em>Amaçlar:</em> Yetkili kişi, kurum ve kuruluşların taleplerinin karşılanması, Hukuki süreçlerin yürütülmesi, Mevzuata uyum sağlanması<br />
            • <em>Hukuki Sebep:</em> Hukuki yükümlülük (KVKK md. 5/2-ç)<br /><br />
            <strong>4.5 Açık Rızaya Dayalı Süreçler</strong><br />
            • <em>İşlenen Veriler:</em> İletişim bilgileri ve kullanım verileri<br />
            • <em>Amaçlar:</em> Pazarlama, tanıtım ve kampanya faaliyetlerinin yürütülmesi, E-posta ve SMS yoluyla bilgilendirme yapılması<br />
            • <em>Hukuki Sebep:</em> Açık rıza (KVKK md. 5/1)
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>5. Kişisel Verileriniz Kimlere ve Hangi Amaçlarla Aktarılabilir?</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            Kişisel verileriniz, KVKK’nın 8. ve 9. maddelerine uygun olarak aşağıdaki taraflara aktarılabilir:
            <br /><br />
            <strong>5.1 Hizmet Sağlayıcılar ve İş Ortakları</strong><br />
            Mülakat analizi ve CV değerlendirme hizmetlerinin sunulabilmesi amacıyla kişisel verileriniz; yurt dışı merkezli altyapı tedarikçilerimize ve bulut hizmet sağlayıcılarımıza KVKK Madde 9/1 uyarınca açık rızanıza istinaden aktarılmaktadır.<br /><br />
            <strong>5.2 Yetkili Kurum ve Kuruluşlar</strong><br />
            • Mahkemeler<br />
            • Kamu kurumları ve düzenleyici otoriteler<br /><br />
            <strong>5.3 Gelecekteki İş Ortakları (Varsa)</strong><br />
            • Pazarlama ve iletişim hizmet sağlayıcıları
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>6. Kişisel Verilerinizin Saklanması</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            Kişisel verileriniz; üyelik verileri için üyelik süresince ve sona ermesini takiben 10 yıl; IP ve erişim logları için 5651 sayılı Kanun uyarınca 2 yıl; CV ve mülakat verileri için üyelik silindikten sonra 1 yıl süreyle saklanır.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>7. Kişisel Verilerinizin Korunması</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            Platform, kişisel verilerin korunması için gerekli teknik ve idari tedbirleri almaktadır. Bu kapsamda:<br />
            • SSL ve güvenli bağlantı teknolojileri kullanılmaktadır.<br />
            • Yetkisiz erişimlere karşı güvenlik önlemleri uygulanmaktadır.<br />
            • Veri erişimleri sınırlandırılmaktadır.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>8. Haklarınız</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            KVKK’nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:<br />
            • Kişisel verilerinizin işlenip işlenmediğini öğrenme<br />
            • İşlenmişse bilgi talep etme<br />
            • İşlenme amacını öğrenme<br />
            • Aktarıldığı kişileri öğrenme<br />
            • Verilerin düzeltilmesini isteme<br />
            • Silinmesini veya yok edilmesini talep etme<br />
            • Otomatik analizlere itiraz etme<br />
            • Zarara uğramanız halinde tazminat talep etme<br /><br />
            KVKK Madde 11 kapsamındaki haklarınızı kullanmak için info@mulakatsorulari.com.tr adresine 'Veri Sahibi Başvuru Formu' ile başvurabilirsiniz. Talepleriniz kimlik doğrulamasının ardından en geç 30 gün içinde sonuçlandırılacaktır.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>9. İletişim</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            Kişisel verilerinizle ilgili taleplerinizi aşağıdaki iletişim kanalı üzerinden iletebilirsiniz:<br />
            info@mulakatsorulari.com.tr
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: headingColor }}>10. Güncellemeler</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            Bu Aydınlatma Metni, mevzuat değişiklikleri veya Platform ihtiyaçları doğrultusunda güncellenebilir. Güncel versiyon Platform üzerinde yayımlandığı tarihten itibaren geçerli olacaktır.
          </p>
        </div>

        <hr style={{ borderColor: cardBorder, margin: '20px 0' }} />

        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', color: headingColor }}>AÇIK RIZA METNİ</h2>
          <p style={{ fontSize: '15px', lineHeight: 1.7, color: textColor, margin: 0 }}>
            MulakatSorulari.com.tr olarak, kullanıcı deneyiminin geliştirilmesi ve sizlere daha kişiselleştirilmiş bir hizmet sunulabilmesi amacıyla kişisel verilerinizin işlenmesine ilişkin açık rızanıza ihtiyaç duymaktayız.
            <br /><br />
            Açık rızanızın bulunması halinde; platformumuz üzerinden gerçekleştirdiğiniz işlemler, tercih ve ilgi alanlarınıza ilişkin verileriniz doğrultusunda tarafınıza özel içeriklerin sunulması, kullanıcı deneyiminin iyileştirilmesi, hizmetlerimizin geliştirilmesi ve size uygun önerilerde bulunulması amacıyla profil oluşturma, analiz ve segmentasyon faaliyetleri gerçekleştirilecektir.
            <br /><br />
            Bu kapsamda; platform üzerindeki kullanım alışkanlıklarınız, mülakat simülasyonlarında verdiğiniz yanıtlar, oluşturduğunuz içerikler ve etkileşim verileriniz analiz edilerek size özel geri bildirimler, öneriler ve performans değerlendirmeleri sunulacaktır.
            <br /><br />
            Ayrıca, sunulan hizmetlerin bir parçası olarak kişisel verileriniz yapay zekâ sistemleri aracılığıyla otomatik olarak analiz edilebilecek, ancak bu analizler yalnızca hizmetin sunulması, geliştirilmesi ve kullanıcıya özel geri bildirim sağlanması amacıyla kullanılacaktır.
            <br /><br />
            Yapay zeka destekli profilleme faaliyetleri tamamen öneri niteliğinde olup, Üye hakkında otomatik bir karara (işe alım reddi vb.) dayanak oluşturmaz. Üye, bu analiz sonuçlarına her zaman itiraz etme hakkına sahiptir.
            <br /><br />
            Bu süreçlerde kullanılan yapay zekâ ve bulut bilişim hizmetlerinin bir kısmının yurt dışında bulunması nedeniyle kişisel verileriniz, KVKK’nın 9. maddesi uyarınca yurt dışına aktarılabilecektir.
            <br /><br />
            Kişisel verileriniz, yukarıda belirtilen amaçlarla sınırlı olmak üzere, gerekli teknik ve idari güvenlik önlemleri alınarak işlenecek ve yalnızca hizmetin gerektirdiği ölçüde yetkili hizmet sağlayıcılarla paylaşılacaktır.
          </p>
        </div>

      </div>
    </div>
  )
}
