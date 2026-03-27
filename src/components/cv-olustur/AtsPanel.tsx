import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react'
import type { AtsAnalysis } from '../../types/cv'

interface Props { analysis: AtsAnalysis; d: boolean }

function ScoreBar({ label, score, d }: { label: string; score: number; d: boolean }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ color: d ? '#94a3b8' : '#475569', fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span style={{ color, fontSize: 12, fontWeight: 700 }}>{score}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: d ? 'rgba(255,255,255,0.08)' : '#e2e8f0', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

export function AtsPanel({ analysis, d }: Props) {
  const [open, setOpen] = useState(true)

  const borderColor = d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const cardBg = d ? 'rgba(17,24,39,0.8)' : '#f8fafc'
  const textColor = d ? '#f1f5f9' : '#0f172a'
  const mutedColor = d ? '#64748b' : '#94a3b8'

  const genelColor = analysis.genelSkor >= 75 ? '#22c55e' : analysis.genelSkor >= 50 ? '#f59e0b' : '#ef4444'

  const allEslesen = [
    ...analysis.eslesen.teknikBeceriler,
    ...analysis.eslesen.yazilimlar,
    ...analysis.eslesen.anahterKelimeler,
  ]

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', background: `${genelColor}20`, border: `2px solid ${genelColor}` }}>
            <span style={{ color: genelColor, fontSize: 15, fontWeight: 800 }}>{analysis.genelSkor}</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, color: textColor, fontSize: 14, fontWeight: 700 }}>ATS Uyumluluk Skoru</p>
            <p style={{ margin: 0, color: mutedColor, fontSize: 12 }}>İş ilanıyla eşleşme analizi</p>
          </div>
        </div>
        {open ? <ChevronUp size={18} style={{ color: mutedColor }} /> : <ChevronDown size={18} style={{ color: mutedColor }} />}
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Sub scores */}
          <div style={{ padding: 16, borderRadius: 10, background: d ? 'rgba(255,255,255,0.03)' : '#fff', border: `1px solid ${borderColor}` }}>
            <ScoreBar label="Deneyim" score={analysis.deneyimSkor} d={d} />
            <ScoreBar label="Eğitim" score={analysis.egitimSkor} d={d} />
            <ScoreBar label="Beceriler" score={analysis.beceriSkor} d={d} />
          </div>

          {/* Matching keywords */}
          {allEslesen.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <CheckCircle size={15} style={{ color: '#22c55e' }} />
                <span style={{ color: textColor, fontSize: 13, fontWeight: 700 }}>Eşleşen Anahtar Kelimeler</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {allEslesen.map((kw, i) => (
                  <span key={i} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e', fontSize: 12, fontWeight: 600 }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing keywords */}
          {analysis.eksik.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertCircle size={15} style={{ color: '#f59e0b' }} />
                <span style={{ color: textColor, fontSize: 13, fontWeight: 700 }}>Eksik / Güçlendirilmesi Gereken</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {analysis.eksik.map((kw, i) => (
                  <span key={i} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.oneriler.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Lightbulb size={15} style={{ color: '#6366f1' }} />
                <span style={{ color: textColor, fontSize: 13, fontWeight: 700 }}>Öneriler</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analysis.oneriler.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 8, background: d ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.04)', border: `1px solid rgba(99,102,241,0.15)` }}>
                    <span style={{ color: '#6366f1', fontWeight: 800, fontSize: 12, minWidth: 18 }}>{i + 1}.</span>
                    <span style={{ color: d ? '#cbd5e1' : '#334155', fontSize: 12, lineHeight: 1.5 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
