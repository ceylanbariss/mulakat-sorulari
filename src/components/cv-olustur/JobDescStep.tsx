import { useState } from 'react'
import { Briefcase, SkipForward } from 'lucide-react'
import { useCvStore } from '../../store/useCvStore'
import { MAX_JOB_DESC_LENGTH } from '../../config/cvConfig'

interface Props { d: boolean; onNext: () => void; onSkip: () => void }

export function JobDescStep({ d, onNext, onSkip }: Props) {
  const { jobDescription, setJobDescription } = useCvStore()
  const [focused, setFocused] = useState(false)

  const borderColor = d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const borderFocus = 'rgba(99,102,241,0.5)'
  const textColor = d ? '#ffffff' : '#0f172a'
  const mutedColor = d ? '#64748b' : '#94a3b8'
  const cardBg = d ? '#111827' : '#f8fafc'

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', marginBottom: 14 }}>
          <Briefcase size={24} style={{ color: '#6366f1' }} />
        </div>
        <h2 style={{ color: textColor, fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>İş İlanı (Opsiyonel)</h2>
        <p style={{ color: mutedColor, fontSize: 14, margin: 0 }}>
          İş ilanı eklerseniz CV'niz bu pozisyona özel optimize edilir ve ATS uyumluluk skoru hesaplanır.
        </p>
      </div>

      <div style={{ background: cardBg, borderRadius: 14, border: `1px solid ${borderColor}`, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ color: d ? '#94a3b8' : '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            İş İlanı Metni
          </label>
          <span style={{ color: jobDescription.length > MAX_JOB_DESC_LENGTH * 0.9 ? '#f59e0b' : mutedColor, fontSize: 11, fontWeight: 600 }}>
            {jobDescription.length}/{MAX_JOB_DESC_LENGTH}
          </span>
        </div>
        <textarea
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value.slice(0, MAX_JOB_DESC_LENGTH))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="İş ilanı metnini buraya yapıştırın — pozisyon gereksinimleri, aranan beceriler, görev tanımı..."
          rows={10}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 8, boxSizing: 'border-box',
            background: d ? 'rgba(255,255,255,0.04)' : '#fff',
            border: `1px solid ${focused ? borderFocus : borderColor}`,
            color: textColor, fontSize: 13, resize: 'vertical', outline: 'none',
            fontFamily: 'inherit', lineHeight: 1.6, transition: 'border-color 0.15s',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onSkip}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 20px', borderRadius: 10,
            border: `1px solid ${borderColor}`,
            background: 'transparent', color: mutedColor, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <SkipForward size={15} /> Geç (ATS skoru olmadan)
        </button>
        <button
          onClick={onNext}
          disabled={jobDescription.length < 30}
          style={{
            flex: 1, padding: '12px 20px', borderRadius: 10, border: 'none',
            background: jobDescription.length >= 30 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : (d ? 'rgba(255,255,255,0.06)' : '#e2e8f0'),
            color: jobDescription.length >= 30 ? '#fff' : mutedColor,
            fontSize: 14, fontWeight: 700, cursor: jobDescription.length >= 30 ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s', boxShadow: jobDescription.length >= 30 ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
          }}
        >
          ATS Analizi ile Optimize Et →
        </button>
      </div>
    </div>
  )
}
