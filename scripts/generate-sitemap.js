/**
 * generate-sitemap.js
 *
 * Firebase JS SDK kullanarak Firestore'dan dinamik içerikleri çeker ve
 * public/sitemap.xml dosyasını günceller.
 *
 * Çalıştırma: node scripts/generate-sitemap.js
 *
 * NOT: subcategories ve questions koleksiyonları için uygulama içinde
 * ayrı bir route tanımlı olmadığından (sadece /sorular/:kategori var),
 * bu koleksiyonlar sitemap'e eklenmez. Her kategori sayfası kendi
 * alt sorularını ve alt kategorilerini barındırır.
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Proje kökündeki .env dosyasını yükle (VITE_ prefix'li değişkenler)
dotenv.config({ path: join(__dirname, '..', '.env') })

const BASE_URL = 'https://mulakatsorulari.com.tr'
const today = new Date().toISOString().split('T')[0]

// ─── Firebase başlat ──────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.projectId) {
  console.error('Hata: VITE_FIREBASE_PROJECT_ID bulunamadı. .env dosyasını kontrol edin.')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

async function fetchAll(colName, ...constraints) {
  const col = collection(db, colName)
  const q = constraints.length ? query(col, ...constraints) : col
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ _id: d.id, ...d.data() }))
}

function toDateStr(firestoreTimestamp) {
  try {
    return firestoreTimestamp?.toDate?.()?.toISOString()?.split('T')[0] ?? today
  } catch {
    return today
  }
}

function urlEntry(loc, changefreq, priority, lastmod = today) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n')
}

// ─── Ana fonksiyon ────────────────────────────────────────────────────────────

async function main() {
  const entries = []

  // Statik sayfalar
  entries.push(urlEntry(`${BASE_URL}/`,            'weekly',  '1.0'))
  entries.push(urlEntry(`${BASE_URL}/sorular`,      'weekly',  '0.9'))
  entries.push(urlEntry(`${BASE_URL}/haberler`,     'daily',   '0.8'))
  entries.push(urlEntry(`${BASE_URL}/mulakat-sim`,  'monthly', '0.7'))
  entries.push(urlEntry(`${BASE_URL}/cv-olustur`,   'monthly', '0.7'))
  entries.push(urlEntry(`${BASE_URL}/istatistikler`, 'monthly', '0.6'))
  entries.push(urlEntry(`${BASE_URL}/hakkimizda`,   'monthly', '0.5'))

  // ── Kategoriler → /sorular/:id ────────────────────────────────────────────
  console.log('Kategoriler çekiliyor...')
  const categories = await fetchAll('categories')
  let catCount = 0
  for (const cat of categories) {
    // Firestore'daki "id" data alanı, yoksa doc ID kullanılır
    const slug = cat.id || cat._id
    if (!slug) continue
    entries.push(urlEntry(
      `${BASE_URL}/sorular/${encodeURIComponent(slug)}`,
      'weekly',
      '0.8',
    ))
    catCount++
  }
  console.log(`  ${catCount} kategori eklendi.`)

  // ── Subcategories → /sorular/:parentSlug/:subSlug ─────────────────────────
  // categoryId alanı, categories koleksiyonundaki id data alanını (slug) saklar.
  // Firestore doc ID'si farklı olabileceğinden güvenli bir map oluşturuyoruz.
  const catSlugMap = {}
  for (const cat of categories) {
    const slug = cat.id || cat._id
    if (slug) catSlugMap[slug] = slug          // id (data field) → slug
    if (cat._id && cat.id) catSlugMap[cat._id] = cat.id  // Firestore doc ID → slug
  }

  console.log('Subcategories çekiliyor...')
  const subcategories = await fetchAll('subcategories')
  let subCount = 0
  for (const sub of subcategories) {
    if (!sub.slug || !sub.categoryId) continue
    const parentSlug = catSlugMap[sub.categoryId]
    if (!parentSlug) continue
    entries.push(urlEntry(
      `${BASE_URL}/sorular/${encodeURIComponent(parentSlug)}/${encodeURIComponent(sub.slug)}`,
      'weekly',
      '0.75',
    ))
    subCount++
  }
  console.log(`  ${subCount} subcategory eklendi.`)

  // ── Haberler → /haberler/:slug (sadece yayında olanlar) ──────────────────
  console.log('Haberler çekiliyor...')
  const haberler = await fetchAll('haberler', where('durum', '==', 'yayinda'))
  let haberCount = 0
  for (const haber of haberler) {
    if (!haber.slug) continue
    const lastmod = toDateStr(haber.guncellenmeTarihi) !== today
      ? toDateStr(haber.guncellenmeTarihi)
      : toDateStr(haber.olusturmaTarihi)
    entries.push(urlEntry(
      `${BASE_URL}/haberler/${encodeURIComponent(haber.slug)}`,
      'weekly',
      '0.7',
      lastmod,
    ))
    haberCount++
  }
  console.log(`  ${haberCount} haber eklendi.`)

  // ── XML oluştur ve yaz ────────────────────────────────────────────────────
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`

  const outPath = join(__dirname, '..', 'public', 'sitemap.xml')
  writeFileSync(outPath, xml, 'utf-8')

  console.log(`\n✓ Sitemap oluşturuldu: ${outPath}`)
  console.log(`  Toplam ${entries.length} URL (${catCount} kategori, ${subCount} subcategory, ${haberCount} haber + statik sayfalar)`)

  process.exit(0)
}

main().catch(err => {
  console.error('\nSitemap oluşturulurken hata:', err.message ?? err)
  process.exit(1)
})
