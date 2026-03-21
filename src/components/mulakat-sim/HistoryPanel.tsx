import { useEffect, useRef, useState } from 'react'
import { Clock, ChevronDown, ChevronUp, Pencil, Check, X, BarChart2 } from 'lucide-react'
import { getMulakatGecmisi, updateMulakatSessionName, type MulakatSessionData } from '../../lib/firestore'
import { INTERVIEW_TYPE_LABELS } from '../../config/mulakatConfig'
import { AnalysisReport } from './AnalysisReport'

type Session = MulakatSessionData & { _id: string; createdAt?: unknown }

interface Props {
  userId: string
  d: boolean
  refreshKey?: number
  autoExpand?: boolean
}

function formatDate(ts: unknown): string {
  if (!ts || typeof ts !== 'object' || !('toMillis' in ts)) return '—'
  const ms = (ts as { toMillis(): number }).toMillis()
  const d = new Date(ms)
  const diff = Date.now() - d.getTime()
  if (diff < 60 * 60 * 1000) return 'Az önce'
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} saat önce`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))} gün önce`
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TYPE_COLORS: Record<string, string> = {
  ik: '#8b5cf6',
  teknik: '#3b82f6',
  'her-ikisi': '#10b981',
}

function EditableName({ session, d, onSaved }: { session: Session; d: boolean; onSaved: (name: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(
    session.name || `${INTERVIEW_TYPE_LABELS[session.interviewType] ?? session.interviewType} — ${session.jobDescription.slice(0, 30)}`
  )
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function save() {
    const trimmed = value.trim()
    if (!trimmed) { setEditing(false); return }
    setSaving(true)
    try {
      await updateMulakatSessionName(session._id, trimmed)
      onSaved(trimmed)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') setEditing(false)
  }

  const textColor = d ? 'rgba(226,232,240,0.88)' : '#0f172a'
  const mutedColor = d ? 'rgba(148,163,184,0.55)' : 'rgba(100,116,139,0.6)'

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }} onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={saving}
          style={{
            flex: 1, fontSize: 13, fontWeight: 600, color: textColor,
            background: d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            border: '1px solid rgba(99,102,241,0.4)', borderRadius: 8,
            padding: '4px 8px', outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button onClick={save} disabled={saving} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4ade80', padding: 2 }}>
          <Check size={15} />
        </button>
        <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor, padding: 2 }}>
          <X size={15} />
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
        {value}
      </p>
      <button
        onClick={(e) => { e.stopPropagation(); setEditing(true) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedColor, flexShrink: 0, padding: 2, opacity: 0.6 }}
        title="İsmi düzenle"
      >
        <Pencil size={11} />
      </button>
    </div>
  )
}

export function HistoryPanel({ userId, d, refreshKey = 0, autoExpand = false }: Props) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(autoExpand)
  const [viewSession, setViewSession] = useState<Session | null>(null)

  const cardBg = d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)'
  const cardBorder = d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'
  const muted = d ? 'rgba(100,116,139,0.6)' : 'rgba(100,116,139,0.7)'

  useEffect(() => {
    setLoading(true)
    getMulakatGecmisi(userId)
      .then((data) => setSessions(data))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [userId, refreshKey])

  useEffect(() => {
    if (autoExpand) setExpanded(true)
  }, [autoExpand])

  function handleNameSaved(id: string, name: string) {
    setSessions((prev) => prev.map((s) => s._id === id ? { ...s, name } : s))
  }

  return (
    <>
      <div style={{ marginTop: '48px' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '16px', fontWeight: 700,
            color: d ? 'rgba(226,232,240,0.85)' : '#0f172a',
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '0 0 16px', width: '100%', textAlign: 'left',
          }}
        >
          <Clock size={18} style={{ color: '#6366f1' }} />
          Önceki Mülakatlarım
          {sessions.length > 0 && (
            <span style={{
              padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
              background: 'rgba(99,102,241,0.15)', color: '#818cf8',
            }}>
              {sessions.length}
            </span>
          )}
          <span style={{ marginLeft: 'auto' }}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </button>

        {expanded && (
          <div style={{ background: cardBg, border: cardBorder, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
            {loading ? (
              <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ height: '56px', borderRadius: '12px' }} />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: muted, fontSize: '14px' }}>
                Henüz mülakat geçmişi yok.
              </div>
            ) : (
              <div style={{ padding: '8px' }}>
                {sessions.map((session, i) => {
                  const color = TYPE_COLORS[session.interviewType] ?? '#6366f1'
                  const hasAnalysis = !!session.analysis
                  return (
                    <div
                      key={session._id}
                      onClick={() => hasAnalysis && setViewSession(session)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px', borderRadius: '14px',
                        transition: 'background 0.15s',
                        cursor: hasAnalysis ? 'pointer' : 'default',
                        borderBottom: i < sessions.length - 1
                          ? d ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)'
                          : 'none',
                      }}
                      onMouseEnter={(e) => { if (hasAnalysis) e.currentTarget.style.background = d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <EditableName
                          session={session}
                          d={d}
                          onSaved={(name) => handleNameSaved(session._id, name)}
                        />
                        <p style={{ fontSize: '12px', color: muted, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {session.cvFileName} · {formatDate(session.createdAt)}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        {hasAnalysis && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Analiz mevcut">
                            <BarChart2 size={13} color="#818cf8" />
                            <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 600 }}>
                              {(session.analysis as { genelPuan?: number })?.genelPuan ?? '—'}
                            </span>
                          </div>
                        )}
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, color, margin: 0 }}>
                            {session.questionCount} soru
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analiz görüntüleme overlay */}
      {viewSession?.analysis && (
        <AnalysisReport
          analysis={viewSession.analysis as unknown as Parameters<typeof AnalysisReport>[0]['analysis']}
          d={d}
          onExit={() => setViewSession(null)}
        />
      )}
    </>
  )
}
