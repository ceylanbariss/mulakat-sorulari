export interface Egitim {
  platform: string
  baslik: string
  url: string
  ucretsiz: boolean
}

export interface ITAlani {
  id: string
  ad: string
  ikon: string
  renk: string
  aciklama: string
  gucluYonler: string[]
  dikkatEt: string[]
  kariyerYolu: string[]
  unvanlar: string[]
  egitimler: Egitim[]
}

export interface Secenek {
  metin: string
  puanlar: Partial<Record<string, number>>
}

export interface Soru {
  id: number
  soru: string
  secenekler: Secenek[]
}

export const ALAN_KEYS = ['yazilim', 'veri', 'siber', 'ag_sistem', 'proje', 'ux', 'devops', 'destek'] as const

export const IT_ALANLARI: ITAlani[] = [
  {
    id: 'yazilim',
    ad: 'Yazılım Geliştirme',
    ikon: 'Code2',
    renk: '#6366f1',
    aciklama: 'Uygulama, web ve mobil yazılım geliştirme. Mantıksal düşünme ve problem çözme odaklı.',
    gucluYonler: ['Algoritma kurma', 'Bağımsız çalışma', 'Detay odaklılık'],
    dikkatEt: ['Sürekli öğrenme gerektiriyor', 'Sabır isteyen hata ayıklama süreci'],
    kariyerYolu: ['Junior Developer', 'Mid-level Developer', 'Senior Developer', 'Tech Lead / Architect'],
    unvanlar: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer'],
    egitimler: [
      { platform: 'The Odin Project', baslik: 'Foundations Path – Web Geliştirme Temelleri', url: 'https://www.theodinproject.com/', ucretsiz: true },
      { platform: 'freeCodeCamp', baslik: 'Responsive Web Design & JavaScript Algorithms', url: 'https://www.freecodecamp.org/', ucretsiz: true },
      { platform: 'Harvard', baslik: "CS50's Introduction to Computer Science", url: 'https://cs50.harvard.edu/x/', ucretsiz: true },
      { platform: 'Udemy', baslik: 'The Complete Web Developer Bootcamp', url: 'https://www.udemy.com/courses/development/web-development/', ucretsiz: false },
      { platform: 'Coursera', baslik: 'Meta Front-End Developer Professional Certificate', url: 'https://www.coursera.org/professional-certificates/meta-front-end-developer', ucretsiz: false },
    ],
  },
  {
    id: 'veri',
    ad: 'Veri Bilimi / Analitik',
    ikon: 'BarChart3',
    renk: '#06b6d4',
    aciklama: 'Veri toplama, analiz, modelleme ve görselleştirme. İstatistiksel düşünme yetkinliği.',
    gucluYonler: ['Sayısal düşünme', 'Araştırma odaklılık', 'Sabır'],
    dikkatEt: ['İstatistik ve matematik bilgisi şart', 'Büyük veri setleriyle çalışmak yorucu olabilir'],
    kariyerYolu: ['Data Analyst', 'Data Scientist', 'Senior Data Scientist', 'Chief Data Officer'],
    unvanlar: ['Data Analyst', 'Business Intelligence Analyst', 'ML Engineer', 'Data Scientist'],
    egitimler: [
      { platform: 'Kaggle', baslik: 'Intro to Machine Learning & Data Visualization', url: 'https://www.kaggle.com/learn', ucretsiz: true },
      { platform: 'freeCodeCamp', baslik: 'Data Analysis with Python Certification', url: 'https://www.freecodecamp.org/learn/data-analysis-with-python/', ucretsiz: true },
      { platform: 'Google / Coursera', baslik: 'Google Data Analytics Professional Certificate', url: 'https://www.coursera.org/professional-certificates/google-data-analytics', ucretsiz: false },
      { platform: 'DataCamp', baslik: 'Data Scientist with Python Career Track', url: 'https://www.datacamp.com/tracks/data-scientist-with-python', ucretsiz: false },
      { platform: 'Udemy', baslik: 'Python for Data Science and Machine Learning Bootcamp', url: 'https://www.udemy.com/courses/development/data-science/', ucretsiz: false },
    ],
  },
  {
    id: 'siber',
    ad: 'Siber Güvenlik',
    ikon: 'Shield',
    renk: '#ef4444',
    aciklama: 'Sistem ve ağ güvenliği, tehdit analizi, sızma testi. Kural odaklı ve detaycı kişilik.',
    gucluYonler: ['Detay odaklılık', 'Risk farkındalığı', 'Sürekli öğrenme'],
    dikkatEt: ['Sürekli değişen tehdit ortamı', 'Yüksek sorumluluk hissi'],
    kariyerYolu: ['Security Analyst', 'Penetration Tester', 'Security Engineer', 'CISO'],
    unvanlar: ['SOC Analyst', 'Ethical Hacker', 'Security Consultant', 'Incident Responder'],
    egitimler: [
      { platform: 'TryHackMe', baslik: 'Pre-Security & SOC Level 1 Learning Paths', url: 'https://tryhackme.com/', ucretsiz: true },
      { platform: 'YouTube', baslik: 'NetworkChuck – Cybersecurity Başlangıç Serisi', url: 'https://www.youtube.com/@NetworkChuck', ucretsiz: true },
      { platform: 'IBM / Coursera', baslik: 'IBM Cybersecurity Analyst Professional Certificate', url: 'https://www.coursera.org/professional-certificates/ibm-cybersecurity-analyst', ucretsiz: false },
      { platform: 'HackTheBox Academy', baslik: 'Certified Penetration Testing Specialist (CPTS)', url: 'https://academy.hackthebox.com/', ucretsiz: false },
      { platform: 'Udemy', baslik: 'The Complete Cyber Security Course: Hackers Exposed', url: 'https://www.udemy.com/courses/it-and-software/network-and-security/', ucretsiz: false },
    ],
  },
  {
    id: 'ag_sistem',
    ad: 'Sistem / Ağ Yönetimi',
    ikon: 'Network',
    renk: '#f59e0b',
    aciklama: 'Altyapı, sunucu ve ağ kurulumu, yönetimi. Teknik-operasyonel odaklılık.',
    gucluYonler: ['Pratik problem çözme', 'Altyapı düşüncesi', 'Sabır'],
    dikkatEt: ['Saha çalışması gerekebilir', 'Anlık kriz yönetimi baskısı'],
    kariyerYolu: ['Network Technician', 'System Administrator', 'Network Engineer', 'IT Manager'],
    unvanlar: ['System Admin', 'Network Engineer', 'Cloud Infrastructure Engineer'],
    egitimler: [
      { platform: 'Cisco Networking Academy', baslik: 'Introduction to Networks (CCNA Prep)', url: 'https://www.netacad.com/', ucretsiz: true },
      { platform: 'Professor Messer', baslik: 'CompTIA A+ & Network+ Serisi (Ücretsiz)', url: 'https://www.professormesser.com/', ucretsiz: true },
      { platform: 'Microsoft Learn', baslik: 'Windows Server Administration Fundamentals', url: 'https://learn.microsoft.com/en-us/training/', ucretsiz: true },
      { platform: 'Udemy', baslik: 'Complete Networking Fundamentals Course – CCNA Prep', url: 'https://www.udemy.com/courses/it-and-software/network-and-security/', ucretsiz: false },
      { platform: 'Coursera', baslik: 'Google IT Support Professional Certificate', url: 'https://www.coursera.org/professional-certificates/google-it-support', ucretsiz: false },
    ],
  },
  {
    id: 'proje',
    ad: 'IT Proje Yönetimi',
    ikon: 'ClipboardList',
    renk: '#8b5cf6',
    aciklama: 'Proje planlama, ekip koordinasyonu, paydaş yönetimi. İletişim ve organizasyon gücü.',
    gucluYonler: ['İletişim', 'Organizasyon', 'Liderlik'],
    dikkatEt: ['Teknik bilgi az ama gerekli', 'Çakışan öncelikler stres yaratabilir'],
    kariyerYolu: ['Project Coordinator', 'Project Manager', 'Senior PM', 'Program Manager'],
    unvanlar: ['IT Project Manager', 'Scrum Master', 'Agile Coach', 'Product Owner'],
    egitimler: [
      { platform: 'Scrum.org', baslik: 'Professional Scrum Master (PSM I) Hazırlık', url: 'https://www.scrum.org/resources/what-is-scrum', ucretsiz: true },
      { platform: 'YouTube', baslik: 'Agile & Scrum Full Course – Simplilearn', url: 'https://www.youtube.com/@SimplilearnOfficial', ucretsiz: true },
      { platform: 'Google / Coursera', baslik: 'Google Project Management Professional Certificate', url: 'https://www.coursera.org/professional-certificates/google-project-management', ucretsiz: false },
      { platform: 'PMI', baslik: 'PMBOK Guide + PMP Certification', url: 'https://www.pmi.org/learning/library/pmbok-guide', ucretsiz: false },
      { platform: 'Udemy', baslik: 'Agile Project Management 200+ Tools & Frameworks', url: 'https://www.udemy.com/courses/business/project-management/', ucretsiz: false },
    ],
  },
  {
    id: 'ux',
    ad: 'UX/UI Tasarım',
    ikon: 'Palette',
    renk: '#ec4899',
    aciklama: 'Kullanıcı deneyimi ve arayüz tasarımı. Yaratıcılık, empati ve görsel düşünme.',
    gucluYonler: ['Yaratıcılık', 'Empati', 'Görsel düşünme'],
    dikkatEt: ['Sübjektif geri bildirimlerle baş etme', 'Tasarım araçlarını öğrenme süreci'],
    kariyerYolu: ['Junior UX Designer', 'UX Designer', 'Senior UX Designer', 'Design Lead'],
    unvanlar: ['UI Designer', 'UX Researcher', 'Product Designer', 'Interaction Designer'],
    egitimler: [
      { platform: 'YouTube / freeCodeCamp', baslik: 'Figma UI/UX Design Full Course', url: 'https://www.youtube.com/@freecodecamp', ucretsiz: true },
      { platform: 'Nielsen Norman Group', baslik: 'UX Research & Design Articles (Ücretsiz)', url: 'https://www.nngroup.com/articles/', ucretsiz: true },
      { platform: 'Google / Coursera', baslik: 'Google UX Design Professional Certificate', url: 'https://www.coursera.org/professional-certificates/google-ux-design', ucretsiz: false },
      { platform: 'Interaction Design Foundation', baslik: 'UX Design Courses & Certifications', url: 'https://www.interaction-design.org/', ucretsiz: false },
      { platform: 'Udemy', baslik: 'User Experience Design Essentials – Adobe XD & Figma', url: 'https://www.udemy.com/courses/design/user-experience/', ucretsiz: false },
    ],
  },
  {
    id: 'devops',
    ad: 'DevOps / Cloud',
    ikon: 'Cloud',
    renk: '#10b981',
    aciklama: 'CI/CD, otomasyon ve bulut altyapı yönetimi. Teknik ve operasyonel esneklik.',
    gucluYonler: ['Süreç optimizasyonu', 'Otomasyon sevgisi', 'Teknik esneklik'],
    dikkatEt: ['Geniş teknoloji yelpazesi', 'Anlık prodüksiyon sorunları baskısı'],
    kariyerYolu: ['DevOps Engineer', 'Site Reliability Engineer', 'Cloud Architect', 'VP Engineering'],
    unvanlar: ['DevOps Engineer', 'SRE', 'Platform Engineer', 'Cloud Engineer'],
    egitimler: [
      { platform: 'AWS Skill Builder', baslik: 'AWS Cloud Practitioner Essentials', url: 'https://skillbuilder.aws/', ucretsiz: true },
      { platform: 'Google Cloud', baslik: 'Cloud Engineering Learning Path', url: 'https://cloudskillsboost.google/', ucretsiz: true },
      { platform: 'edX / Linux Foundation', baslik: 'Introduction to DevOps and Site Reliability Engineering', url: 'https://www.edx.org/learn/devops', ucretsiz: true },
      { platform: 'Udemy', baslik: 'Docker & Kubernetes: The Practical Guide', url: 'https://www.udemy.com/courses/it-and-software/operating-systems/', ucretsiz: false },
      { platform: 'Coursera', baslik: 'IBM DevOps and Software Engineering Professional Certificate', url: 'https://www.coursera.org/professional-certificates/devops-and-software-engineering', ucretsiz: false },
    ],
  },
  {
    id: 'destek',
    ad: 'IT Destek / Help Desk',
    ikon: 'Headphones',
    renk: '#64748b',
    aciklama: 'Teknik destek ve sorun giderme. Sabır, iletişim ve hızlı çözüm üretme.',
    gucluYonler: ['Empati', 'Hızlı düşünme', 'İnsan odaklılık'],
    dikkatEt: ['Yoğun kullanıcı iletişimi', 'Tekrarlayan sorunlar yorucu olabilir'],
    kariyerYolu: ['Help Desk Technician', 'IT Support Specialist', 'IT Support Lead', 'IT Manager'],
    unvanlar: ['IT Support Specialist', 'Technical Support Engineer', 'Desktop Support'],
    egitimler: [
      { platform: 'Professor Messer', baslik: 'CompTIA A+ Serisi (Ücretsiz)', url: 'https://www.professormesser.com/', ucretsiz: true },
      { platform: 'Microsoft Learn', baslik: 'Microsoft 365 Fundamentals (MS-900)', url: 'https://learn.microsoft.com/en-us/training/', ucretsiz: true },
      { platform: 'Google / Coursera', baslik: 'Google IT Support Professional Certificate', url: 'https://www.coursera.org/professional-certificates/google-it-support', ucretsiz: false },
      { platform: 'CompTIA', baslik: 'CompTIA A+ Certification', url: 'https://www.comptia.org/certifications/a', ucretsiz: false },
      { platform: 'Udemy', baslik: 'The Complete IT Technical Support Course', url: 'https://www.udemy.com/courses/it-and-software/', ucretsiz: false },
    ],
  },
]

