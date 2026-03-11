import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthForm } from '../components/ui/premium-auth'
import AnoAI from '../components/ui/animated-shader-background'
import { useAuthStore } from '../store/useAuthStore'

export function Auth() {
  const navigate = useNavigate()
  const { user, loading } = useAuthStore()

  // Zaten giriş yapmışsa ana sayfaya yönlendir
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  // Firebase auth yüklenirken boş sayfa göster
  if (loading) return null

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-16 relative overflow-hidden">

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
          <span className="font-bold text-xl text-white tracking-tight text-center mx-auto" style={{ marginTop: '-20px', marginBottom: '32px' }}>Mülakat Soruları</span>
        </div>

        {/* Glassmorphism Kart */}
        <div
          className="border border-white/[0.08] backdrop-blur-2xl"
          style={{
            borderRadius: 20,
            background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.09)',
          }}
        >
          <AuthForm
            onSuccess={() => {
              // Kısa bir gecikmeyle yönlendir — success mesajı görünsün
              setTimeout(() => navigate('/', { replace: true }), 800)
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}
