import { useEffect, useState } from 'react'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { getMulakatGecmisi, type MulakatSessionData } from '../../lib/firestore'
import { INTERVIEW_TYPE_LABELS } from '../../config/mulakatConfig'

interface Props {
  userId: string
  d: boolean
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

export function HistoryPanel({ userId, d }: Props) {
  const [sessions, setSessions] = useState<(MulakatSessionData & { _id: string; createdAt?: unknown })[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const cardBg = d ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)'
  const cardBorder = d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'

  useEffect(() => {
    getMulakatGecmisi(userId)
      .then((data) => setSessions(data as typeof sessions))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <div style={{ marginTop: '48px' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '16px',
          fontWeight: 700,
          color: d ? 'rgba(226,232,240,0.85)' : '#0f172a',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '0 0 16px',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <Clock size={18} style={{ color: '#6366f1' }} />
        Önceki Mülakatlarım
        {sessions.length > 0 && (
          <span style={{
            padding: '2px 8px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            background: 'rgba(99,102,241,0.15)',
            color: '#818cf8',
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
            <div style={{ padding: '48px', textAlign: 'center', color: d ? 'rgba(100,116,139,0.55)' : 'rgba(100,116,139,0.65)', fontSize: '14px' }}>
              Henüz mülakat geçmişi yok.
            </div>
          ) : (
            <div style={{ padding: '8px' }}>
              {sessions.map((session, i) => {
                const color = TYPE_COLORS[session.interviewType] ?? '#6366f1'
                return (
                  <div
                    key={session._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      transition: 'background 0.15s',
                      borderBottom: i < sessions.length - 1 ? d ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)' : 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: d ? 'rgba(226,232,240,0.85)' : '#0f172a', marginBottom: '2px' }}>
                        {INTERVIEW_TYPE_LABELS[session.interviewType] ?? session.interviewType}
                      </p>
                      <p style={{ fontSize: '12px', color: d ? 'rgba(100,116,139,0.6)' : 'rgba(100,116,139,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {session.cvFileName} · {session.jobDescription.slice(0, 60)}…
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color }}>
                        {session.questionCount} soru
                      </p>
                      <p style={{ fontSize: '11px', color: d ? 'rgba(100,116,139,0.55)' : 'rgba(100,116,139,0.65)', marginTop: '2px' }}>
                        {formatDate((session as unknown as Record<string, unknown>).createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
