# 🎯 Modül Spesifikasyonu: "Hangi IT Alanına Uygunsun?"

> **mulakatsorulari.com.tr** için yeni bir kariyer değerlendirme modülü.
> Bu dosyayı doğrudan Claude Code'a ver. Adım adım uygula.

---

## 📌 GENEL BİLGİ

| Alan | Detay |
|------|-------|
| Platform | mulakatsorulari.com.tr (Vite + React + Firebase) |
| Modül adı | `it-kariyer-testi` |
| Route | `/it-kariyer-testi` |
| Amaç | Kullanıcının teknik ilgi, çalışma stili ve kişilik profiline göre en uygun IT kariyer alanını önermek |
| Hedef kullanıcı | Yeni mezunlar, kariyer değiştirenler, IT'ye geçmek isteyenler |

---

## 🚫 DOKUNMA KURALLARI

```
- Firebase config, auth ve Firestore kurallarına kesinlikle dokunma
- Mevcut routing yapısını (App.jsx veya router dosyası) boz, sadece yeni route ekle
- Global CSS değişkenlerini, renk paletini ve font tanımlarını değiştirme
- Navbar ve Footer bileşenlerine dokunma
- Diğer modüllerin (mülakat simülatörü, CV builder vb.) kodlarına dokunma
```

---

## 🗂️ DOSYA YAPISI

Aşağıdaki dosyaları oluştur, mevcut hiçbir dosyayı silme:

```
src/
└── pages/
    └── ITKariyerTesti/
        ├── index.jsx              # Ana sayfa (karşılama ekranı)
        ├── QuizPage.jsx           # Soru-cevap ekranı
        ├── ResultPage.jsx         # Sonuç ve kariyer önerisi ekranı
        ├── EgitimPage.jsx         # Eğitim kaynakları ekranı
        ├── it-kariyer-data.js     # Soru havuzu + alan tanımları + eğitim linkleri
        └── it-kariyer-testi.css   # Sadece bu modüle özel stiller
```

---

## 🎨 TASARIM

Sitenin mevcut tasarım dilini kullan:

- **Renk paleti:** Mevcut navy/cyan/purple glassmorphism temasına uygun
- **Arka plan:** Koyu tema (mevcut admin panel ve ana sayfa ile uyumlu)
- **Kartlar:** `backdrop-filter: blur` + yarı saydam arka plan
- **Butonlar:** Mevcut sitedeki primary buton stilini kullan
- **Font:** Sitede halihazırda tanımlı olan font ailesi
- **İkonlar:** `lucide-react` (zaten projede var)
- **Responsive:** Mobil öncelikli, tüm ekranlarda çalışmalı

---

## 📊 VERİ YAPISI (`it-kariyer-data.js`)

### IT Alanları

