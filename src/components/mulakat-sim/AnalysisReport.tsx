import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Lightbulb, Save, X, RotateCcw, FileEdit, Tag, ChevronRight } from 'lucide-react'
import { useMulakatStore } from '../../store/useMulakatStore'
import { useCvStore } from '../../store/useCvStore'

interface CvAnaliz {
  pozisyonUyumPuani: number
  eksikAnahtarKelimeler: string[]
  gelistirilmesiGerekenBolumler: Array<{ bolum: string; oneri: string }>
  gucluUyumlar: string[]
}

interface AnalysisData {
  genelPuan: number
  ozet: string
  gucluYonler: Array<{ baslik: string; aciklama: string }>
  gelisimAlanlari: Array<{ baslik: string; aciklama: string; oncelik: 'yüksek' | 'orta' | 'düşük' }>
  kendiniIfadeEtme: { puan: number; yorum: string }
  teknikYetkinlik: { puan: number; yorum: string }
  eleyebilecekNoktalar: string[]
  avantajliNoktalar: string[]
  tavsiye: string
  cvAnaliz?: CvAnaliz
}

interface Props {
  analysis: AnalysisData
  d: boolean
  saving?: boolean
  onSave?: () => void
  onExit: () => void
}

function CircularScore({ score, d }: { score: number; d: boolean }) {
  const r = 54
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 75 ? '#22c55e' :
    score >= 50 ? '#f59e0b' :
    '#ef4444'

  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={70} cy={70} r={r} fill="none" stroke={d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'} strokeWidth={10} />
        <circle
          cx={70} cy={70} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 12, color: d ? 'rgba(148,163,184,0.7)' : 'rgba(100,116,139,0.7)', marginTop: 2 }}>/ 100</span>
      </div>
    </div>
  )
}

function MiniBar({ label, score, yorum, d }: { label: string; score: number; yorum: string; d: boolean }) {
  const color = score >= 7.5 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: d ? 'rgba(226,232,240,0.85)' : '#334155' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{score} <span style={{ fontSize: 11, fontWeight: 400, color: d ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.5)' }}>/ 10</span></span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score * 10}%`, background: color, borderRadius: 99, transition: 'width 1s ease' }} />
      </div>
      <p style={{ fontSize: 12, color: d ? 'rgba(148,163,184,0.65)' : 'rgba(100,116,139,0.7)', marginTop: 4, lineHeight: 1.5 }}>{yorum}</p>
    </div>
  )
}

