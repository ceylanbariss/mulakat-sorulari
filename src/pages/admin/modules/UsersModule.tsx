import { useEffect, useState, useRef } from 'react'
import { Search, Users, ShieldCheck } from 'lucide-react'
import { subscribeCollection, userProfilesCol } from '../../../lib/firestore'
import { isAdminEmail } from '../../../lib/admin'
import type { Timestamp } from 'firebase/firestore'

interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  createdAt?: Timestamp
  lastLogin?: Timestamp
}

type UserDoc = UserProfile & { _id: string }

// ─── Shared design tokens ──────────────────────────────────────────────────────
const C = {
  bg: '#0a0f1e', card: '#111827', sidebar: '#0d1117',
  border: 'rgba(255,255,255,0.06)', borderHover: 'rgba(16,185,129,0.3)',
  cyan: '#10b981', purple: '#34d399', // Emerald theme for Users
  t1: '#ffffff', t2: '#94a3b8', t3: '#64748b',
  gradient: 'linear-gradient(135deg, #10b981, #059669)',
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: C.t1, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

function TableRow({ isLast, children }: { isLast: boolean; children: React.ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <tr
      style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)', background: hov ? 'rgba(255,255,255,0.03)' : 'transparent', transition: 'background 0.12s' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      {children}
    </tr>
  )
}

export function UsersModule() {
  const [users, setUsers] = useState<UserDoc[]>([])
  const [search, setSearch] = useState('')
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    unsubRef.current = subscribeCollection<UserProfile>(
      userProfilesCol(),
      (docs) => {
        const sorted = [...docs as UserDoc[]].sort((a, b) => {
          const ta = (a.createdAt as any)?.seconds ?? 0
          const tb = (b.createdAt as any)?.seconds ?? 0
          return tb - ta
        })
        setUsers(sorted)
      },
    )
    return () => unsubRef.current?.()
  }, [])

  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.email?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q)
    )
  })

  function formatDate(ts: Timestamp | undefined) {
    if (!ts) return '-'
    return new Date((ts as any).seconds * 1000).toLocaleDateString('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  }

  function initials(u: UserDoc) {
    if (u.displayName) return u.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    return u.email?.[0]?.toUpperCase() ?? '?'
  }

  const [fc, setFc] = useState(false)

  return (
    <div style={{ padding: 32, background: C.bg, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: C.t1, fontWeight: 700, fontSize: 24, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={22} style={{ color: C.cyan }} /> Kullanıcılar
          </h1>
          <p style={{ color: C.t3, fontSize: 13, margin: '4px 0 0' }}>{users.length} kayıtlı kullanıcı</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.t3 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)} placeholder="İsim veya e-posta ara..."
            style={{ ...INPUT_STYLE, paddingLeft: 36, borderColor: fc ? C.cyan : 'rgba(255,255,255,0.08)' }}
            onFocus={() => setFc(true)} onBlur={() => setFc(false)}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '64px 0', textAlign: 'center', color: C.t3, fontSize: 14 }}>
            {users.length === 0
              ? 'Henüz kullanıcı yok. Kullanıcılar giriş yaptıkça burada görünecek.'
              : 'Arama sonucu bulunamadı.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Kullanıcı', 'E-posta', 'Kayıt', 'Son Giriş', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '12px 16px', color: C.t3, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', width: i >= 2 && i <= 3 ? 120 : (i === 4 ? 80 : undefined) }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const admin = isAdminEmail(u.email)
                return (
                  <TableRow key={u._id} isLast={i === filtered.length - 1}>
                    <td style={{ padding: '12px 16px', maxWidth: 280 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {initials(u)}
                        </div>
                        <span style={{ color: C.t1, fontWeight: 500 }}>
                          {u.displayName || '-'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: C.t2 }}>{u.email}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: C.t3 }}>{formatDate(u.createdAt)}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: C.t3 }}>{formatDate(u.lastLogin)}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {admin && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>
                          <ShieldCheck size={12} /> ADMIN
                        </div>
                      )}
                    </td>
                  </TableRow>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ color: C.t3, fontSize: 12, marginTop: 16 }}>
        Admin rolü <code style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: 4, color: C.t2 }}>.env</code> dosyasındaki{' '}
        <code style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: 4, color: C.t2 }}>VITE_ADMIN_EMAILS</code> değişkeniyle belirlenir.
      </p>
    </div>
  )
}