```js
export const IT_ALANLARI = [
  {
    id: "yazilim",
    ad: "Yazılım Geliştirme",
    ikon: "Code2",            // lucide-react ikon adı
    renk: "#6366f1",
    aciklama: "Uygulama, web ve mobil yazılım geliştirme. Mantıksal düşünme ve problem çözme odaklı.",
    gucluYonler: ["Algoritma kurma", "Bağımsız çalışma", "Detay odaklılık"],
    dikkatEt: ["Sürekli öğrenme gerektiriyor", "Sabır isteyen hata ayıklama süreci"],
    kariyerYolu: ["Junior Developer", "Mid-level Developer", "Senior Developer", "Tech Lead / Architect"],
    unvanlar: ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile Developer"],
    egitimler: [] // aşağıda ayrıca tanımlanacak
  },
  {
    id: "veri",
    ad: "Veri Bilimi / Analitik",
    ikon: "BarChart3",
    renk: "#06b6d4",
    aciklama: "Veri toplama, analiz, modelleme ve görselleştirme. İstatistiksel düşünme yetkinliği.",
    gucluYonler: ["Sayısal düşünme", "Araştırma odaklılık", "Sabır"],
    dikkatEt: ["İstatistik ve matematik bilgisi şart", "Büyük veri setleriyle çalışmak yorucu olabilir"],
    kariyerYolu: ["Data Analyst", "Data Scientist", "Senior Data Scientist", "Chief Data Officer"],
    unvanlar: ["Data Analyst", "Business Intelligence Analyst", "ML Engineer", "Data Scientist"],
    egitimler: []
  },
  {
    id: "siber",
    ad: "Siber Güvenlik",
    ikon: "Shield",
    renk: "#ef4444",
    aciklama: "Sistem ve ağ güvenliği, tehdit analizi, sızma testi. Kural odaklı ve detaycı kişilik.",
    gucluYonler: ["Detay odaklılık", "Risk farkındalığı", "Sürekli öğrenme"],
    dikkatEt: ["Sürekli değişen tehdit ortamı", "Yüksek sorumluluk hissi"],
    kariyerYolu: ["Security Analyst", "Penetration Tester", "Security Engineer", "CISO"],
    unvanlar: ["SOC Analyst", "Ethical Hacker", "Security Consultant", "Incident Responder"],
    egitimler: []
  },
  {
    id: "ag-sistem",
    ad: "Sistem / Ağ Yönetimi",
    ikon: "Network",
    renk: "#f59e0b",
    aciklama: "Altyapı, sunucu ve ağ kurulumu, yönetimi. Teknik-operasyonel odaklılık.",
    gucluYonler: ["Pratik problem çözme", "Altyapı düşüncesi", "Sabır"],
    dikkatEt: ["Saha çalışması gerekebilir", "Anlık kriz yönetimi baskısı"],
    kariyerYolu: ["Network Technician", "System Administrator", "Network Engineer", "IT Manager"],
    unvanlar: ["System Admin", "Network Engineer", "Cloud Infrastructure Engineer"],
    egitimler: []
  },
  {
    id: "proje",
    ad: "IT Proje Yönetimi",
    ikon: "ClipboardList",
    renk: "#8b5cf6",
    aciklama: "Proje planlama, ekip koordinasyonu, paydaş yönetimi. İletişim ve organizasyon gücü.",
    gucluYonler: ["İletişim", "Organizasyon", "Liderlik"],
    dikkatEt: ["Teknik bilgi az ama gerekli", "Çakışan öncelikler stres yaratabilir"],
    kariyerYolu: ["Project Coordinator", "Project Manager", "Senior PM", "Program Manager"],
    unvanlar: ["IT Project Manager", "Scrum Master", "Agile Coach", "Product Owner"],
    egitimler: []
  },
  {
    id: "ux",
    ad: "UX/UI Tasarım",
    ikon: "Palette",
    renk: "#ec4899",
    aciklama: "Kullanıcı deneyimi ve arayüz tasarımı. Yaratıcılık, empati ve görsel düşünme.",
    gucluYonler: ["Yaratıcılık", "Empati", "Görsel düşünme"],
    dikkatEt: ["Sübjektif geri bildirimlerle baş etme", "Tasarım araçlarını öğrenme süreci"],
    kariyerYolu: ["Junior UX Designer", "UX Designer", "Senior UX Designer", "Design Lead"],
    unvanlar: ["UI Designer", "UX Researcher", "Product Designer", "Interaction Designer"],
    egitimler: []
  },
  {
    id: "devops",
    ad: "DevOps / Cloud",
    ikon: "Cloud",
    renk: "#10b981",
    aciklama: "CI/CD, otomasyon ve bulut altyapı yönetimi. Teknik ve operasyonel esneklik.",
    gucluYonler: ["Süreç optimizasyonu", "Otomasyon sevgisi", "Teknik esneklik"],
    dikkatEt: ["Geniş teknoloji yelpazesi", "Anlık prodüksiyon sorunları baskısı"],
    kariyerYolu: ["DevOps Engineer", "Site Reliability Engineer", "Cloud Architect", "VP Engineering"],
    unvanlar: ["DevOps Engineer", "SRE", "Platform Engineer", "Cloud Engineer"],
    egitimler: []
  },
  {
    id: "destek",
    ad: "IT Destek / Help Desk",
    ikon: "Headphones",
    renk: "#64748b",
    aciklama: "Teknik destek ve sorun giderme. Sabır, iletişim ve hızlı çözüm üretme.",
    gucluYonler: ["Empati", "Hızlı düşünme", "İnsan odaklılık"],
    dikkatEt: ["Yoğun kullanıcı iletişimi", "Tekrarlayan sorunlar yorucu olabilir"],
    kariyerYolu: ["Help Desk Technician", "IT Support Specialist", "IT Support Lead", "IT Manager"],
    unvanlar: ["IT Support Specialist", "Technical Support Engineer", "Desktop Support"],
    egitimler: []
  }
];
```

