# 🔧 IT Kariyer Testi — Refactor Görevi

Mevcut modülde (`src/pages/ITKariyerTesti/`) 3 iyileştirme yapacaksın.
Her maddeyi sırayla uygula. **Başka hiçbir dosyaya dokunma.**

---

## 🚫 DOKUNMA KURALLARI

```
- Firebase, auth, Firestore kurallarına kesinlikle dokunma
- Diğer modüllerin (simülatör, CV builder vb.) kodlarına dokunma
- App.tsx routing yapısını bozma, sadece ilgili import düzelt
- Navbar.tsx'e dokunma
- Global CSS değişkenlerine dokunma
```

---

## Görev 1 — İkon Mapping Refactor (Tree-Shaking)

**Problem:** `import * as LucideIcons from 'lucide-react'` kullanımı Vite'ın tree-shaking'ini engelliyor, bundle şişiyor.

**Yapılacak:**

`src/pages/ITKariyerTesti/it-kariyer-data.ts` içinde (veya aynı klasörde yeni `ikon-map.ts` dosyası oluşturarak) şu yapıyı ekle:

```ts
import {
  Code2, BarChart3, Shield, Network,
  ClipboardList, Palette, Cloud, Headphones
} from 'lucide-react';

export const IKON_MAP: Record<string, React.ElementType> = {
  Code2,
  BarChart3,
  Shield,
  Network,
  ClipboardList,
  Palette,
  Cloud,
  Headphones,
};
```

Ardından modül içinde `LucideIcons[alan.ikon]` şeklinde erişilen tüm yerleri `IKON_MAP[alan.ikon]` olarak güncelle.

`import * as LucideIcons from 'lucide-react'` satırını tamamen sil.

---

## Görev 2 — SessionStorage Try-Catch Koruması

**Problem:** `ResultPage` içinde `sessionStorage.getItem('it_kariyer_puanlar')` doğrudan parse ediliyor. Bozuk veya eksik session varsa `.reduce` gibi işlemler React çökmesine sebep oluyor.

**Yapılacak:**

`ResultPage.tsx` içindeki sessionStorage okuma bloğunu şu şekilde güncelle:

```ts
const getPuanlar = (): Record<string, number> => {
  try {
    const raw = sessionStorage.getItem('it_kariyer_puanlar');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Temel format doğrulaması: obje mi ve değerleri sayı mı
    if (typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const dogrulandi = Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => typeof v === 'number')
    );
    return dogrulandi;
  } catch {
    return {};
  }
};
```

`getPuanlar()` boş obje döndürürse kullanıcıyı `/it-kariyer-testi` route'una yönlendir:

```ts
const puanlar = getPuanlar();
if (Object.keys(puanlar).length === 0) {
  navigate('/it-kariyer-testi');
  return null;
}
```

---

## Görev 3 — Framer Motion Soru Geçiş Animasyonu

**Problem:** Sorular arasında geçişte animasyon yok, kullanıcı deneyimi kuru hissettiriyor.

**Bilgi:** `framer-motion` projede zaten yüklü ve `App.tsx`'te kullanılıyor. Yeni paket kurma.

**Yapılacak:**

`QuizPage.tsx` içinde soru kartını (`<div>` veya mevcut wrapper'ı) `motion.div` ile sar:

```tsx
import { AnimatePresence, motion } from 'framer-motion';

// Soru render bloğunu şu şekilde güncelle:
<AnimatePresence mode="wait">
  <motion.div
    key={currentIndex}
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -40 }}
    transition={{ duration: 0.25, ease: 'easeInOut' }}
  >
    {/* mevcut soru ve şık içeriği */}
  </motion.div>
</AnimatePresence>
```

`key={currentIndex}` kritik — her soru değişiminde AnimatePresence yeni bir element olarak algılar.

Şık kartlarına ayrıca staggered giriş ekle (opsiyonel, yapabilirsen):

```tsx
<motion.div
  key={`secenekler-${currentIndex}`}
  variants={{
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } }
  }}
  initial="hidden"
  animate="show"
>
  {secenekler.map((s, i) => (
    <motion.button
      key={i}
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0 }
      }}
      // mevcut onClick ve className'ler korunacak
    >
      {s.metin}
    </motion.button>
  ))}
</motion.div>
```

---

## ✅ Tamamlanma Kriterleri

- [ ] `import * as LucideIcons` satırı hiçbir dosyada kalmadı
- [ ] İkonlar `IKON_MAP` üzerinden geliyor, ekranda doğru görünüyor
- [ ] ResultPage bozuk session'da çökmüyor, ana sayfaya yönlendiriyor
- [ ] Quiz ekranında sorular arası geçişte 250ms animasyon var
- [ ] Şıklar staggered olarak sırayla beliriyor
- [ ] Diğer modüller ve sayfalar etkilenmemiş
