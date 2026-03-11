import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, LogOut } from 'lucide-react'
import { ADMIN_MODULES } from './modules'
import { useAuthStore } from '../../store/useAuthStore'
import { logout } from '../../lib/auth'

const S = {
  page:    { background: '#0a0f1e', minHeight: '100vh' } as React.CSSProperties,
  sidebar: { width: 240, background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' as const, height: '100vh', position: 'sticky' as const, top: 0 },
  logoBox: { padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon:{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(6,182,212,0.3)' },
  navArea: { flex: 1, overflowY: 'auto' as const, padding: '12px 10px' },
  userBox: { padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  avatar:  { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  main:    { flex: 1, minWidth: 0, overflow: 'auto' },
}

function NavItem({ id, label, icon: Icon, path }: { id: string; label: string; icon: React.ElementType; path: string }) {
  return (
    <NavLink
      key={id}
      to={`/admin${path ? `/${path}` : ''}`}
      end={path === ''}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 8,
        marginBottom: 2,
        fontSize: 13,
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
        borderLeft: isActive ? '2px solid #06b6d4' : '2px solid transparent',
        background: isActive ? 'rgba(6,182,212,0.08)' : 'transparent',
        color: isActive ? '#06b6d4' : '#94a3b8',
      })}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        if (!el.dataset.active) { el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = '#e2e8f0' }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        if (!el.dataset.active) { el.style.background = 'transparent'; el.style.color = '#94a3b8' }
      }}
    >
      {({ isActive }) => (
        <>
          <Icon size={15} style={{ opacity: isActive ? 1 : 0.7 }} />
          {label}
        </>
      )}
    </NavLink>
  )
}

export function AdminLayout() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = user?.displayName
    ? user.displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() ?? 'A'

  const handleLogout = async () => {
    await logout()
    navigate('/giris', { replace: true })
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={S.logoBox}>
        <img src="/logo.png" alt="logo" style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>Admin Panel</p>
          <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.3 }}>Mülakat Soruları</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'none' }}
          className="md-hide-close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav style={S.navArea}>
        <p style={{ color: '#334155', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 8 }}>
          MENÜ
        </p>
        {ADMIN_MODULES.map(m => (
          <NavItem key={m.id} {...m} />
        ))}
      </nav>

      {/* User */}
      <div style={S.userBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
          <div style={S.avatar}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName ?? user?.email}
            </p>
            <p style={{ color: '#06b6d4', fontSize: 10, fontWeight: 600 }}>Admin</p>
          </div>
          <button
            onClick={handleLogout}
            title="Çıkış Yap"
            style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#64748b')}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div style={S.page} className="flex">
      {/* Desktop Sidebar */}
      <aside style={S.sidebar} className="hidden md:flex flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        style={{
          ...S.sidebar,
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 50,
          height: '100vh',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}
        className="flex flex-col md:hidden"
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div style={S.main}>
        {/* Mobile top bar */}
        <div
          style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
          className="md:hidden sticky top-0 z-30"
        >
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#94a3b8' }}
          >
            <Menu size={18} />
          </button>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Admin Panel</span>
        </div>

        <Outlet />
      </div>
    </div>
  )
}
