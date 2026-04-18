import { useEffect, lazy, Suspense } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthProvider'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { AdminGuard } from './components/admin/AdminGuard'
const AnoAI = lazy(() => import('./components/ui/animated-shader-background'))
import { Home } from './pages/Home'
import { Questions } from './pages/Questions'
import { CategoryDetail } from './pages/CategoryDetail'
import { Training } from './pages/Training'
import { Statistics } from './pages/Statistics'
import { About } from './pages/About'
import { Auth } from './pages/Auth'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { QuestionsModule } from './pages/admin/modules/QuestionsModule'
import { CategoriesModule } from './pages/admin/modules/CategoriesModule'
import { AnnouncementsModule } from './pages/admin/modules/AnnouncementsModule'
import { UsersModule } from './pages/admin/modules/UsersModule'
import { useTheme } from './hooks/useTheme'
import { MulakatSimPage } from './pages/mulakat-sim'
import { Haberler } from './pages/Haberler'
import { HaberDetay } from './pages/HaberDetay'
import { AdminHaberler } from './pages/admin/AdminHaberler'
import { AdminHaberEkle } from './pages/admin/AdminHaberEkle'
import { GizlilikPolitikasi } from './pages/GizlilikPolitikasi'
import { KullanimSartlari } from './pages/KullanimSartlari'

// @react-pdf/renderer lazy load — eager import'ta browser crash'e yol açıyor
const CvOlustur = lazy(() => import('./pages/cv-olustur').then(m => ({ default: m.CvOlustur })))

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' as const } },
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        className="min-h-[calc(100vh-4rem)]"
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/sorular" element={<Questions />} />
          <Route path="/sorular/:kategori" element={<CategoryDetail />} />
          <Route path="/antrenman/:mode" element={<Training />} />
          <Route path="/istatistikler" element={<Statistics />} />
          <Route path="/hakkimizda" element={<About />} />
          <Route path="/giris" element={<Auth />} />
          <Route path="/mulakat-sim" element={<MulakatSimPage />} />
          <Route path="/cv-olustur" element={<Suspense fallback={<div style={{ minHeight: '100vh' }} />}><CvOlustur /></Suspense>} />
          <Route path="/haberler" element={<Haberler />} />
          <Route path="/haberler/:slug" element={<HaberDetay />} />
          <Route path="/gizlilik-politikasi" element={<GizlilikPolitikasi />} />
          <Route path="/kullanim-sartlari" element={<KullanimSartlari />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function AppLayout() {
  const { theme } = useTheme()
  const location = useLocation()

  // Sayfa değiştiğinde en üste kaydır
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const isTraining = location.pathname.startsWith('/antrenman')
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isAuthRoute = location.pathname === '/giris'

  if (isAdminRoute) {
    return (
      <>
        <AdminGuard>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="sorular" element={<QuestionsModule />} />
              <Route path="kategoriler" element={<CategoriesModule />} />
              <Route path="duyurular" element={<AnnouncementsModule />} />
              <Route path="kullanicilar" element={<UsersModule />} />
              <Route path="haberler" element={<AdminHaberler />} />
              <Route path="haberler/yeni" element={<AdminHaberEkle />} />
              <Route path="haberler/duzenle/:id" element={<AdminHaberEkle />} />
            </Route>
          </Routes>
        </AdminGuard>
        <Toaster position="bottom-right" />
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden">
      {/* Global Aurora Background — Auth sayfası hariç (kendi AnoAI'ı var) */}
      {!isAuthRoute && <Suspense fallback={null}><AnoAI className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden" /></Suspense>}
      <div className="relative z-10 flex flex-col flex-1">
        {!isTraining && <Navbar />}
        <main className="flex-1">
          <AnimatedRoutes />
        </main>
        {!isTraining && <Footer />}
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#1E293B' : '#fff',
            color: theme === 'dark' ? '#F1F5F9' : '#0F172A',
            border: `1px solid ${theme === 'dark' ? '#334155' : '#E2E8F0'}`,
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
        <Analytics />
      </BrowserRouter>
    </HelmetProvider>
  )
}
