import { useNavigate } from 'react-router-dom'
import { Target } from 'lucide-react'
import { IKON_MAP } from './ikon-map'
import { IT_ALANLARI } from './it-kariyer-data'
import { useAppStore } from '../../store/useAppStore'
import './it-kariyer-testi.css'

export default function ITKariyerTesti() {
  const navigate = useNavigate()
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  return (
    <div className="kt-page">
      <div style={{ maxWidth: 760, width: '100%' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 0 48px rgba(99,102,241,0.4)',
          }}>
            <Target size={32} color="white" strokeWidth={2.2} />
          </div>

          <h1 style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
            fontWeight: 800,
            color: d ? '#f8fafc' : '#0f172a',
            marginBottom: '0.75rem',
            lineHeight: 1.2,
          }}>
            Hangi IT Alanına Uygunsun?
          </h1>

          <p style={{ color: d ? '#94a3b8' : '#475569', fontSize: '1.05rem', marginBottom: '0.4rem' }}>
            20 soru · yaklaşık 5 dakika · tamamen kişisel
          </p>
          <p style={{ color: d ? '#475569' : '#64748b', fontSize: '0.875rem' }}>
            Verilen cevaplar kaydedilmez.
          </p>
        </div>

        {/* Area Preview Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '3rem',
        }}>
          {IT_ALANLARI.map(alan => {
            const IconComp = IKON_MAP[alan.ikon]
            return (
              <div key={alan.id} className="kt-area-preview">
                {IconComp && <IconComp size={26} color={alan.renk} strokeWidth={1.8} />}
                <span style={{
                  fontSize: '12.5px', fontWeight: 600,
                  color: d ? 'rgba(255,255,255,0.78)' : '#334155',
                  lineHeight: 1.35,
                }}>
                  {alan.ad}
                </span>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/it-kariyer-testi/quiz')}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              padding: '16px 44px',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 28px rgba(99,102,241,0.38)',
              transition: 'opacity 0.2s, transform 0.2s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.opacity = '0.9'
              el.style.transform = 'scale(1.04)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.opacity = '1'
              el.style.transform = 'scale(1)'
            }}
          >
            Teste Başla →
          </button>
        </div>

      </div>
    </div>
  )
}
