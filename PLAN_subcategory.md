# Plan: Alt Dal (Subcategory) Sistemi

## Kapsam
İstenen 7 başlığın tamamını kapsıyor. Tek session'da uygulanabilir.

---

## Değiştirilecek / Oluşturulacak Dosyalar

### 1. `src/lib/firestore.ts`
- `subcategoriesCol()` collection reference ekle

### 2. `src/pages/admin/modules/CategoriesModule.tsx`
**CatCard bileşeni:**
- Karta tıklanınca SubcategoryPanel açılsın (düzenle/sil butonları değil, tıklanabilir kart alanı)
- Footer'a "X Soru · Y Alt Dal" badge'i ekle

**CategoriesModule ana bileşeni:**
- `subcountMap: Record<string, number>` state (kategoriye göre alt dal sayısı)
- `selectedCat` state — hangi kategorinin paneli açık
- Firestore'dan subcategory count'ları yükle

**SubcategoryPanel bileşeni (YENİ — aynı dosyada):**
- Sağdan kayan slide-over panel (fixed, z-50, backdrop)
- Başlık: "Yazılım · Alt Dallar", kapat butonu
- "+ Alt Dal Ekle" butonu (sağ üst)
- Alt dal listesi: her item = ad, slug (monospace), soru sayısı, düzenle/sil ikonları
- Silme: o alt dala bağlı soru sayısı varsa uyarı göster
- İlk yüklemede alt dal yoksa "Varsayılan Alt Dalları Ekle" butonu (seed)
- Form modal (add/edit): Ad, Slug (otomatik türetilir), Açıklama, Renk, Sıra

**Slug normalizasyonu:**
```
ğ→g, ü→u, ş→s, ı→i, ö→o, ç→c  (büyük harfler de)
boşluk/& → -   |  özel karakter → kaldır
```

**Seed verisi (SubcategoryPanel içinde sabit):**
- yazilim: Frontend, Backend, Algoritma & Veri Yapıları, Sistem Tasarımı, DevOps, Mobil, Veritabanı
- yapay-zeka: Makine Öğrenmesi, Derin Öğrenme, NLP, MLOps, Prompt Mühendisliği, AI Etiği
- kamu: Genel Kültür, Hukuk Temelleri, Kurum Kültürü, Mülakat Teknikleri
- banka: Finans Temelleri, Risk Yönetimi, Muhasebe, Bankacılık Ürünleri
- ik: Yetkinlik Bazlı Sorular, Davranışsal Sorular, Kariyer Motivasyonu, Liderlik & Yönetim
- vibecoding / vibe-coding: Genel

### 3. `src/pages/admin/modules/QuestionsModule.tsx`
- "Alt Kategori" serbest text input → dinamik `<select>` dropdown
- Kategori seçilince o kategoriye ait subcategory'leri Firestore'dan yükle
- Loading state ekle
- Dropdown: "Seç..." + alt dallar + "Diğer (serbest giriş)" fallback
- **Toplu Alt Dal Ata** butonu (header'a):
  - Modal: filtrele (kategori seç) → alt dal seç → "X soruya uygula" butonu
  - Firestore'da toplu `updateDocument` işlemi

### 4. `src/hooks/useQuestions.ts`
- İkinci opsiyonel parametre: `subcategory?: string`
- `subcategory` varsa where filtresi ekle

### 5. `src/pages/CategoryDetail.tsx` veya Training.tsx
- URL param: `?kategori=yazilim&altdal=frontend`
- Sayfada subcategory seçici: kategori kartları gibi küçük chip'ler (horizontal scroll)
- "Tümü" seçeneği varsayılan

---

## Veri Modeli (Firestore)

```
subcategories/{docId}
  categoryId:  string   (parent kategori ID'si, örn. "yazilim")
  name:        string   (örn. "Frontend")
  slug:        string   (örn. "frontend") — unique within category
  description: string
  color:       string   (hex, parent rengi default)
  orderIndex:  number
  createdAt:   Timestamp

questions/{docId}  (mevcut)
  subcategory: string  — ZATEN VAR (serbest metin → artık slug olacak)
```

---

## Sıralama

1. `firestore.ts` — subcategoriesCol ekle
2. `CategoriesModule.tsx` — SubcategoryPanel + seed + CRUD
3. `QuestionsModule.tsx` — dinamik dropdown + toplu ata
4. `useQuestions.ts` — subcategory filter
5. Training/CategoryDetail — public subcategory filter UI
