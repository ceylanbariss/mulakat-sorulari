import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Newspaper, ArrowRight, Clock, Eye } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { getAll, haberlerCol, where } from '../../lib/firestore'
import type { HaberDoc } from '../../lib/firestore'

const KATEGORI_COLOR: Record<string, { bg: string; color: string }> = {
  'mulakat-ipucu': { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
  'sektor-haberi': { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
  'platform-guncelleme': { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  'basari-hikayesi': { bg: 'rgba(236,72,153,0.15)', color: '#f472b6' },
}

const KATEGORI_LABEL: Record<string, string> = {
  'mulakat-ipucu': 'Mülakat İpucu',
  'sektor-haberi': 'Sektör Haberi',
  'platform-guncelleme': 'Platform',
  'basari-hikayesi': 'Başarı Hikayesi',
}

function formatDate(ts: unknown): string {
  if (!ts) return ''
  const ms = (ts as { toMillis?: () => number })?.toMillis?.()
  if (!ms) return ''
  const diff = Date.now() - ms
  if (diff < 86_400_000) return 'Bugün'
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} gün önce`
  return new Date(ms).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

const CARD_VAR = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } }),
}

export function OneCikanHaberler() {
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'
  const navigate = useNavigate()
  const [haberler, setHaberler] = useState<HaberDoc[]>([])

  useEffect(() => {
    getAll<HaberDoc>(haberlerCol(), where('oneCikar', '==', true), where('durum', '==', 'yayinda'))
      .then(items => {
        const sorted = (items as HaberDoc[]).sort((a, b) => {
          const ta = (a.olusturmaTarihi as { toMillis?: () => number })?.toMillis?.() ?? 0
          const tb = (b.olusturmaTarihi as { toMillis?: () => number })?.toMillis?.() ?? 0
          return tb - ta
        })
        setHaberler(sorted.slice(0, 3))
      })
      .catch(() => {})
  }, [])

  if (haberler.length === 0) return null

  const textColor = d ? '#f1f5f9' : '#0f172a'
  const mutedColor = d ? '#64748b' : '#94a3b8'
  const cardBg = d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.85)'
  const cardBorder = d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'

  return (
    <section style={{ padding: '80px 0' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
        {/* Başlık */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.45 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Newspaper size={20} style={{ color: '#818cf8' }} />
            </div>
            <div>
              <h2 style={{ color: textColor, fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: '-0.01em' }}>Öne Çıkan Haberler</h2>
              <p style={{ color: mutedColor, fontSize: 13, margin: '2px 0 0' }}>Güncel içerikler ve duyurular</p>
            </div>
          </div>
          <Link
            to="/haberler"
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6366f1', textDecoration: 'none', fontSize: 13, fontWeight: 700, transition: 'gap 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.gap = '10px' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.gap = '6px' }}
          >
            Tüm Haberler <ArrowRight size={15} />
          </Link>
        </motion.div>

        {/* Kart grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {haberler.map((haber, i) => {
            const kat = KATEGORI_COLOR[haber.kategori] ?? { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' }
            const kapak = haber.medya?.find(m => m.tip === 'gorsel' || m.tip === 'gif')
            const ozet = haber.ozet || (haber.tip === 'post' ? stripHtml(haber.icerik).slice(0, 120) + '...' : '')

            return (
              <motion.div
                key={haber._id}
                custom={i}
                variants={CARD_VAR}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                onClick={() => navigate(`/haberler/${haber.slug}`)}
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 18,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = d ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.25)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(99,102,241,0.12)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = cardBorder
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }}
              >
                {/* Kapak görseli */}
                {kapak && (
                  <div style={{ height: 160, overflow: 'hidden' }}>
                    <img src={kapak.url} alt={haber.baslik} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} loading="lazy" />
                  </div>
                )}

                <div style={{ padding: 18 }}>
                  {/* Kategori badge */}
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: kat.bg, color: kat.color, display: 'inline-block', marginBottom: 10 }}>
                    {KATEGORI_LABEL[haber.kategori] ?? haber.kategori}
                  </span>

                  {/* Başlık */}
                  <h3 style={{ color: textColor, fontWeight: 700, fontSize: 15, margin: '0 0 8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {haber.baslik}
                  </h3>

                  {/* Özet */}
                  {ozet && (
                    <p style={{ color: mutedColor, fontSize: 13, margin: '0 0 12px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ozet}
                    </p>
                  )}

                  {/* Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: mutedColor, fontSize: 11 }}>{formatDate(haber.olusturmaTarihi)}</span>
                    {haber.okumaSuresi > 0 && haber.tip === 'makale' && (
                      <>
                        <span style={{ color: mutedColor }}>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: mutedColor, fontSize: 11 }}>
                          <Clock size={10} /> {haber.okumaSuresi} dk
                        </span>
                      </>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: mutedColor, fontSize: 11, marginLeft: 'auto' }}>
                      <Eye size={10} /> {haber.goruntulenme ?? 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
