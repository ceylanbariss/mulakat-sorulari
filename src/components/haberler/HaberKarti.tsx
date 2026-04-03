import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, MessageSquare, Share2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { optimizeCloudinaryUrl } from '../../lib/cloudinary'
import { useAppStore } from '../../store/useAppStore'
import type { HaberDoc } from '../../lib/firestore'

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
  const now = Date.now()
  const diff = now - ms
  if (diff < 60_000) return 'Az önce'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} dk önce`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} sa önce`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} gün önce`
  return new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

interface HaberKartiProps {
  haber: HaberDoc
  yorumSayisi?: number
}

export function HaberKarti({ haber, yorumSayisi = 0 }: HaberKartiProps) {
  const navigate = useNavigate()
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)

  const cardBg = d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.92)'
  const cardBorder = d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const cardBorderHover = d ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.25)'
  const textColor = d ? '#f1f5f9' : '#0f172a'
  const mutedColor = d ? '#64748b' : '#94a3b8'
  const subText = d ? '#94a3b8' : '#475569'

  const kategoriColor = KATEGORI_COLOR[haber.kategori] ?? { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' }
  const kapakGorsel = haber.medya?.find(m => m.tip === 'gorsel' || m.tip === 'gif')

  const postText = haber.tip === 'post' ? stripHtml(haber.icerik) : ''
  const MAX_POST_CHARS = 240
  const isLongPost = postText.length > MAX_POST_CHARS

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation()
    if (navigator.share) {
      navigator.share({ title: haber.baslik, url: `${window.location.origin}/haberler/${haber.slug}` }).catch(() => {})
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/haberler/${haber.slug}`)
    }
  }

  return (
    <div
      onClick={() => navigate(`/haberler/${haber.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: cardBg,
        border: `1px solid ${hovered ? cardBorderHover : cardBorder}`,
        borderRadius: 18,
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? (d ? '0 8px 32px rgba(99,102,241,0.12)' : '0 8px 32px rgba(0,0,0,0.08)') : '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* Üst: yazar + tarih + kategori */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
          {initials(haber.yazar)}
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ color: textColor, fontWeight: 600, fontSize: 13 }}>{haber.yazar}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: mutedColor, fontSize: 11 }}>{formatDate(haber.olusturmaTarihi)}</span>
            {haber.okumaSuresi > 0 && haber.tip === 'makale' && (
              <>
                <span style={{ color: mutedColor, fontSize: 11 }}>·</span>
                <Clock size={10} style={{ color: mutedColor }} />
                <span style={{ color: mutedColor, fontSize: 11 }}>{haber.okumaSuresi} dk okuma</span>
              </>
            )}
          </div>
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: kategoriColor.bg, color: kategoriColor.color, flexShrink: 0 }}>
          {KATEGORI_LABEL[haber.kategori] ?? haber.kategori}
        </span>
      </div>

      {/* İçerik: makale vs post */}
      {haber.tip === 'makale' ? (
        <div>
          <h2 style={{ color: textColor, fontWeight: 700, fontSize: 17, margin: '0 0 8px', lineHeight: 1.4 }}>{haber.baslik}</h2>
          {haber.ozet && <p style={{ color: subText, fontSize: 14, margin: '0 0 12px', lineHeight: 1.6 }}>{haber.ozet}</p>}
          {kapakGorsel && (
            <img
              src={optimizeCloudinaryUrl(kapakGorsel.url, 400)}
              alt={haber.baslik}
              style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }}
              loading="lazy"
            />
          )}
        </div>
      ) : (
        <div>
          <p style={{ color: subText, fontSize: 14, lineHeight: 1.7, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>
            {!isLongPost || expanded ? postText : postText.slice(0, MAX_POST_CHARS) + '...'}
          </p>
          {isLongPost && (
            <button
              onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: 13, fontWeight: 600, padding: '2px 0', marginBottom: 8 }}
            >
              {expanded ? <><ChevronUp size={14} /> Daha az göster</> : <><ChevronDown size={14} /> Devamını oku</>}
            </button>
          )}
          {kapakGorsel && (
            <img
              src={optimizeCloudinaryUrl(kapakGorsel.url, 400)}
              alt=""
              style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 12, marginBottom: 8 }}
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Alt: istatistikler + paylaş */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 10, borderTop: `1px solid ${d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: mutedColor, fontSize: 12 }}>
          <Eye size={13} /> {haber.goruntulenme ?? 0}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: mutedColor, fontSize: 12 }}>
          <MessageSquare size={13} /> {yorumSayisi}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleShare}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: mutedColor, fontSize: 12, transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6366f1'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = mutedColor; (e.currentTarget as HTMLButtonElement).style.background = d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
        >
          <Share2 size={13} /> Paylaş
        </button>
      </div>
    </div>
  )
}
