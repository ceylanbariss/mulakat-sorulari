import { useMemo, useRef, useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ExternalLink, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { IKON_MAP } from './ikon-map'
import { IT_ALANLARI } from './it-kariyer-data'
import { useAppStore } from '../../store/useAppStore'
import './it-kariyer-testi.css'

export default function EgitimPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const tabsRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  const checkScroll = () => {
    const el = tabsRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }

  useEffect(() => {
    const el = tabsRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll)
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect() }
  }, [])

  const scrollTabs = (dir: 'left' | 'right') => {
    tabsRef.current?.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' })
  }

  const activeId = useMemo(() => {
    const param = searchParams.get('alan')
    return IT_ALANLARI.find(a => a.id === param) ? param! : IT_ALANLARI[0].id
  }, [searchParams])

  const alan = IT_ALANLARI.find(a => a.id === activeId)!
  const AlanIcon = IKON_MAP[alan.ikon]

  const free = alan.egitimler.filter(e => e.ucretsiz)
  const paid = alan.egitimler.filter(e => !e.ucretsiz)

  const setAlan = (id: string) => {
    setSearchParams({ alan: id }, { replace: true })
    tabsRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
  }

  return (
    <div className="kt-page">
      <div style={{ maxWidth: 760, width: '100%' }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748b', fontSize: '14px', fontWeight: 500,
            marginBottom: '1.5rem', padding: 0,
          }}
        >
          <ArrowLeft size={15} /> Geri Dön
        </button>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '0.75rem',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '14px',
            background: `${alan.renk}20`, border: `1.5px solid ${alan.renk}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {AlanIcon && <AlanIcon size={26} color={alan.renk} strokeWidth={1.8} />}
          </div>
          <div>
            <h1 style={{
              fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800,
              color: d ? '#f1f5f9' : '#0f172a', margin: 0, lineHeight: 1.2,
            }}>
              {alan.ad}
            </h1>
            <p style={{ color: d ? '#64748b' : '#475569', fontSize: '14px', marginTop: '4px' }}>
              Bu alanda uzmanlaşmak için önerilen kaynaklar
            </p>
          </div>
        </div>

        {/* Area Tabs */}
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          {/* Left fade + arrow */}
          {canScrollLeft && (
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 4, width: 56, zIndex: 2,
              background: d
                ? 'linear-gradient(90deg, rgba(10,15,28,1) 30%, transparent)'
                : 'linear-gradient(90deg, rgba(248,250,252,1) 30%, transparent)',
              display: 'flex', alignItems: 'center', pointerEvents: 'none',
            }}>
              <button
                onClick={() => scrollTabs('left')}
                style={{
                  pointerEvents: 'all',
                  background: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  border: d ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  width: 28, height: 28, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer',
                  color: d ? '#94a3b8' : '#475569',
                  marginLeft: 2, flexShrink: 0,
                }}
              >
                <ChevronLeft size={15} />
              </button>
            </div>
          )}

          {/* Right fade + arrow */}
          {canScrollRight && (
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 4, width: 56, zIndex: 2,
              background: d
                ? 'linear-gradient(270deg, rgba(10,15,28,1) 30%, transparent)'
                : 'linear-gradient(270deg, rgba(248,250,252,1) 30%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pointerEvents: 'none',
            }}>
              <button
                onClick={() => scrollTabs('right')}
                style={{
                  pointerEvents: 'all',
                  background: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  border: d ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  width: 28, height: 28, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer',
                  color: d ? '#94a3b8' : '#475569',
                  marginRight: 2, flexShrink: 0,
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          <div
            ref={tabsRef}
            style={{
              display: 'flex', gap: '8px', overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
            }}
          >
            {IT_ALANLARI.map(a => {
              const Icon = IKON_MAP[a.ikon]
              const isActive = a.id === activeId
              return (
                <button
                  key={a.id}
                  onClick={() => setAlan(a.id)}
                  className={`kt-area-tab${isActive ? ' kt-tab-active' : ''}`}
                  style={{ color: isActive ? a.renk : undefined, borderColor: isActive ? `${a.renk}55` : undefined }}
                >
                  {Icon && <Icon size={14} strokeWidth={2} />}
                  {a.ad}
                </button>
              )
            })}
          </div>
        </div>

        {/* Free resources */}
        {free.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: d ? '#34d399' : '#059669', margin: 0 }}>
                Ücretsiz Kaynaklar
              </h2>
              <div style={{
                height: '1px', flex: 1,
                background: d
                  ? 'linear-gradient(90deg, rgba(52,211,153,0.3), transparent)'
                  : 'linear-gradient(90deg, rgba(5,150,105,0.25), transparent)',
              }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {free.map((e, i) => (
                <EgitimKarti key={i} egitim={e} alanRenk={alan.renk} dark={d} />
              ))}
            </div>
          </section>
        )}

        {/* Paid resources */}
        {paid.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: d ? '#94a3b8' : '#475569', margin: 0 }}>
                Ücretli Kurslar
              </h2>
              <div style={{
                height: '1px', flex: 1,
                background: d
                  ? 'linear-gradient(90deg, rgba(148,163,184,0.2), transparent)'
                  : 'linear-gradient(90deg, rgba(71,85,105,0.2), transparent)',
              }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {paid.map((e, i) => (
                <EgitimKarti key={i} egitim={e} alanRenk={alan.renk} dark={d} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

function EgitimKarti({ egitim, alanRenk, dark: d }: { egitim: { platform: string; baslik: string; url: string; ucretsiz: boolean }; alanRenk: string; dark: boolean }) {
  return (
    <div className="kt-edu-card">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: alanRenk, marginBottom: '3px', letterSpacing: '0.03em' }}>
          {egitim.platform}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: d ? '#e2e8f0' : '#0f172a', lineHeight: 1.4 }}>
          {egitim.baslik}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {egitim.ucretsiz && <span className="kt-badge-free">Ücretsiz</span>}
        <a
          href={egitim.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '8px 14px', borderRadius: '9px',
            background: d ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
            border: d ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(99,102,241,0.3)',
            color: d ? '#a5b4fc' : '#4f46e5', fontSize: '13px', fontWeight: 600,
            textDecoration: 'none', whiteSpace: 'nowrap',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = d ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.18)'
            e.currentTarget.style.borderColor = d ? 'rgba(99,102,241,0.45)' : 'rgba(99,102,241,0.5)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = d ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)'
            e.currentTarget.style.borderColor = d ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.3)'
          }}
        >
          Kursa Git <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}