### Eğitim Linkleri (her alan için `egitimler` array'i)

Her alan için en az 3 eğitim objesi ekle, şu formatta:

```js
{
  platform: "Udemy",
  baslik: "The Complete Web Developer Bootcamp",
  url: "https://udemy.com/...",
  ucretsiz: false
}
```

Ücretsiz kaynaklar için (YouTube, freeCodeCamp, CS50 vb.) `ucretsiz: true` yap.

---

### Soru Havuzu

```js
export const SORULAR = [
  {
    id: 1,
    soru: "Boş zamanında aşağıdakilerden hangisini yapmaktan keyif alırsın?",
    secenekler: [
      { metin: "Bir şeyler inşa etmek veya geliştirmek", puanlar: { yazilim: 3, devops: 1 } },
      { metin: "Veri analiz etmek veya grafik çizmek", puanlar: { veri: 3 } },
      { metin: "Bir şeyin nasıl çalıştığını anlamaya çalışmak", puanlar: { siber: 2, ag_sistem: 2 } },
      { metin: "İnsanları organize etmek veya plan yapmak", puanlar: { proje: 3, ux: 1 } }
    ]
  }
  // Toplam 20 soru olacak — aşağıdaki tüm boyutları kapsamalı
];
```

**Soru boyutları (4 soru her boyuttan, toplam 20 soru):**

| Boyut | Açıklama |
|-------|----------|
| Teknik ilgi | Kod, veri, güvenlik, donanım tercihi |
| Çalışma stili | Bağımsız / ekip, yaratıcı / analitik |
| Problem türü | İnsan problemi mi, teknik problem mi |
| İletişim tercihi | Yazılı, sözlü, görsel iletişim |
| Öğrenme yöntemi | Deneyerek, okuyarak, dinleyerek |

**Soru yazım kuralları:**
- Günlük dil kullan, teknik terim yok
- Her şık sadece 1–2 alana puan versin (max 3)
- Hiçbir şık "doğru cevap" izlenimi vermemeli
- Puanlar 1, 2 veya 3 olabilir (güç ağırlığı için)

---

## 🧩 COMPONENT DETAYLARI

### `index.jsx` — Karşılama Ekranı

```
[Logo / İkon]
"Hangi IT Alanına Uygunsun?"
"20 soru, yaklaşık 5 dakika, tamamen kişisel"

[8 IT alanı — ikon + isim kartları olarak göster, tıklanamaz, sadece önizleme]

[CTA Butonu: "Teste Başla →"]
[Alt metin: "Verilen cevaplar kaydedilmez."]
```

### `QuizPage.jsx` — Soru Ekranı

State yapısı:
```js
const [currentIndex, setCurrentIndex] = useState(0);
const [cevaplar, setCevaplar] = useState([]); // seçilen şık indexleri
const [puanlar, setPuanlar] = useState({
  yazilim: 0, veri: 0, siber: 0, ag_sistem: 0,
  proje: 0, ux: 0, devops: 0, destek: 0
});
```

UI:
```
[İlerleme çubuğu: "Soru 5 / 20"]
[Soru metni — büyük, okunaklı]
[4 seçenek — her biri tıklanabilir kart]
  → Seçilince highlight ol, otomatik sonraki soruya geç (300ms bekle)
[Geri butonu — ilk soruda disabled]
```

Puanlama mantığı:
```js
// Şık seçilince:
const secilen = SORULAR[currentIndex].secenekler[sikIndex];
setPuanlar(prev => {
  const yeni = { ...prev };
  Object.entries(secilen.puanlar).forEach(([alan, puan]) => {
    yeni[alan] = (yeni[alan] || 0) + puan;
  });
  return yeni;
});
```

Son soruda "Sonuçları Gör" butonunu göster, tıklayınca `/it-kariyer-testi/sonuc` route'una yönlendir ve puanları state/sessionStorage ile geçir.

### `ResultPage.jsx` — Sonuç Ekranı

