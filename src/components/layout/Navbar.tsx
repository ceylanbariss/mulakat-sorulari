import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, BarChart2, Info, Brain, Menu, X, LogOut, Newspaper, FileText, Target, ChevronLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from '../ui/ThemeToggle'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/useAuthStore'
import { logout } from '../../lib/auth'

const navLinks = [
  { to: '/sorular', label: 'Sorular', icon: BookOpen },
  { to: '/istatistikler', label: 'İstatistikler', icon: BarChart2 },
  { to: '/mulakat-sim', label: 'AI Mülakat', icon: Brain },
  { to: '/cv-olustur', label: 'CV Oluştur', icon: FileText },
  { to: '/haberler', label: 'Haberler', icon: Newspaper },
  { to: '/it-kariyer-testi', label: 'Kariyer Testi', icon: Target },
  { to: '/hakkimizda', label: 'Hakkımızda', icon: Info },
]

export function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate('/giris', { replace: true })
  }

  // Avatar için baş harf
  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() ?? '?'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled ? 'glass shadow-sm shadow-black/5' : 'bg-transparent'
      )}
    >
      <div style={{ maxWidth: '1320px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '32px', paddingRight: '32px' }}>
        <div className="flex items-center justify-between h-16">
          {/* ─── Logo ─── */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <img src="/logo.png" alt="logo" className="w-11 h-11 object-contain flex-shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white hidden sm:block text-[15px] tracking-tight">
              Mülakat Soruları
            </span>
          </Link>

          {/* ─── Center Navigation ─── */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map(({ to, label }) => {
              const active = pathname === to || pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'relative text-sm font-medium transition-colors duration-200 py-1.5',
                    active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  )}
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="nav-glow absolute -bottom-0.5 left-0 right-0 h-[2px] bg-blue-500 dark:bg-blue-400 rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* ─── Right Actions ─── */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <ThemeToggle />

            {user ? (
              /* Kullanıcı giriş yapmışsa: avatar + çıkış butonu */
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-2 px-2 py-1 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold select-none">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                    {user.displayName ?? user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                  title="Çıkış Yap"
                >
                  <LogOut size={15} />
                  <span>Çıkış</span>
                </button>
              </div>
            ) : (
              /* Giriş yapılmamışsa: Giriş Yap linki */
              <Link
                to="/giris"
                className="hidden md:inline-flex items-center gap-1.5 px-1 py-1.5 active:scale-95 transition-all duration-200 group"
              >
                <span className="gradient-text text-sm font-bold">Giriş Yap</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="url(#gArrow)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="gArrow" x1="3" y1="7" x2="11" y2="7" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#3B82F6"/>
                      <stop offset="0.5" stopColor="#8B5CF6"/>
                      <stop offset="1" stopColor="#06B6D4"/>
                    </linearGradient>
                  </defs>
                </svg>
              </Link>
            )}
            <button
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menü"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={menuOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>

      </div>

      {/* ─── Mobile Menu Overlay ─── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-[60] flex flex-col"
            style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', background: 'rgba(8,12,28,0.95)' }}
            onClick={() => setMenuOpen(false)}
          >
            {/* ─── Mobile Menu Header ─── */}
            <div className="flex items-center justify-between h-16 px-6 sm:px-8 flex-shrink-0" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors py-2"
              >
                <ChevronLeft size={24} />
                <span className="font-semibold text-base">Geri Dön</span>
              </button>
            </div>

            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 overflow-y-auto"
              style={{ paddingTop: '16px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '32px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {navLinks.map(({ to, label, icon: Icon }, i) => (
                  <motion.div
                    key={to}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      to={to}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '18px 20px',
                        borderRadius: '16px',
                        fontSize: '17px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        background: pathname.startsWith(to)
                          ? 'rgba(99,102,241,0.18)'
                          : 'rgba(255,255,255,0.05)',
                        color: pathname.startsWith(to) ? '#818cf8' : 'rgba(255,255,255,0.85)',
                        border: pathname.startsWith(to)
                          ? '1px solid rgba(99,102,241,0.3)'
                          : '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <Icon size={20} />
                      {label}
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: navLinks.length * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  style={{ marginTop: '12px' }}
                >
                  {user ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '16px 20px',
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 700, fontSize: '14px', flexShrink: 0,
                        }}>
                          {initials}
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.displayName ?? user.email}
                        </span>
                      </div>
                      <button
                        onClick={() => { setMenuOpen(false); handleLogout() }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                          padding: '16px 20px', borderRadius: '16px', fontSize: '15px', fontWeight: 600,
                          background: 'rgba(239,68,68,0.12)', color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer', width: '100%',
                        }}
                      >
                        <LogOut size={18} /> Çıkış Yap
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/giris"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'block', padding: '18px 20px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        color: 'white', fontSize: '17px', fontWeight: 700,
                        textAlign: 'center', textDecoration: 'none',
                      }}
                    >
                      Giriş Yap
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
