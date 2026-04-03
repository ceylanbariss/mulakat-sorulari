import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Eye, Twitter, Linkedin, Calendar } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { optimizeCloudinaryUrl } from '../lib/cloudinary'
import { useAppStore } from '../store/useAppStore'
import { getHaberBySlug, incrementGoruntulenme, haberlerCol, updateDocument, getAll, where } from '../lib/firestore'
import { YorumBolumu } from '../components/haberler/YorumBolumu'
import type { HaberDoc } from '../lib/firestore'
import { Timestamp } from 'firebase/firestore'

const KATEGORI_LABEL: Record<string, string> = {
  'mulakat-ipucu': 'Mülakat İpucu',
  'sektor-haberi': 'Sektör Haberi',
  'platform-guncelleme': 'Platform Güncellemesi',
  'basari-hikayesi': 'Başarı Hikayesi',
}

const KATEGORI_COLOR: Record<string, { bg: string; color: string }> = {
  'mulakat-ipucu': { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
  'sektor-haberi': { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
  'platform-guncelleme': { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  'basari-hikayesi': { bg: 'rgba(236,72,153,0.15)', color: '#f472b6' },
}

function formatDate(ts: unknown): string {
  if (!ts) return ''
  const ms = (ts as { toMillis?: () => number })?.toMillis?.()
  if (!ms) return ''
  return new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}


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

export function HaberDetay() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  const [haber, setHaber] = useState<HaberDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const textColor = d ? '#f1f5f9' : '#0f172a'
  const mutedColor = d ? '#64748b' : '#94a3b8'

  useEffect(() => {
    checkAndActivateScheduled()
  }, [])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getHaberBySlug(slug)
      .then(h => {
        if (!h || h.durum !== 'yayinda') { setNotFound(true); return }
        setHaber(h)
        // Görüntülenme artır
        incrementGoruntulenme(h._id).catch(() => {})
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 100, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (notFound || !haber) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 100, textAlign: 'center', paddingLeft: 16, paddingRight: 16 }}>
        <h2 style={{ color: textColor, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Haber bulunamadı</h2>
        <p style={{ color: mutedColor, marginBottom: 24 }}>Bu haber yayında değil veya silinmiş olabilir.</p>
        <Link to="/haberler" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>← Haberlere dön</Link>
      </div>
    )
  }

  const pageUrl = `${window.location.origin}/haberler/${haber.slug}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(haber.baslik)}&url=${encodeURIComponent(pageUrl)}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`
  const kategoriColor = KATEGORI_COLOR[haber.kategori] ?? { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' }

  const canonicalUrl = `https://mulakatsorulari.com.tr/haberler/${haber.slug}`
  const ogImage = haber.medya?.[0]?.url ?? 'https://mulakatsorulari.com.tr/logo.png'

  return (
    <div style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 64 }}>
      <Helmet>
        <title>{`${haber.baslik} | Mülakat Soruları`}</title>
        <meta name="description" content={haber.ozet || haber.baslik} />
        <meta property="og:title" content={haber.baslik} />
        <meta property="og:description" content={haber.ozet || haber.baslik} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={haber.baslik} />
        <meta name="twitter:description" content={haber.ozet || haber.baslik} />
        <meta name="twitter:image" content={ogImage} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
        {/* Geri butonu */}
        <button
          onClick={() => navigate('/haberler')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', color: mutedColor, fontSize: 13, fontWeight: 600, marginBottom: 24, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#6366f1')}
          onMouseLeave={e => (e.currentTarget.style.color = mutedColor)}
        >
          <ArrowLeft size={16} /> Haberlere Dön
        </button>

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {/* Kategori badge */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: kategoriColor.bg, color: kategoriColor.color }}>
              {KATEGORI_LABEL[haber.kategori] ?? haber.kategori}
            </span>
          </div>

          {/* Başlık */}
          <h1 style={{ color: textColor, fontWeight: 800, fontSize: 28, margin: '0 0 20px', lineHeight: 1.35, letterSpacing: '-0.02em' }}>
            {haber.baslik}
          </h1>

          {/* Meta bilgiler */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 28, paddingBottom: 20, borderBottom: d ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)' }}>
            {/* Yazar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/logo.png" alt="logo" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'contain', background: d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', padding: 2 }} />
              <span style={{ color: d ? '#cbd5e1' : '#334155', fontWeight: 600, fontSize: 13 }}>mulakatsorulari.com.tr</span>
            </div>
            <span style={{ color: mutedColor }}>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: mutedColor, fontSize: 12 }}>
              <Calendar size={12} /> {formatDate(haber.yayinTarihi || haber.olusturmaTarihi)}
            </div>
            {haber.okumaSuresi > 0 && (
              <>
                <span style={{ color: mutedColor }}>·</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: mutedColor, fontSize: 12 }}>
                  <Clock size={12} /> {haber.okumaSuresi} dk okuma
                </div>
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: mutedColor, fontSize: 12 }}>
              <Eye size={12} /> {(haber.goruntulenme ?? 0) + 1} görüntülenme
            </div>
          </div>

          {/* İçerik */}
          <div style={{ marginBottom: 32 }}>
            {haber.medya?.slice(0, 1).map((m, i) => {
              if (m.tip === 'gorsel' || m.tip === 'gif') return (
                <img key={i} src={optimizeCloudinaryUrl(m.url, 1200)} alt={haber.baslik} style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 16, marginBottom: 24 }} />
              )
              return null
            })}

            <style>{`
              .haber-icerik h2 { font-size: 1.4em; font-weight: 700; margin: 1.5em 0 0.5em; color: ${d ? '#f1f5f9' : '#0f172a'}; }
              .haber-icerik h3 { font-size: 1.15em; font-weight: 600; margin: 1.3em 0 0.4em; color: ${d ? '#e2e8f0' : '#1e293b'}; }
              .haber-icerik p { margin: 0 0 1em; line-height: 1.75; color: ${d ? '#cbd5e1' : '#334155'}; font-size: 15px; }
              .haber-icerik ul, .haber-icerik ol { padding-left: 1.5em; margin: 0.5em 0 1em; }
              .haber-icerik li { margin: 0.3em 0; line-height: 1.7; color: ${d ? '#cbd5e1' : '#334155'}; font-size: 15px; }
              .haber-icerik strong { font-weight: 700; color: ${d ? '#f1f5f9' : '#0f172a'}; }
              .haber-icerik em { font-style: italic; }
            `}</style>
            <div
              className="haber-icerik"
              dangerouslySetInnerHTML={{ __html: haber.icerik }}
            />
          </div>

          {/* Diğer medyalar */}
          {haber.medya && haber.medya.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              {haber.medya.map((m, i) => {
                if (i === 0 && (m.tip === 'gorsel' || m.tip === 'gif')) return null // ilk görsel zaten yukarıda
                if (m.tip === 'gorsel' || m.tip === 'gif') {
                  return <img key={i} src={optimizeCloudinaryUrl(m.url, 800)} alt="" style={{ width: '100%', borderRadius: 12, objectFit: 'cover' }} loading="lazy" />
                }
                if (m.tip === 'video-link') {
                  const ytId = m.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/)?.[1]
                  const vimeoId = m.url.match(/vimeo\.com\/(\d+)/)?.[1]
                  const embedUrl = ytId ? `https://www.youtube.com/embed/${ytId}` : vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null
                  if (embedUrl) return (
                    <div key={i} style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden' }}>
                      <iframe src={embedUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen title={`video-${i}`} />
                    </div>
                  )
                }
                if (m.tip === 'video-dosya') {
                  return <video key={i} src={m.url} controls style={{ width: '100%', borderRadius: 12 }} />
                }
                return null
              })}
            </div>
          )}

          {/* Paylaş */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, paddingTop: 20, borderTop: d ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)' }}>
            <span style={{ color: mutedColor, fontSize: 13, fontWeight: 600 }}>Paylaş:</span>
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(29,161,242,0.12)', color: '#1da1f2', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              <Twitter size={14} /> Twitter
            </a>
            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(0,119,181,0.12)', color: '#0077b5', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              <Linkedin size={14} /> LinkedIn
            </a>
          </div>

          {/* Yorumlar */}
          <YorumBolumu haberFirestoreId={haber._id} />
        </motion.article>
      </div>
    </div>
  )
}
