// src/data/careerTestQuestions.ts

export interface AreaScores {
  yazilim: number;
  veri: number;
  siberGuvenlik: number;
  devops: number;
  sistemAg: number;
  uxui: number;
  itDestek: number;
  projeYonetimi: number;
}

export interface CareerTestOption {
  id: string;
  text: string;
  scores: Partial<AreaScores>;
}

export interface CareerTestQuestion {
  id: number;
  question: string;
  options: CareerTestOption[];
}

export const AREA_LABELS: Record<keyof AreaScores, string> = {
  yazilim: "Yazılım Geliştirme",
  veri: "Veri Bilimi / Analitik",
  siberGuvenlik: "Siber Güvenlik",
  devops: "DevOps / Cloud",
  sistemAg: "Sistem / Ağ Yönetimi",
  uxui: "UX/UI Tasarım",
  itDestek: "IT Destek / Help Desk",
  projeYonetimi: "IT Proje Yönetimi",
};

export const AREA_DESCRIPTIONS: Record<keyof AreaScores, string> = {
  yazilim: "Uygulama ve sistem geliştirme, kod yazma ve teknik problem çözme konularında güçlü bir eğilim gösteriyorsun.",
  veri: "Veri analizi, istatistiksel düşünme ve yapay zeka sistemlerini anlama konularında yüksek yakınlık taşıyorsun.",
  siberGuvenlik: "Sistemlerdeki riskleri önceden fark etme, güvenlik açıklarını tespit etme ve koruyucu düşünme biçimin öne çıkıyor.",
  devops: "Altyapı yönetimi, otomasyon süreçleri ve teknik ekip çalışması konularında belirgin bir eğilim var.",
  sistemAg: "Ağ yapıları, sunucu yönetimi ve altyapı sistemlerini anlama konusundaki ilgin güçlü.",
  uxui: "Kullanıcı deneyimi tasarımı, görsel düşünme ve insan-teknoloji etkileşimini anlama konularında öne çıkıyorsun.",
  itDestek: "İnsanlarla hızlı iletişim, teknik sorunları anında çözme ve kullanıcı memnuniyeti odaklı çalışma tarzın belirgin.",
  projeYonetimi: "Süreç yönetimi, ekip koordinasyonu ve projeleri organize etme konularında güçlü bir eğilim taşıyorsun.",
};

