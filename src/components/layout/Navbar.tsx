import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, BarChart2, Info, Menu, X, Zap, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from '../ui/ThemeToggle'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/useAuthStore'
import { logout } from '../../lib/auth'

const navLinks = [
  { to: '/sorular', label: 'Sorular', icon: BookOpen },
  { to: '/istatistikler', label: 'İstatistikler', icon: BarChart2 },
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
      <div style={{ maxWidth: '1152px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '24px', paddingRight: '24px' }}>
        <div className="flex items-center justify-between h-16">
          {/* ─── Logo ─── */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <Zap size={16} className="text-white fill-white" />
            </div>
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

        {/* ─── Mobile Menu ─── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-3 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-1">
                {navLinks.map(({ to, label, icon: Icon }, i) => (
                  <motion.div
                    key={to}
                    initial={{ x: -16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      to={to}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                        pathname.startsWith(to)
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      )}
                    >
                      <Icon size={16} />
                      {label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: navLinks.length * 0.06 }}
                >
                  {user ? (
                    <button
                      onClick={() => { setMenuOpen(false); handleLogout() }}
                      className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-sm font-semibold"
                    >
                      <LogOut size={15} /> Çıkış Yap
                    </button>
                  ) : (
                    <Link
                      to="/giris"
                      onClick={() => setMenuOpen(false)}
                      className="mt-2 block px-4 py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold text-center"
                    >
                      Giriş Yap
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