```
[Konfeti animasyonu — sadece ilk render'da]

"Senin IT Profilin:"
[1. Alan — büyük kart, alan rengiyle]
  - Alan adı + ikon
  - Uyumluluk yüzdesi (progress bar)
  - Kısa açıklama
  - Güçlü yönler listesi
  - Dikkat et listesi
  - Kariyer yolu (Junior → Lead)

[2. ve 3. alan — daha küçük kartlar]

[Butonlar]
  - "Eğitim Önerilerine Bak →" → EgitimPage
  - "Testi Yeniden Başlat"
  - "Sonucu Paylaş" (URL kopyalama veya Web Share API)
```

Yüzde hesaplama:
```js
const toplamPuan = Object.values(puanlar).reduce((a, b) => a + b, 0);
const yuzdeler = Object.entries(puanlar)
  .map(([id, puan]) => ({ id, yuzde: Math.round((puan / toplamPuan) * 100) }))
  .sort((a, b) => b.yuzde - a.yuzde);
// İlk 3'ü göster
```

### `EgitimPage.jsx` — Eğitim Sayfası

```
[Seçilen alanın adı ve ikonu]
"Bu alanda uzmanlaşmak için önerilen kaynaklar:"

[Ücretsiz kaynaklar — ayrı bölüm]
[Ücretli kurslar — ayrı bölüm]

Her kaynak kartı:
  - Platform logosu (metin olarak)
  - Kurs adı
  - [Kursa Git →] butonu (yeni sekmede açılır)
  - Ücretsiz ise yeşil "Ücretsiz" badge'i

[Diğer alanlar için eğitimleri gör — dropdown veya tab]
```

---

## 🛣️ ROUTING

Mevcut router dosyasına sadece şu route'ları ekle (lazy import ile):

```jsx
import { lazy } from 'react';

const ITKariyerTesti = lazy(() => import('./pages/ITKariyerTesti/index'));
const ITKariyerQuiz = lazy(() => import('./pages/ITKariyerTesti/QuizPage'));
const ITKariyerSonuc = lazy(() => import('./pages/ITKariyerTesti/ResultPage'));
const ITKariyerEgitim = lazy(() => import('./pages/ITKariyerTesti/EgitimPage'));

// Route tanımları:
{ path: "/it-kariyer-testi", element: <ITKariyerTesti /> }
{ path: "/it-kariyer-testi/quiz", element: <ITKariyerQuiz /> }
{ path: "/it-kariyer-testi/sonuc", element: <ITKariyerSonuc /> }
{ path: "/it-kariyer-testi/egitim", element: <ITKariyerEgitim /> }
```

---

## 🔗 NAVBAR ENTEGRASYONU

Mevcut Navbar'daki menüye sadece şu linki ekle:

```
"IT Kariyer Testi" → /it-kariyer-testi
```

Sitenin mevcut menü yapısına ve aktif link stiline uygun şekilde.

---

## 📦 BAĞIMLILIKLAR

Yeni paket kurma. Sadece projede zaten mevcut olanları kullan:

- `react`, `react-router-dom` — routing ve state
- `lucide-react` — ikonlar
- `sessionStorage` — sayfa arası veri geçişi (Firebase'e yazma)

---

## ✅ TAMAMLANMA KRİTERLERİ

Aşağıdakilerin hepsi çalışıyorsa modül tamamdır:

- [ ] `/it-kariyer-testi` route'u açılıyor, karşılama ekranı görünüyor
- [ ] "Teste Başla" tıklanınca quiz başlıyor
- [ ] 20 soru sırayla gösteriliyor, geri alma çalışıyor
- [ ] Son soruda sonuç ekranına geçiş yapılıyor
- [ ] Sonuç ekranında 3 alan yüzde ile sıralanıyor
- [ ] Eğitim sayfasına geçiş çalışıyor, linkler açılıyor
- [ ] Testi yeniden başlat çalışıyor (puanlar sıfırlanıyor)
- [ ] Mobil görünüm bozuk değil
- [ ] Mevcut modüller (simülatör, CV builder vb.) etkilenmemiş

---

## 🔮 MVP SONRASI (şimdi yapma, sadece not)

- Sonuçları Firebase'e kaydetme (kullanıcı girişi varsa)
- Sonuç paylaşım linki (unique URL ile)
- Admin panelinden soru yönetimi
- A/B testi için farklı soru setleri
- Türkiye maaş verileri entegrasyonu (kariyer yolu ekranında)