export const careerTestQuestions: CareerTestQuestion[] = [
  {
    id: 1,
    question: "Bir teknoloji ürünü ya da uygulama kullandığında en çok hangi durum ilgini çeker?",
    options: [
      {
        id: "1a",
        text: "Nasıl geliştirildiğini ve arka planda nasıl çalıştığını merak ederim.",
        scores: { yazilim: 2, devops: 1 },
      },
      {
        id: "1b",
        text: "İçindeki verilerin nasıl işlendiğini ve analiz edildiğini düşünürüm.",
        scores: { veri: 2, yazilim: 1 },
      },
      {
        id: "1c",
        text: "Güvenli olup olmadığını ve açıklarının bulunup bulunmadığını sorgularım.",
        scores: { siberGuvenlik: 2, sistemAg: 1 },
      },
      {
        id: "1d",
        text: "Cihazların, ağların ve bağlantıların nasıl organize edildiğini incelerim.",
        scores: { sistemAg: 2, devops: 1 },
      },
    ],
  },
  {
    id: 2,
    question: "Bir teknoloji problemiyle karşılaştığında genelde ilk olarak neyi düşünürsün?",
    options: [
      {
        id: "2a",
        text: "Bir çözüm geliştirip sistemi daha kullanışlı hale getirmeyi düşünürüm.",
        scores: { yazilim: 3, uxui: 1 },
      },
      {
        id: "2b",
        text: "Verileri inceleyip problemin neden oluştuğunu analiz etmeye çalışırım.",
        scores: { veri: 3, projeYonetimi: 1 },
      },
      {
        id: "2c",
        text: "Sorunun güvenlik kaynaklı olup olmadığını araştırırım.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
      {
        id: "2d",
        text: "Sistemin altyapısını, bağlantılarını ve otomasyon süreçlerini kontrol ederim.",
        scores: { devops: 3, sistemAg: 1 },
      },
    ],
  },
  {
    id: 3,
    question: "Teknolojiyle ilgili içeriklerde en çok hangi tür paylaşımlar dikkatini çeker?",
    options: [
      {
        id: "3a",
        text: "Yeni uygulamaların nasıl geliştirildiğini ve hangi teknolojilerle üretildiğini incelemek hoşuma gider.",
        scores: { yazilim: 3, devops: 1 },
      },
      {
        id: "3b",
        text: "Verilerden tahmin üretmek, analiz yapmak ve yapay zekâ sistemlerini anlamak ilgimi çeker.",
        scores: { veri: 3, yazilim: 1 },
      },
      {
        id: "3c",
        text: "Sistemlerin nasıl hacklendiğini, güvenlik açıklarının nasıl bulunduğunu araştırırım.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
      {
        id: "3d",
        text: "Sunucuların, ağların ve teknik altyapıların nasıl çalıştığını öğrenmek ilgimi çeker.",
        scores: { sistemAg: 3, devops: 1 },
      },
    ],
  },
  {
    id: 4,
    question: "Teknoloji alanında uzun süre eğitim alacak olsan, en çok hangi konu seni motive ederdi?",
    options: [
      {
        id: "4a",
        text: "Sistemlerdeki güvenlik açıklarını keşfetmeyi ve korunma yöntemlerini öğrenmek isterdim.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
      {
        id: "4b",
        text: "Verileri analiz ederek tahminler üretmek ve yapay zekâ sistemlerini anlamak isterdim.",
        scores: { veri: 3, yazilim: 1 },
      },
      {
        id: "4c",
        text: "Bir fikir üretip onu çalışan bir uygulamaya dönüştürmeyi öğrenmek isterdim.",
        scores: { yazilim: 3, uxui: 1 },
      },
      {
        id: "4d",
        text: "Sunucuların, ağların ve bulut altyapılarının nasıl yönetildiğini öğrenmek isterdim.",
        scores: { devops: 3, sistemAg: 1 },
      },
    ],
  },
  {
    id: 5,
    question: "Bir projede çalışırken seni en rahat ve verimli hissettiren çalışma şekli hangisidir?",
    options: [
      {
        id: "5a",
        text: "Farklı ekipleri organize etmek ve sürecin düzenli ilerlemesini sağlamak bana uygundur.",
        scores: { projeYonetimi: 3, uxui: 1 },
      },
      {
        id: "5b",
        text: "Teknik bir ekiple sürekli fikir alışverişi yaparak ilerlemek hoşuma gider.",
        scores: { devops: 3, sistemAg: 1 },
      },
      {
        id: "5c",
        text: "Tek başıma çalışıp detaylara odaklanabileceğim bir ortamda daha verimli olurum.",
        scores: { yazilim: 3, veri: 1 },
      },
      {
        id: "5d",
        text: "İnsanlarla birebir iletişim kurup sorun çözmek beni motive eder.",
        scores: { itDestek: 3, projeYonetimi: 1 },
      },
    ],
  },
  {
    id: 6,
    question: "Yeni bir teknoloji projesine başladığında genelde ilk yaklaşımın nasıl olur?",
    options: [
      {
        id: "6a",
        text: "Oluşabilecek açıkları, riskleri ve teknik problemleri önceden düşünürüm.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
      {
        id: "6b",
        text: "Karar vermeden önce bilgileri toplar, verileri incelemeyi tercih ederim.",
        scores: { veri: 3, projeYonetimi: 1 },
      },
      {
        id: "6c",
        text: "Fikirleri hızlıca denemeyi ve ortaya çalışan bir şey çıkarmayı severim.",
        scores: { yazilim: 3, uxui: 1 },
      },
      {
        id: "6d",
        text: "İşlerin düzenli ilerlemesi için önce planlama ve görev dağılımı yaparım.",
        scores: { projeYonetimi: 3, devops: 1 },
      },
    ],
  },
  {
    id: 7,
    question: "Bir hata ya da sorunla karşılaştığında genelde nasıl çözüm ararsın?",
    options: [
      {
        id: "7a",
        text: "Sorunun kaynağını kendi başıma araştırıp derinlemesine anlamaya çalışırım.",
        scores: { yazilim: 3, siberGuvenlik: 1 },
      },
      {
        id: "7b",
        text: "Önce verileri, logları ve metrikleri inceleyerek sorunun nedenini anlamaya çalışırım.",
        scores: { veri: 3, devops: 1 },
      },
      {
        id: "7c",
        text: "Ekip arkadaşlarımla birlikte değerlendirip farklı bakış açılarıyla çözüm üretmeyi tercih ederim.",
        scores: { projeYonetimi: 3, itDestek: 1 },
      },
      {
        id: "7d",
        text: "Sorunu adım adım test eder, hangi noktada ortaya çıktığını sistematik şekilde doğrularım.",
        scores: { sistemAg: 3, siberGuvenlik: 1 },
      },
    ],
  },
  {
    id: 8,
    question: "Çalışırken seni en motive eden ortam hangisidir?",
    options: [
      {
        id: "8a",
        text: "Hızlı karar alınan, teknik problemlerin anlık çözüldüğü dinamik ortamlar bana daha uygundur.",
        scores: { siberGuvenlik: 3, devops: 1 },
      },
      {
        id: "8b",
        text: "Yaratıcılığın, görsel düşünmenin ve yeni fikir üretmenin ön planda olduğu ortamlar ilgimi çeker.",
        scores: { uxui: 3, yazilim: 1 },
      },
      {
        id: "8c",
        text: "Derin teknik konulara odaklanabildiğim, detay ve analiz ağırlıklı ortamlar bana daha uygundur.",
        scores: { veri: 3, sistemAg: 1 },
      },
      {
        id: "8d",
        text: "İnsanlarla sürekli iletişimde olduğum, ekip çalışmasının yoğun olduğu ortamlarda daha iyi hissederim.",
        scores: { projeYonetimi: 3, itDestek: 1 },
      },
    ],
  },
  {
    id: 9,
    question: "Seni en çok motive eden problem türü hangisidir?",
    options: [
      {
        id: "9a",
        text: "Sistemlerde fark edilmeyen açıkları, riskleri ve güvenlik sorunlarını keşfetmek isterim.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
      {
        id: "9b",
        text: "Bir sistemin neden yavaşladığını, hata verdiğini veya durduğunu araştırmak bana keyif verir.",
        scores: { devops: 3, sistemAg: 1 },
      },
      {
        id: "9c",
        text: "Zor görünen bir problemi mantık kurarak çözmek ve çalışan bir yapı oluşturmak hoşuma gider.",
        scores: { yazilim: 3, veri: 1 },
      },
      {
        id: "9d",
        text: "İnsanların ihtiyaçlarını anlayıp onların işini kolaylaştıracak çözümler üretmek ilgimi çeker.",
        scores: { uxui: 3, projeYonetimi: 1 },
      },
    ],
  },
  {
    id: 10,
    question: "Bir projeyi tamamladığında seni en çok hangi sonuç tatmin eder?",
    options: [
      {
        id: "10a",
        text: "Kendi geliştirdiğim bir sistemin ya da uygulamanın gerçekten çalıştığını görmek beni motive eder.",
        scores: { yazilim: 3, devops: 1 },
      },
      {
        id: "10b",
        text: "Yaptığım analizlerin önemli kararlar alınmasına katkı sağlaması beni tatmin eder.",
        scores: { veri: 3, projeYonetimi: 1 },
      },
      {
        id: "10c",
        text: "Bir güvenlik problemini tespit edip sistemi daha güvenli hale getirmek bana başarı hissi verir.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
      {
        id: "10d",
        text: "Bir projeyi düzenli şekilde yönetip hedeflenen zamanda başarıyla tamamlamak hoşuma gider.",
        scores: { projeYonetimi: 3, itDestek: 1 },
      },
    ],
  },
  {
    id: 11,
    question: "Beklenmedik bir teknik sorun yaşandığında genelde ilk yaklaşımın nasıl olur?",
    options: [
      {
        id: "11a",
        text: "Sorunun hangi noktada başladığını anlamak için detayları tek tek incelemeye çalışırım.",
        scores: { yazilim: 3, veri: 1 },
      },
      {
        id: "11b",
        text: "Ortaya çıkan verileri, kayıtları ve sistem davranışlarını inceleyerek bir örüntü bulmaya çalışırım.",
        scores: { veri: 3, devops: 1 },
      },
      {
        id: "11c",
        text: "Sorunun dış kaynaklı bir riskten veya beklenmeyen bir müdahaleden kaynaklanıp kaynaklanmadığını düşünürüm.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
      {
        id: "11d",
        text: "Sistemin çalışmasını etkileyen bağlantıları, servisleri ve altyapıyı sırayla kontrol ederim.",
        scores: { sistemAg: 3, devops: 1 },
      },
    ],
  },
  {
    id: 12,
    question: "Teknoloji alanında seni en çok motive eden etki hangisidir?",
    options: [
      {
        id: "12a",
        text: "Geliştirdiğim bir sistemin çok fazla insan tarafından kullanılmasını görmek beni heyecanlandırır.",
        scores: { yazilim: 3, devops: 1 },
      },
      {
        id: "12b",
        text: "Yaptığım analizlerin önemli kararların alınmasına katkı sağlaması beni motive eder.",
        scores: { veri: 3, projeYonetimi: 1 },
      },
      {
        id: "12c",
        text: "Kritik sistemleri koruyup olası tehditleri engellemek bana güçlü bir başarı hissi verir.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
      {
        id: "12d",
        text: "İnsanların yaşadığı teknik sorunları hızlıca çözüp memnuniyet sağlamak hoşuma gider.",
        scores: { itDestek: 3, uxui: 1 },
      },
    ],
  },
  {
    id: 13,
    question: "İnsanlarla iletişim kurarken kendini en doğal nasıl ifade edersin?",
    options: [
      {
        id: "13a",
        text: "Görseller, akışlar ve düzenli anlatımlar kullanınca kendimi daha iyi ifade ederim.",
        scores: { uxui: 3, projeYonetimi: 1 },
      },
      {
        id: "13b",
        text: "Uzun açıklamalar yerine ortaya çıkardığım sonuçlarla kendimi göstermeyi tercih ederim.",
        scores: { yazilim: 3, devops: 1 },
      },
      {
        id: "13c",
        text: "Detaylı yazmak, not almak ve süreci kayıt altında tutmak bana daha güvenli gelir.",
        scores: { siberGuvenlik: 3, veri: 1 },
      },
      {
        id: "13d",
        text: "İnsanlarla hızlı iletişim kurup anlık çözüm üretmek bana daha doğal gelir.",
        scores: { itDestek: 3, projeYonetimi: 1 },
      },
    ],
  },
  {
    id: 14,
    question: "Bir ekip çalışmasında genelde hangi rol sana daha doğal gelir?",
    options: [
      {
        id: "14a",
        text: "Olası riskleri ve gözden kaçabilecek problemleri önceden fark etmeye çalışırım.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
      {
        id: "14b",
        text: "Sürecin düzenli ilerlemesini sağlamak ve ekip içi iletişimi yönetmek bana daha uygundur.",
        scores: { projeYonetimi: 3, itDestek: 1 },
      },
      {
        id: "14c",
        text: "Detayları inceleyip teknik tarafın doğru ilerlediğinden emin olmayı tercih ederim.",
        scores: { yazilim: 3, veri: 1 },
      },
      {
        id: "14d",
        text: "İnsanların ürünü nasıl deneyimleyeceğini ve daha kullanışlı hale nasıl geleceğini düşünürüm.",
        scores: { uxui: 3, yazilim: 1 },
      },
    ],
  },
  {
    id: 15,
    question: "Bir proje üzerinde çalışırken hangi tür içerikleri hazırlamak sana daha doğal gelir?",
    options: [
      {
        id: "15a",
        text: "Teknik detayları açıklayan, sistemin nasıl çalıştığını anlatan içerikler hazırlamayı severim.",
        scores: { yazilim: 3, devops: 1 },
      },
      {
        id: "15b",
        text: "Verileri yorumlayıp görselleştirerek anlamlı sonuçlar sunmak hoşuma gider.",
        scores: { veri: 3, uxui: 1 },
      },
      {
        id: "15c",
        text: "Olası riskleri, açıkları ve dikkat edilmesi gereken noktaları detaylı şekilde belgelemeyi tercih ederim.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
      {
        id: "15d",
        text: "Süreci organize eden planlar, görev akışları ve ekip düzeni oluşturmak bana daha uygundur.",
        scores: { projeYonetimi: 3, itDestek: 1 },
      },
    ],
  },
  {
    id: 16,
    question: "Birisi senden teknik bir konuda yardım istediğinde genelde nasıl yaklaşırsın?",
    options: [
      {
        id: "16a",
        text: "Sorunun mantığını anlatarak kişinin çözümü kendi başına da anlayabilmesini sağlamaya çalışırım.",
        scores: { yazilim: 3, veri: 1 },
      },
      {
        id: "16b",
        text: "Konuyu daha anlaşılır hale getirmek için örnekler, çizimler veya görsel anlatımlar kullanırım.",
        scores: { uxui: 3, projeYonetimi: 1 },
      },
      {
        id: "16c",
        text: "Önce olası riskleri değerlendirir, sürecin güvenli ilerlediğinden emin olurum.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
      {
        id: "16d",
        text: "Karşımdaki kişinin sorununu hızlıca çözüp rahatlamasını sağlamak benim için önceliklidir.",
        scores: { itDestek: 3, projeYonetimi: 1 },
      },
    ],
  },
  {
    id: 17,
    question: "Yeni bir teknolojiyle karşılaştığında öğrenme sürecin genelde nasıl ilerler?",
    options: [
      {
        id: "17a",
        text: "Olası açıkları, güvenlik etkilerini ve riskleri araştırmadan rahat edemem.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
      {
        id: "17b",
        text: "Önce mantığını ve çalışma şeklini anlamak ister, sonra uygulamaya geçerim.",
        scores: { veri: 3, yazilim: 1 },
      },
      {
        id: "17c",
        text: "Doğrudan denemeler yaparak ve ortaya bir şey çıkararak öğrenmeyi tercih ederim.",
        scores: { yazilim: 3, devops: 1 },
      },
      {
        id: "17d",
        text: "Detaylı kaynakları inceleyip düzenli notlar çıkararak ilerlemek bana daha uygun gelir.",
        scores: { projeYonetimi: 3, itDestek: 1 },
      },
    ],
  },
  {
    id: 18,
    question: "Boş zamanlarında seni en çok hangi tür konuların içine çektiğini fark edersin?",
    options: [
      {
        id: "18a",
        text: "Sistemlerin nasıl korunduğunu, güvenliğin nasıl sağlandığını araştırmayı severim.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
      {
        id: "18b",
        text: "Veriler arasındaki ilişkileri keşfetmek ve mantıksal çıkarımlar yapmak ilgimi çeker.",
        scores: { veri: 3, yazilim: 1 },
      },
      {
        id: "18c",
        text: "İnsan davranışlarını anlamak, kullanıcıların nasıl düşündüğünü analiz etmek bana ilginç gelir.",
        scores: { uxui: 3, itDestek: 1 },
      },
      {
        id: "18d",
        text: "Karmaşık sistemlerin nasıl kurulduğunu ve büyük yapıların nasıl çalıştığını öğrenmek hoşuma gider.",
        scores: { yazilim: 3, devops: 1 },
      },
    ],
  },
  {
    id: 19,
    question: "Yeni bir konuda eğitim alırken hangi öğrenme tarzı sana daha uygun gelir?",
    options: [
      {
        id: "19a",
        text: "Ortaya gerçek bir ürün ya da proje çıkarabildiğim uygulamalı eğitimler beni daha çok motive eder.",
        scores: { yazilim: 3, devops: 1 },
      },
      {
        id: "19b",
        text: "Konuyu önce anlatımlarla anlayıp ardından pratik yaparak ilerlemek bana daha verimli gelir.",
        scores: { veri: 3, uxui: 1 },
      },
      {
        id: "19c",
        text: "Gerçek senaryolar üzerinde test yapabildiğim uygulamalı ortamlar ilgimi daha çok çeker.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
      {
        id: "19d",
        text: "İnsanlarla fikir alışverişi yapabildiğim, birlikte çözüm üretilen eğitim ortamlarını tercih ederim.",
        scores: { projeYonetimi: 3, itDestek: 1 },
      },
    ],
  },
  {
    id: 20,
    question: "Gelecekte teknoloji alanında nasıl bir etki bırakmak istediğini düşünüyorsun?",
    options: [
      {
        id: "20a",
        text: "Ürettiği sistemler ve teknik yetkinliğiyle insanların güvendiği biri olmak isterim.",
        scores: { yazilim: 3, devops: 1 },
      },
      {
        id: "20b",
        text: "Verilerden doğru çıkarımlar yaparak önemli kararların alınmasına katkı sağlamak isterim.",
        scores: { veri: 3, projeYonetimi: 1 },
      },
      {
        id: "20c",
        text: "İnsanları organize eden, ekipleri yönlendiren ve süreçleri başarıyla yöneten biri olmak isterim.",
        scores: { projeYonetimi: 3, itDestek: 1 },
      },
      {
        id: "20d",
        text: "Sistemleri koruyan, riskleri önceden fark eden ve güvenliği sağlayan biri olmak isterim.",
        scores: { siberGuvenlik: 3, sistemAg: 1 },
      },
    ],
  },
];