const PRIORITY_STYLES: Record<string, { bg: string; border: string; label: string; color: string }> = {
  'yüksek': { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', label: 'Yüksek', color: '#f87171' },
  'orta': { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', label: 'Orta', color: '#fbbf24' },
  'düşük': { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', label: 'Düşük', color: '#4ade80' },
}

export function AnalysisReport({ analysis, d, saving = false, onSave, onExit }: Props) {
  const [activeTab, setActiveTab] = useState<'ozet' | 'detay' | 'cv'>('ozet')
  const navigate = useNavigate()
  const { cvText, cvFileName, jobDescription } = useMulakatStore()
  const { setOriginalCV, setJobDescription } = useCvStore()

  const bg = d ? 'rgba(15,23,42,0.98)' : 'rgba(248,250,252,0.98)'
  const card = d ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)'
  const border = d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'
  const text = d ? 'rgba(226,232,240,0.9)' : '#0f172a'
  const muted = d ? 'rgba(148,163,184,0.7)' : 'rgba(100,116,139,0.75)'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: bg,
      overflowY: 'auto',
      padding: '24px 16px 40px',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: text, margin: 0 }}>Mülakat Analizi</h2>
            <p style={{ fontSize: 13, color: muted, marginTop: 4 }}>AI destekli performans değerlendirmesi</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {onSave && (
              <button
                onClick={onSave}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                <Save size={14} />
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            )}
            {onSave && (
              <button
                onClick={onExit}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 12,
                  border: d ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                  background: 'transparent', color: muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <RotateCcw size={14} /> Yeni Mülakat
              </button>
            )}
            <button
              onClick={onExit}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 10,
                border: d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.09)',
                background: 'transparent', color: muted, cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Score + Summary */}
        <div style={{
          background: card, border, borderRadius: 20,
          padding: '24px', marginBottom: 16,
          display: 'flex', gap: 24, alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <CircularScore score={analysis.genelPuan} d={d} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: 14, color: text, lineHeight: 1.7, margin: 0 }}>{analysis.ozet}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {(['ozet', 'detay', 'cv'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: activeTab === tab ? 'none' : border,
                background: activeTab === tab
                  ? tab === 'cv'
                    ? 'linear-gradient(135deg, #0ea5e9, #6366f1)'
                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'transparent',
                color: activeTab === tab ? '#fff' : muted,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {tab === 'cv' && <FileEdit size={13} />}
              {tab === 'ozet' ? 'Güçlü & Gelişim' : tab === 'detay' ? 'Detaylı Analiz' : 'CV Önerileri'}
            </button>
          ))}
        </div>

        {activeTab === 'ozet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Güçlü Yönler */}
            <div style={{ background: card, border, borderRadius: 20, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <TrendingUp size={16} color="#4ade80" />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>Güçlü Yönler</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {analysis.gucluYonler.map((item, i) => (
                  <div key={i} style={{
                    padding: '12px 14px', borderRadius: 12,
                    background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <CheckCircle2 size={13} color="#4ade80" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>{item.baslik}</span>
                    </div>
                    <p style={{ fontSize: 13, color: muted, margin: 0, lineHeight: 1.6 }}>{item.aciklama}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Gelişim Alanları */}
            <div style={{ background: card, border, borderRadius: 20, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <TrendingDown size={16} color="#fb923c" />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fb923c' }}>Gelişim Alanları</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {analysis.gelisimAlanlari.map((item, i) => {
                  const style = PRIORITY_STYLES[item.oncelik] ?? PRIORITY_STYLES['orta']
                  return (
                    <div key={i} style={{
                      padding: '12px 14px', borderRadius: 12,
                      background: style.bg, border: `1px solid ${style.border}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: style.color }}>{item.baslik}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                          background: style.bg, border: `1px solid ${style.border}`, color: style.color,
                        }}>{style.label}</span>
                      </div>
                      <p style={{ fontSize: 13, color: muted, margin: 0, lineHeight: 1.6 }}>{item.aciklama}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tavsiye */}
            <div style={{
              padding: '16px 18px', borderRadius: 16,
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <Lightbulb size={18} color="#818cf8" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', margin: '0 0 4px' }}>En Kritik Tavsiye</p>
                <p style={{ fontSize: 14, color: text, margin: 0, lineHeight: 1.65 }}>{analysis.tavsiye}</p>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'cv' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {!analysis.cvAnaliz ? (
              <div style={{
                padding: '32px', borderRadius: 20, textAlign: 'center',
                background: card, border,
                color: muted, fontSize: 14,
              }}>
                CV analizi bu oturumda mevcut değil.
              </div>
            ) : (
              <>
                {/* Pozisyon Uyum Puanı */}
                <div style={{
                  background: card, border, borderRadius: 20, padding: 20,
                  display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
                }}>
                  {(() => {
                    const score = analysis.cvAnaliz.pozisyonUyumPuani
                    const r = 40
                    const circ = 2 * Math.PI * r
                    const offset = circ - (score / 100) * circ
                    const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
                    return (
                      <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
                        <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx={50} cy={50} r={r} fill="none" stroke={d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'} strokeWidth={8} />
                          <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={8}
                            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s ease' }} />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
                          <span style={{ fontSize: 10, color: muted, marginTop: 1 }}>/ 100</span>
                        </div>
                      </div>
                    )
                  })()}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: text, margin: '0 0 4px' }}>Pozisyon Uyum Puanı</p>
                    <p style={{ fontSize: 13, color: muted, margin: 0, lineHeight: 1.6 }}>
                      CV'nin bu iş ilanıyla ne kadar örtüştüğünü gösterir. Düşükse aşağıdaki önerilerle güçlendirebilirsin.
                    </p>
                  </div>
                </div>

                {/* Eksik Anahtar Kelimeler */}
                {analysis.cvAnaliz.eksikAnahtarKelimeler.length > 0 && (
                  <div style={{ background: card, border, borderRadius: 20, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <Tag size={15} color="#f87171" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#f87171' }}>Eksik Anahtar Kelimeler</span>
                    </div>
                    <p style={{ fontSize: 12, color: muted, marginBottom: 12, lineHeight: 1.5 }}>
                      İş ilanında geçen ancak CV'nde bulunmayan kelimeler. Bunları uygun bölümlere eklemen ATS puanını artırır.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {analysis.cvAnaliz.eksikAnahtarKelimeler.map((kw, i) => (
                        <span key={i} style={{
                          padding: '5px 12px', borderRadius: 99,
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                          color: '#fca5a5', fontSize: 12, fontWeight: 600,
                        }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Geliştirme Önerileri */}
                {analysis.cvAnaliz.gelistirilmesiGerekenBolumler.length > 0 && (
                  <div style={{ background: card, border, borderRadius: 20, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <TrendingUp size={15} color="#fb923c" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#fb923c' }}>Somut Düzenleme Önerileri</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {analysis.cvAnaliz.gelistirilmesiGerekenBolumler.map((item, i) => (
                        <div key={i} style={{
                          padding: '12px 14px', borderRadius: 12,
                          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)',
                          display: 'flex', gap: 10, alignItems: 'flex-start',
                        }}>
                          <ChevronRight size={14} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', margin: '0 0 3px' }}>{item.bolum}</p>
                            <p style={{ fontSize: 13, color: muted, margin: 0, lineHeight: 1.6 }}>{item.oneri}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Güçlü Uyumlar */}
                {analysis.cvAnaliz.gucluUyumlar.length > 0 && (
                  <div style={{
                    background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)',
                    borderRadius: 16, padding: 18,
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', margin: '0 0 10px' }}>Güçlü Uyumlar</p>
                    <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                      {analysis.cvAnaliz.gucluUyumlar.map((item, i) => (
                        <li key={i} style={{ fontSize: 13, color: muted, lineHeight: 1.7 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA: CV'yi Düzenle */}
                <div style={{
                  padding: '20px', borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(99,102,241,0.12))',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileEdit size={18} color="#fff" />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: text, margin: '0 0 4px' }}>CV'ni İlana Göre Hemen Düzenle</p>
                      <p style={{ fontSize: 13, color: muted, margin: 0, lineHeight: 1.55 }}>
                        Yukarıdaki öneriler ışığında CV'ni optimize et. CV'n ve ilan metni otomatik olarak aktarılacak.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setOriginalCV(cvText, cvFileName)
                      setJobDescription(jobDescription)
                      navigate('/cv-olustur')
                    }}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                      color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <FileEdit size={15} /> CV Düzenleme Aracına Git
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'detay' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Yetkinlik Puanları */}
            <div style={{ background: card, border, borderRadius: 20, padding: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: text, margin: '0 0 16px' }}>Yetkinlik Puanları</p>
              <MiniBar label="Kendini İfade Etme" score={analysis.kendiniIfadeEtme.puan} yorum={analysis.kendiniIfadeEtme.yorum} d={d} />
              <MiniBar label="Teknik Yetkinlik" score={analysis.teknikYetkinlik.puan} yorum={analysis.teknikYetkinlik.yorum} d={d} />
            </div>

            {/* Avantajlı Noktalar */}
            {analysis.avantajliNoktalar.length > 0 && (
              <div style={{
                background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)',
                borderRadius: 16, padding: 18,
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', margin: '0 0 10px' }}>Avantajlı Noktalar</p>
                <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                  {analysis.avantajliNoktalar.map((item, i) => (
                    <li key={i} style={{ fontSize: 13, color: muted, lineHeight: 1.7 }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Eleyebilecek Noktalar */}
            {analysis.eleyebilecekNoktalar.length > 0 && (
              <div style={{
                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)',
                borderRadius: 16, padding: 18,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <AlertTriangle size={14} color="#f87171" />
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#f87171', margin: 0 }}>Dikkat Edilmesi Gereken Noktalar</p>
                </div>
                <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                  {analysis.eleyebilecekNoktalar.map((item, i) => (
                    <li key={i} style={{ fontSize: 13, color: muted, lineHeight: 1.7 }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
