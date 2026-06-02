import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles } from 'lucide-react'

const TIPS = [
  'Cevapların inceleniyor...',
  'Yetkinlik puanları hesaplanıyor...',
  'Güçlü yönlerin tespit ediliyor...',
  'Gelişim alanların belirleniyor...',
  'Rapor son haline getiriliyor...',
]

const PROGRESS_DURATION = 4000

export function MulakatAnalizLoading() {
  const [progress, setProgress] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const startTimeRef = useRef(Date.now())
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    startTimeRef.current = Date.now()
    function tick() {
      const elapsed = Date.now() - startTimeRef.current
      const p = Math.min((elapsed / PROGRESS_DURATION) * 100, 98)
      setProgress(p)
      if (p < 98) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handler = () => window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px',
        padding: '48px 40px', maxWidth: '480px', width: '90%',
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25))',
          border: '2px solid rgba(99,102,241,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'analizPulse 2s ease-in-out infinite',
        }}>
          <Sparkles size={38} style={{ color: '#818cf8', animation: 'analizSpin 3s linear infinite' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: 0, marginBottom: 10 }}>
            Analiz Hazırlanıyor...
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.8)', margin: 0, lineHeight: 1.6 }}>
            Verileriniz işleniyor, kişisel raporun oluşturuluyor...
          </p>
        </div>

        <div style={{ width: '100%' }}>
          <div style={{
            height: 7, borderRadius: 4,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
              borderRadius: 4,
              transition: 'width 0.12s linear',
            }} />
          </div>
          <div style={{ textAlign: 'right', marginTop: 6, fontSize: 12, color: 'rgba(148,163,184,0.4)' }}>
            {Math.round(progress)}%
          </div>
        </div>

        <p style={{
          fontSize: 13, color: 'rgba(148,163,184,0.65)',
          fontStyle: 'italic', textAlign: 'center', margin: 0,
          minHeight: 20, transition: 'opacity 0.4s',
        }}>
          {TIPS[tipIndex]}
        </p>
      </div>

      <style>{`
        @keyframes analizPulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.06); opacity:0.8; } }
        @keyframes analizSpin { to { transform:rotate(360deg) } }
      `}</style>
    </div>,
    document.body
  )
}