export const SORULAR: Soru[] = [
  // Boyut 1: Teknik İlgi
  {
    id: 1,
    soru: 'Boş zamanında aşağıdakilerden hangisini yapmaktan keyif alırsın?',
    secenekler: [
      { metin: 'Uygulama ya da web sitesi yapmak, küçük programlar denemek', puanlar: { yazilim: 3, devops: 1 } },
      { metin: 'Tabloları ve grafikleri incelemek, sayılardan anlam çıkarmak', puanlar: { veri: 3 } },
      { metin: 'Sistemlerin nasıl çalıştığını, güvenlik açıklarını araştırmak', puanlar: { siber: 3 } },
      { metin: 'Ekipman kurmak, ağ bağlantıları düzenlemek, cihaz ayarlamak', puanlar: { ag_sistem: 3, destek: 1 } },
    ],
  },
  {
    id: 2,
    soru: 'Aşağıdakilerden hangisi seni en çok heyecanlandırır?',
    secenekler: [
      { metin: 'Sıfırdan bir uygulama ya da yazılım geliştirmek', puanlar: { yazilim: 3 } },
      { metin: 'Büyük veri setlerinden anlamlı örüntüler ve sonuçlar çıkarmak', puanlar: { veri: 3 } },
      { metin: 'Bir sistemin gizli zayıf noktasını keşfetmek ve raporlamak', puanlar: { siber: 3 } },
      { metin: 'Bulut altyapısı tasarlamak ve otomasyon süreçleri kurmak', puanlar: { devops: 3, ag_sistem: 1 } },
    ],
  },
  {
    id: 3,
    soru: 'Hangi tür içeriği en çok takip edersin?',
    secenekler: [
      { metin: 'Yazılım geliştirme, yeni programlama dilleri ve framework\'ler', puanlar: { yazilim: 3 } },
      { metin: 'Yapay zeka, veri analizi ve istatistik üzerine makaleler', puanlar: { veri: 3 } },
      { metin: 'Siber saldırı haberleri, güvenlik açıkları ve etik hackleme', puanlar: { siber: 3 } },
      { metin: 'Ağ sistemleri, sunucu yönetimi, donanım teknolojileri', puanlar: { ag_sistem: 3 } },
    ],
  },
  {
    id: 4,
    soru: 'IT eğitimi alsaydın hangi konuyu seçerdin?',
    secenekler: [
      { metin: 'Python, JavaScript veya başka bir programlama dili', puanlar: { yazilim: 3 } },
      { metin: 'Veri analizi, makine öğrenmesi ve görselleştirme', puanlar: { veri: 3 } },
      { metin: 'Etik hackleme ve sızma testi teknikleri', puanlar: { siber: 3 } },
      { metin: 'Ağ yönetimi, sunucu kurulumu ve bulut hizmetleri', puanlar: { ag_sistem: 2, devops: 2 } },
    ],
  },
  // Boyut 2: Çalışma Stili
  {
    id: 5,
    soru: 'Nasıl çalışmayı tercih edersin?',
    secenekler: [
      { metin: 'Tek başıma, kendi hızımda, derin odaklanarak', puanlar: { yazilim: 2, veri: 2 } },
      { metin: 'Küçük teknik bir ekiple, sürekli iletişim halinde', puanlar: { devops: 2, yazilim: 1 } },
      { metin: 'Birden fazla ekiple koordineli şekilde, toplantılar yürüterek', puanlar: { proje: 3 } },
      { metin: 'Doğrudan insanlarla, yüz yüze destek vererek', puanlar: { destek: 3, proje: 1 } },
    ],
  },
  {
    id: 6,
    soru: 'Yeni bir projeye başlarken ilk ne yaparsın?',
    secenekler: [
      { metin: 'Hemen bir şeyler yazmaya ya da denemeye başlarım', puanlar: { yazilim: 3 } },
      { metin: 'Mevcut verileri toplar, önce analiz ederim', puanlar: { veri: 3 } },
      { metin: 'Riskleri ve olası sorunları önceden değerlendiririm', puanlar: { siber: 2, proje: 2 } },
      { metin: 'Görevleri listeleyip bir plan ve takvim oluştururum', puanlar: { proje: 3 } },
    ],
  },
  {
    id: 7,
    soru: 'Bir hata ya da sorunla karşılaştığında ne yaparsın?',
    secenekler: [
      { metin: 'Kendi başıma saatlerce araştırır, kökü bulmaya çalışırım', puanlar: { yazilim: 2, siber: 2 } },
      { metin: 'Verilere ve metriklere bakarak nedenini anlamaya çalışırım', puanlar: { veri: 3 } },
      { metin: 'Sistematik test ederim, adım adım doğrularım', puanlar: { devops: 3, ag_sistem: 1 } },
      { metin: 'Ekip arkadaşlarımla birlikte oturur, birlikte çözeriz', puanlar: { proje: 2, destek: 2 } },
    ],
  },
  {
    id: 8,
    soru: 'Hangi çalışma ortamı sana daha uygun gelir?',
    secenekler: [
      { metin: 'Sessiz, kesintisiz ve konsantrasyonun yüksek olduğu ortam', puanlar: { yazilim: 2, veri: 2 } },
      { metin: 'Hızlı tempolu, sürekli değişen, anlık kararlar gerektiren ortam', puanlar: { devops: 3, destek: 1 } },
      { metin: 'Yaratıcılığın ön planda olduğu, estetik ve ilham veren ortam', puanlar: { ux: 3 } },
      { metin: 'Sosyal, yüz yüze iletişimin yoğun olduğu, işbirlikçi ortam', puanlar: { proje: 2, destek: 2 } },
    ],
  },
  // Boyut 3: Problem Türü
  {
    id: 9,
    soru: 'En çok hangi tür problemi çözmek istersin?',
    secenekler: [
      { metin: 'Mantıksal, algoritmik problemler; zor kodlama bulmacaları', puanlar: { yazilim: 3 } },
      { metin: 'İnsanların nasıl düşündüğünü ve ne istediğini anlamak', puanlar: { ux: 3, proje: 1 } },
      { metin: 'Sistemlerdeki gizli tehditleri ve açıkları bulmak', puanlar: { siber: 3 } },
      { metin: 'Sistemlerin neden yavaşladığını ya da çöktüğünü tespit etmek', puanlar: { ag_sistem: 2, devops: 2 } },
    ],
  },
  {
    id: 10,
    soru: 'Seni en çok tatmin eden başarı hangisi?',
    secenekler: [
      { metin: 'Sıfırdan tasarlayıp, test edip yayına aldığım bir yazılım', puanlar: { yazilim: 3 } },
      { metin: 'Verilerden çıkardığım öngörünün önemli bir kararı etkilemesi', puanlar: { veri: 3 } },
      { metin: 'Bir güvenlik açığını kapatmak ya da saldırıyı bertaraf etmek', puanlar: { siber: 3 } },
      { metin: 'Projeyi zamanında ve bütçe dahilinde başarıyla teslim etmek', puanlar: { proje: 3 } },
    ],
  },
  {
    id: 11,
    soru: 'Bir sistem ya da uygulama bozulsa ne yaparsın?',
    secenekler: [
      { metin: 'Kodu satır satır inceler, debug ederim', puanlar: { yazilim: 3 } },
      { metin: 'Log ve metriklere bakarak örüntü ararım', puanlar: { veri: 2, devops: 2 } },
      { metin: 'Güvenlik ihlali var mı diye kontrol ederim', puanlar: { siber: 3 } },
      { metin: 'Altyapı ve ağ bağlantılarını sistematik olarak kontrol ederim', puanlar: { ag_sistem: 3, destek: 1 } },
    ],
  },
  {
    id: 12,
    soru: 'Aşağıdakilerden hangisi seni daha çok motive eder?',
    secenekler: [
      { metin: 'Milyonlarca kullanıcının kullandığı bir yazılımı geliştirmek', puanlar: { yazilim: 3 } },
      { metin: 'Analizinin bir şirkette büyük bir stratejik kararı etkilemesi', puanlar: { veri: 3 } },
      { metin: 'Kritik bir sistemi dışarıdan gelen saldırılara karşı korumak', puanlar: { siber: 3 } },
      { metin: 'Kullanıcıların karşılaştığı sorunları hızla çözüp mutlu etmek', puanlar: { destek: 3, ux: 1 } },
    ],
  },
  // Boyut 4: İletişim Tercihi
  {
    id: 13,
    soru: 'İletişim tarzın nasıl?',
    secenekler: [
      { metin: 'Az konuşur, daha çok üretirim; konuşmak yerine gösteririm', puanlar: { yazilim: 2, veri: 2 } },
      { metin: 'Diyagram ve görsel anlatımla kendimi daha iyi ifade ederim', puanlar: { ux: 3, proje: 1 } },
      { metin: 'Yazılı ve detaylı; her şeyi kayıt altına alırım', puanlar: { veri: 2, siber: 2 } },
      { metin: 'Yüz yüze, anlık ve çözüm odaklı iletişim kurarım', puanlar: { destek: 3, proje: 1 } },
    ],
  },
  {
    id: 14,
    soru: 'Toplantılarda nasıl bir rolde olmayı tercih edersin?',
    secenekler: [
      { metin: 'Arka planda teknik detayları analiz edip sunmak', puanlar: { yazilim: 2, veri: 2 } },
      { metin: 'Toplantıyı yönetmek, herkesin söz almasını sağlamak', puanlar: { proje: 3 } },
      { metin: 'Riskleri ve olası sorunları vurgulamak, uyarılarda bulunmak', puanlar: { siber: 2, ag_sistem: 1 } },
      { metin: 'Kullanıcı deneyimi ve tasarım kararlarını tartışmak', puanlar: { ux: 3 } },
    ],
  },
  {
    id: 15,
    soru: 'Hangi tür belge hazırlamaktan en çok zevk alırsın?',
    secenekler: [
      { metin: 'Teknik dokümantasyon, API kılavuzları, kod yorumları', puanlar: { yazilim: 2, devops: 2 } },
      { metin: 'Veri analizi raporu, dashboard veya sunum', puanlar: { veri: 3 } },
      { metin: 'Güvenlik politikaları, tehdit analizi raporları', puanlar: { siber: 3 } },
      { metin: 'Proje planı, Gantt şeması, sprint backlog', puanlar: { proje: 3 } },
    ],
  },
  {
    id: 16,
    soru: 'Bir kullanıcı ya da müşteri sana geldiğinde ne yaparsın?',
    secenekler: [
      { metin: 'Teknik detayları açıklar, kendi başlarına çözebilmeleri için yönlendiririm', puanlar: { yazilim: 2, veri: 1 } },
      { metin: 'Onları dinler, şema çizerek ya da görsel göstererek anlatırım', puanlar: { ux: 3 } },
      { metin: 'Güvenlik risklerini değerlendiririm, prosedürü eksiksiz uygularım', puanlar: { siber: 2, proje: 1 } },
      { metin: 'Sorunlarını anında çözmeye çalışırım; sabırlı ve yardımseverimdir', puanlar: { destek: 3, proje: 1 } },
    ],
  },
  // Boyut 5: Öğrenme Yöntemi
  {
    id: 17,
    soru: 'Yeni bir teknolojiyle tanıştığında ilk ne yaparsın?',
    secenekler: [
      { metin: 'Hemen bir proje açar, deneyerek yanılarak öğrenirim', puanlar: { yazilim: 3, devops: 2 } },
      { metin: 'Teorisini ve mantığını önce anlamak isterim, sonra uygularım', puanlar: { veri: 3, siber: 1 } },
      { metin: 'Güvenlik açıklarını ve potansiyel riskleri araştırırım', puanlar: { siber: 3 } },
      { metin: 'Dokümantasyonu baştan sona okur, detaylı not alırım', puanlar: { ag_sistem: 2, proje: 2 } },
    ],
  },
  {
    id: 18,
    soru: 'Hangi kitap türü seni daha çok ilgilendirir?',
    secenekler: [
      { metin: 'Algoritmalar, tasarım kalıpları ve yazılım mimarisi', puanlar: { yazilim: 3 } },
      { metin: 'Matematik, istatistik ve veri analizi', puanlar: { veri: 3 } },
      { metin: 'İnsan psikolojisi, davranış bilimleri ve empati', puanlar: { ux: 3, proje: 1 } },
      { metin: 'Kriptografi, sistem güvenliği ve network protokolleri', puanlar: { siber: 3, ag_sistem: 1 } },
    ],
  },
  {
    id: 19,
    soru: 'Hangi kurs formatını tercih edersin?',
    secenekler: [
      { metin: 'Proje tabanlı, sıfırdan bir şey inşa eden kurslar', puanlar: { yazilim: 2, devops: 2 } },
      { metin: 'Video ders + pratik alıştırma egzersizleri kombinasyonu', puanlar: { veri: 2, ux: 2 } },
      { metin: 'Gerçek sistemlerde hands-on lab ve simülasyonlar', puanlar: { siber: 3, ag_sistem: 2 } },
      { metin: 'Grup çalışması, tartışma ve vaka analizi odaklı kurslar', puanlar: { proje: 3, destek: 1 } },
    ],
  },
  {
    id: 20,
    soru: '5 yıl sonra kendinizi nasıl görüyorsunuz?',
    secenekler: [
      { metin: 'Güçlü teknik uzmanlığıyla tanınan bir geliştirici ya da mühendis', puanlar: { yazilim: 3, devops: 2 } },
      { metin: 'Veriyle iş kararlarını etkileyen bir analist ya da bilim insanı', puanlar: { veri: 3 } },
      { metin: 'Ekipleri yöneten, projeleri zamanında teslim eden bir lider', puanlar: { proje: 3, ux: 1 } },
      { metin: 'Organizasyonun dijital güvenliğini sağlayan bir siber güvenlik uzmanı', puanlar: { siber: 3, ag_sistem: 1 } },
    ],
  },
]
