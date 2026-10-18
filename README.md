# Mülakat Soruları — Türkçe mülakat hazırlık platformu

[![Canlı](https://img.shields.io/badge/canlı-mulakatsorulari.com.tr-black?style=for-the-badge)](https://mulakatsorulari.com.tr)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/LLM-Gemini_2.5_Flash-8E75B2?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

> *EN: A Turkish interview-prep platform — question bank with three practice modes, an AI mock interviewer that adapts to your CV and the job posting, CV builder with OCR, and an IT career test.*

Türkçe kaynak eksikliği yüzünden adaylar mülakata İngilizce listelerden ya da dağınık forumlardan hazırlanıyor. Mülakat Soruları; yapay zeka, IT, kamu, banka ve İK mülakatları için 5.200'den fazla soruluk bir bankayı, yapay zeka destekli mülakat simülasyonunu ve CV araçlarını tek bir yerde topluyor. Hesap açmadan kullanılabiliyor.

## Modüller

| Modül | Ne yapıyor |
|---|---|
| **Soru bankası** | 5.200+ soru, 5 kategori (Yapay Zeka, IT / Bilişim, Kamu, Banka, İK), 3 antrenman modu: **Flash Card**, **Quiz**, **Yazılı Cevap**. İlerleme ve istatistik takibi. |
| **AI Mülakat Simülasyonu** | Kullanıcı CV'sini ve iş ilanını yükler, mülakat türünü seçer; AI mülakatçı CV'ye ve ilana özel 8 soruluk bir görüşme yürütür, cevaba göre **takip sorusu** sorar. Türkçe ve İngilizce, dil otomatik algılanır. |
| **Mülakat analizi** | Görüşme sonunda her cevap puanlanır; kendini ifade etme, teknik yetkinlik, pozisyon uyumu ve ATS detayları içeren bir rapor üretilir. İngilizce mülakatta dil seviyesi ayrıca değerlendirilir. |
| **CV Oluşturucu** | Sıfırdan ya da mevcut CV'den (PDF/Word, gerekirse **görsel OCR**) CV oluşturma, ilana göre ATS özet optimizasyonu, PDF çıktısı. |
| **IT Kariyer Testi** | İlgi, çalışma stili ve kişilik sorularına göre en uygun IT alanını önerir; sonuçla birlikte öğrenme yolu sunar. |
| **Admin paneli** | Soru, kategori, kullanıcı, duyuru ve haber yönetimi; AI prompt'u ile yeni soru ve senaryo üretimi. |

## Öne çıkan teknik kararlar

- **Uydurmayan CV düzenleme:** CV özet optimizasyonu "yazar değil editör" prompt'uyla çalışır — orijinal metindeki kurum, rol, yıl ve araç adları birebir korunur, sadece ilandaki eksik anahtar kelimeler eklenir (`api/cv-summary.ts`).
- **Kurallı puanlama:** Mülakat analizi serbest bir "skor" yerine açık bir rubrik kullanır (boş cevap 1–3, yüzeysel 5–6, somut örnekli 9–10) ve sonucu yapılandırılmış JSON olarak döndürür (`api/mulakat-analiz.ts`).
- **API anahtarı sunucuda:** Tüm LLM çağrıları Vercel serverless fonksiyonlarında (`api/`) yapılır; anahtar tarayıcıya hiç inmez.
- **SEO ve yasal uyum:** Sitemap, meta/schema etiketleri, KVKK onayları, gizlilik ve kullanım şartları sayfaları.

## Mimari

```
React 19 + Vite (SPA) ──► Firebase Auth + Firestore   (kullanıcı, soru, ilerleme)
        │
        └──► Vercel Serverless (api/)  ──►  Gemini 2.5 Flash
               mulakat · mulakat-analiz · cv-optimize · cv-summary · cv-ocr · generate-item
```

## Proje yapısı

```
api/                  serverless fonksiyonlar (LLM çağrıları)
src/pages/            sayfalar: soru bankası, antrenman, istatistik, IT kariyer testi, admin
src/components/       mulakat-sim, cv-olustur, haberler, UI bileşenleri
src/data/questions/   kategori bazlı soru setleri
src/store/            zustand durum yönetimi
```

## Yerelde çalıştırma

```bash
npm install
cp .env.example .env     # Firebase ve GEMINI_API_KEY değerlerini gir
npm run dev              # arayüz
vercel dev               # api/ fonksiyonlarıyla birlikte çalıştırmak için
```

## Geliştirici

**Barış Ceylan** — [LinkedIn](https://www.linkedin.com/in/bar%C4%B1%C5%9F-ceylan-177296256) · [GitHub](https://github.com/ceylanbariss)
