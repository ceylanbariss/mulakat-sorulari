import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthForm } from '../components/ui/premium-auth'
import AnoAI from '../components/ui/animated-shader-background'
import { useAuthStore } from '../store/useAuthStore'
import { useAppStore } from '../store/useAppStore'

export function Auth() {
  const navigate = useNavigate()
  const { user, loading } = useAuthStore()
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'

  // Zaten giriş yapmışsa ana sayfaya yönlendir
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  // Firebase auth yüklenirken boş sayfa göster
  if (loading) return null

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: d ? '#020817' : 'var(--bg)' }}
    >

      {/* Aurora Background */}
      <AnoAI className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full min-w-[320px] max-w-[460px]"
      >
        {/* Logo */}
        <div className="flex flex-col items-center">
          <img src="/logo.png" alt="logo" className="w-56 h-56 object-contain" />
          <span
            className="font-bold text-xl tracking-tight text-center mx-auto"
            style={{ color: d ? 'white' : 'var(--text)', marginTop: '-20px', marginBottom: '32px' }}
          >
            Mülakat Soruları
          </span>
        </div>

        {/* Kart */}
        <div
          className="backdrop-blur-2xl"
          style={{
            borderRadius: 20,
            border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            background: d
              ? 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)'
              : 'rgba(255,255,255,0.97)',
            boxShadow: d
              ? '0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.09)'
              : '0 20px 60px rgba(0,0,0,0.1)',
          }}
        >
          <AuthForm
            onSuccess={() => {
              setTimeout(() => navigate('/', { replace: true }), 800)
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}
