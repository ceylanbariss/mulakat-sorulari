import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, ChevronDown } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { useAppStore } from '../store/useAppStore'
import { getHaberler, haberlerCol, updateDocument, getAll, where } from '../lib/firestore'
import { HaberKarti } from '../components/haberler/HaberKarti'
import type { HaberDoc } from '../lib/firestore'
import { Timestamp } from 'firebase/firestore'

type KategoriFilter = 'tumu' | 'mulakat-ipucu' | 'sektor-haberi' | 'platform-guncelleme' | 'basari-hikayesi'
type Siralama = 'yeni' | 'populer'

const KATEGORI_LIST: { key: KategoriFilter; label: string }[] = [
  { key: 'tumu', label: 'Tümü' },
  { key: 'mulakat-ipucu', label: 'Mülakat İpucu' },
  { key: 'sektor-haberi', label: 'Sektör Haberi' },
  { key: 'platform-guncelleme', label: 'Platform Güncellemesi' },
  { key: 'basari-hikayesi', label: 'Başarı Hikayesi' },
]

const PAGE_SIZE = 10

async function checkAndActivateScheduled() {
  try {
    const now = Timestamp.now()
    const items = await getAll<HaberDoc>(haberlerCol(), where('durum', '==', 'zamanlanmis'))
    for (const item of items) {
      const ts = item.yayinTarihi as Timestamp | null
      if (ts && ts.toMillis() <= now.toMillis()) {
        await updateDocument(haberlerCol(), item._id, { durum: 'yayinda' })
      }
    }
  } catch {
    // ignore
  }
}

export function Haberler() {
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  const [haberler, setHaberler] = useState<HaberDoc[]>([])
  const [kategori, setKategori] = useState<KategoriFilter>('tumu')
  const [siralama, setSiralama] = useState<Siralama>('yeni')
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const cardBg = d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)'
  const cardBorder = d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'
  const textColor = d ? '#f1f5f9' : '#0f172a'
  const mutedColor = d ? '#64748b' : '#94a3b8'

  useEffect(() => {
    checkAndActivateScheduled()
  }, [])

  useEffect(() => {
    setOffset(0)
    setHaberler([])
    load(0, true)
  }, [kategori, siralama])

  async function load(fromOffset: number, replace: boolean) {
    if (fromOffset === 0) setLoading(true)
    else setLoadingMore(true)
    try {
      const kat = kategori === 'tumu' ? undefined : kategori
      const items = await getHaberler(kat, PAGE_SIZE + 1, fromOffset, siralama)
      const hasMoreItems = items.length > PAGE_SIZE
      const sliced = items.slice(0, PAGE_SIZE)
      if (replace) setHaberler(sliced)
      else setHaberler(prev => [...prev, ...sliced])
      setHasMore(hasMoreItems)
      setOffset(fromOffset + sliced.length)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 64 }}>
      <Helmet>
        <title>Haberler & Duyurular | Mülakat Soruları</title>
        <meta name="description" content="Yazılım mülakat ipuçları, sektör haberleri, platform güncellemeleri ve başarı hikâyeleri. Kariyerine değer katan içerikler mulakatsorulari.com.tr'de." />
        <meta property="og:title" content="Haberler & Duyurular | Mülakat Soruları" />
        <meta property="og:description" content="Yazılım mülakat ipuçları, sektör haberleri, platform güncellemeleri ve başarı hikâyeleri." />
        <meta property="og:url" content="https://mulakatsorulari.com.tr/haberler" />
        <link rel="canonical" href="https://mulakatsorulari.com.tr/haberler" />
      </Helmet>
      <div style={{ maxWidth: 672, margin: '0 auto', padding: '0 16px' }}>
        {/* Sayfa başlığı */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'rgba(99,102,241,0.15)', marginBottom: 14 }}>
            <Newspaper size={26} style={{ color: '#818cf8' }} />
          </div>
          <h1 style={{ color: textColor, fontWeight: 800, fontSize: 28, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Haberler & Güncellemeler</h1>
          <p style={{ color: mutedColor, fontSize: 14, margin: 0 }}>Mülakat dünyasından en güncel içerikler</p>
        </motion.div>

        {/* Filtre + sıralama */}
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Kategori chip'leri */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {KATEGORI_LIST.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setKategori(key)}
                style={{
                  padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                  background: kategori === key ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : (d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                  color: kategori === key ? '#fff' : (d ? '#94a3b8' : '#475569'),
                  boxShadow: kategori === key ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sıralama */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: mutedColor, fontSize: 12, fontWeight: 600 }}>Sırala:</span>
            {([['yeni', 'En Yeni'], ['populer', 'En Çok Okunan']] as [Siralama, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSiralama(key)}
                style={{
                  padding: '5px 12px', borderRadius: 8, border: `1px solid ${siralama === key ? 'rgba(99,102,241,0.4)' : (d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  background: siralama === key ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: siralama === key ? '#818cf8' : mutedColor,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: mutedColor }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            Haberler yükleniyor...
          </div>
        ) : haberler.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', background: cardBg, border: cardBorder, borderRadius: 18 }}>
            <Newspaper size={40} style={{ color: mutedColor, marginBottom: 12 }} />
            <p style={{ color: mutedColor, fontSize: 15 }}>Bu kategoride henüz haber yok.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {haberler.map((haber, i) => (
              <motion.div
                key={haber._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i < 5 ? i * 0.06 : 0, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <HaberKarti haber={haber} />
              </motion.div>
            ))}

            {/* Daha Fazla Yükle */}
            {hasMore && (
              <div style={{ textAlign: 'center', paddingTop: 16 }}>
                <button
                  onClick={() => load(offset, false)}
                  disabled={loadingMore}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '11px 28px', borderRadius: 10, border: `1px solid ${d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    cursor: loadingMore ? 'wait' : 'pointer',
                    background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    color: d ? '#94a3b8' : '#475569', fontSize: 13, fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                >
                  {loadingMore ? 'Yükleniyor...' : <><ChevronDown size={15} /> Daha Fazla Yükle</>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
