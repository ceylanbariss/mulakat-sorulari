import * as React from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react'
import {
  loginWithEmail,
  signupWithEmail,
  loginWithGoogle as firebaseLoginWithGoogle,
  resetPassword as firebaseResetPassword,
  translateAuthError,
} from '../../lib/auth'

type AuthMode = 'login' | 'signup' | 'reset'

export interface LoginPanelProps {
  onSuccess?: () => void
}

// ─── AppInput ─────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
}

function AppInput({ label, placeholder, icon, style: _style, ...rest }: InputProps) {
  const [mouseX, setMouseX] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMouseX(e.clientX - rect.left)
  }

  const borderColor = focused
    ? 'rgba(99,102,241,0.7)'
    : hovering
    ? 'rgba(199,209,219,0.25)'
    : 'rgba(44,51,58,1)'

  const boxShadow = focused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none'

  return (
    <div className="w-full relative">
      {label && (
        <label className="block mb-1.5 text-xs font-medium" style={{ color: '#8899aa' }}>
          {label}
        </label>
      )}
      <div
        className="relative w-full"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <input
          placeholder={placeholder}
          {...rest}
          onFocus={e => { setFocused(true); rest.onFocus?.(e) }}
          onBlur={e => { setFocused(false); rest.onBlur?.(e) }}
          style={{
            width: '100%',
            height: 48,
            paddingLeft: 16,
            paddingRight: icon ? 44 : 16,
            borderRadius: 8,
            border: `1.5px solid ${borderColor}`,
            background: 'rgba(255,255,255,0.04)',
            color: '#dee4ea',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow,
          }}
          className="auth-input"
        />
        {/* Hover top highlight */}
        {hovering && !focused && (
          <>
            <div
              className="absolute pointer-events-none top-0 left-0 right-0 h-[1.5px] z-10 rounded-t-lg overflow-hidden"
              style={{
                background: `radial-gradient(40px circle at ${mouseX}px 0px, rgba(199,209,219,0.6) 0%, transparent 70%)`,
              }}
            />
            <div
              className="absolute pointer-events-none bottom-0 left-0 right-0 h-[1.5px] z-10 rounded-b-lg overflow-hidden"
              style={{
                background: `radial-gradient(40px circle at ${mouseX}px 2px, rgba(199,209,219,0.3) 0%, transparent 70%)`,
              }}
            />
          </>
        )}
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center" style={{ color: '#596773' }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Google Icon ──────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

// ─── LoginPanel ───────────────────────────────────────────────────────────────

export function LoginPanel({ onSuccess }: LoginPanelProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 })
  const [hovering, setHovering] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', agreeToTerms: false, agreeToKvkk: false, agreeToAI: false, rememberMe: false,
  })

  const setField = (field: string, value: string | boolean) =>
    setForm(p => ({ ...p, [field]: value }))

  const switchMode = (m: AuthMode) => {
    setAuthMode(m); setErrorMsg(''); setSuccessMsg('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setErrorMsg('')
    try {
      if (authMode === 'login') {
        if (form.rememberMe) localStorage.setItem('userEmail', form.email)
        else localStorage.removeItem('userEmail')
        await loginWithEmail(form.email, form.password)
        setSuccessMsg('Giriş başarılı! Yönlendiriliyorsunuz...')
        onSuccess?.()
      } else if (authMode === 'signup') {
        await signupWithEmail(form.name, form.email, form.password)
        setSuccessMsg('Hesabın oluşturuldu!')
        onSuccess?.()
      } else {
        await firebaseResetPassword(form.email)
        setSuccessMsg('Sıfırlama bağlantısı gönderildi!')
        setTimeout(() => switchMode('login'), 3000)
      }
    } catch (err) {
      setErrorMsg(translateAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true); setErrorMsg('')
    try {
      const result = await firebaseLoginWithGoogle()
      if (!result || !('user' in result)) return
      setSuccessMsg('Google ile giriş başarılı!')
      onSuccess?.()
    } catch (err) {
      setErrorMsg(translateAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  const EyeBtn = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button type="button" onClick={onToggle} style={{ color: '#596773' }} className="flex items-center">
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )

  return (
    <div
      className="w-full flex rounded-2xl overflow-hidden"
      style={{
        border: '1px solid rgba(44,51,58,0.8)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
        height: 620,
      }}
    >
      {/* ── Left: Form ── */}
      <div
        className="w-full lg:w-1/2 relative overflow-y-auto flex-shrink-0"
        style={{ background: '#161A1D' }}
        onMouseMove={e => {
          const r = e.currentTarget.getBoundingClientRect()
          setGlowPos({ x: e.clientX - r.left, y: e.clientY - r.top })
        }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Glow blob */}
        <div
          className="absolute pointer-events-none rounded-full blur-3xl"
          style={{
            width: 500, height: 500,
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(37,99,235,0.08) 50%, transparent 70%)',
            opacity: hovering ? 1 : 0,
            transform: `translate(${glowPos.x - 250}px, ${glowPos.y - 250}px)`,
            transition: 'transform 0.1s ease-out, opacity 0.25s',
          }}
        />

        <form
          onSubmit={handleSubmit}
          className="relative z-10 flex flex-col px-10"
          style={{ gap: 16, paddingTop: 48, paddingBottom: 40 }}
        >
          {/* Header */}
          <div className="text-center mb-1">
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#dee4ea' }}>
              {authMode === 'login' ? 'Tekrar Hoş Geldin'
                : authMode === 'signup' ? 'Hesabını Oluştur'
                : 'Şifre Kurtarma'}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#596773' }}>
              {authMode === 'login' ? 'Hesabına giriş yaparak kaldığın yerden devam et'
                : authMode === 'signup' ? 'Dakikalar içinde ücretsiz başla'
                : 'Sıfırlama bağlantısı göndereceğiz'}
            </p>
          </div>

          {/* Tab switcher */}
          {authMode !== 'reset' && (
            <div
              className="flex rounded-xl"
              style={{ background: '#1D2125', border: '1px solid #2C333A', padding: 4 }}
            >
              {(['login', 'signup'] as AuthMode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className="flex-1 text-sm font-semibold transition-all"
                  style={{
                    height: 38,
                    borderRadius: 8,
                    background: authMode === m
                      ? 'linear-gradient(135deg, #6366f1 0%, #2563eb 100%)'
                      : 'transparent',
                    color: authMode === m ? '#ffffff' : '#596773',
                    boxShadow: authMode === m ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
                  }}
                >
                  {m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                </button>
              ))}
            </div>
          )}

          {/* Feedback banners */}
          {successMsg && (
            <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />{errorMsg}
            </div>
          )}

          {/* Google button */}
          {authMode !== 'reset' && (
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{
                height: 44,
                background: '#1D2125',
                border: '1.5px solid #2C333A',
                color: '#c7d1db',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(199,209,219,0.35)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2C333A')}
            >
              <GoogleIcon />
              Google ile {authMode === 'login' ? 'devam et' : 'kayıt ol'}
            </button>
          )}

          {/* Divider */}
          {authMode !== 'reset' && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: '#2C333A' }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: '#596773' }}>veya e-posta ile</span>
              <div className="flex-1 h-px" style={{ background: '#2C333A' }} />
            </div>
          )}

          {/* Fields */}
          <div className="flex flex-col gap-3">
            {authMode === 'signup' && (
              <AppInput placeholder="Ad Soyad" type="text" value={form.name}
                onChange={e => setField('name', e.target.value)} />
            )}
            <AppInput placeholder="E-posta adresi" type="email" value={form.email}
              onChange={e => setField('email', e.target.value)} />
            {authMode !== 'reset' && (
              <AppInput placeholder="Şifre" type={showPw ? 'text' : 'password'} value={form.password}
                onChange={e => setField('password', e.target.value)}
                icon={<EyeBtn show={showPw} onToggle={() => setShowPw(v => !v)} />} />
            )}
            {authMode === 'signup' && (
              <>
                <AppInput placeholder="Şifre Tekrar" type={showCPw ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={e => setField('confirmPassword', e.target.value)}
                  icon={<EyeBtn show={showCPw} onToggle={() => setShowCPw(v => !v)} />} />
                <AppInput placeholder="Telefon Numarası (İsteğe Bağlı)" type="tel" value={form.phone}
                  onChange={e => setField('phone', e.target.value)} />
              </>
            )}
          </div>

          {/* Signup checkboxes */}
          {authMode === 'signup' && (
            <div className="flex flex-col gap-2.5" style={{ fontSize: 13, color: '#596773' }}>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={form.agreeToTerms}
                  onChange={e => setField('agreeToTerms', e.target.checked)}
                  className="mt-0.5 accent-indigo-500 flex-shrink-0" />
                <span>
                  <Link to="/kullanim-sartlari" target="_blank" style={{ color: '#8899aa', textDecoration: 'underline' }}>Üyelik Sözleşmesi</Link>'ni
                  {' '}ve{' '}
                  <Link to="/gizlilik-politikasi" target="_blank" style={{ color: '#8899aa', textDecoration: 'underline' }}>KVKK Aydınlatma Metni</Link>'ni
                  {' '}okudum, kabul ediyorum.{' '}
                  <span style={{ color: '#f87171' }}>*</span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={form.agreeToAI}
                  onChange={e => setField('agreeToAI', e.target.checked)}
                  className="mt-0.5 accent-indigo-500 flex-shrink-0" />
                <span>
                  Verilerimin AI analizleri için yurt dışına aktarılmasına{' '}
                  <Link to="/gizlilik-politikasi" target="_blank" style={{ color: '#8899aa', textDecoration: 'underline' }}>açık rıza</Link> veriyorum.{' '}
                  <span style={{ fontSize: 11, color: '#3d4d5c' }}>(İsteğe bağlı)</span>
                </span>
              </label>
            </div>
          )}

          {/* Login: remember + forgot */}
          {authMode === 'login' && (
            <div className="flex items-center justify-between" style={{ fontSize: 13, color: '#596773' }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.rememberMe}
                  onChange={e => setField('rememberMe', e.target.checked)}
                  className="accent-indigo-500" />
                Beni hatırla
              </label>
              <button type="button" onClick={() => switchMode('reset')}
                className="hover:opacity-80 transition-opacity" style={{ color: '#596773' }}>
                Şifremi unuttum?
              </button>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="group/button relative overflow-hidden flex items-center justify-center gap-2 w-full rounded-lg font-semibold text-sm text-white transition-all duration-300 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              height: 48,
              background: 'linear-gradient(135deg, #6366f1 0%, #2563eb 100%)',
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              authMode === 'login' ? 'Giriş Yap'
                : authMode === 'signup' ? 'Hesap Oluştur →'
                : 'Sıfırlama Bağlantısı Gönder'
            )}
            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-700 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
              <div className="relative h-full w-10 bg-white/15" />
            </div>
          </button>

          {/* Bottom link */}
          {authMode === 'reset' ? (
            <button type="button" onClick={() => switchMode('login')}
              className="text-sm text-center hover:opacity-80 transition-opacity" style={{ color: '#596773' }}>
              ← Girişe dön
            </button>
          ) : (
            <p className="text-sm text-center" style={{ color: '#596773' }}>
              {authMode === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}{' '}
              <button type="button" onClick={() => switchMode(authMode === 'login' ? 'signup' : 'login')}
                className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#c7d1db' }}>
                {authMode === 'login' ? 'Ücretsiz kayıt ol →' : 'Giriş yap →'}
              </button>
            </p>
          )}

          {/* Security badge */}
          <p className="text-center text-xs" style={{ color: '#3d4d5c' }}>
            256-bit SSL ile korunur · KVKK uyumlu
          </p>
        </form>
      </div>

      {/* ── Right: Image panel ── */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-shrink-0" style={{ minHeight: 520 }}>
        <img
          src="https://images.pexels.com/photos/7102037/pexels-photo-7102037.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          alt="Mülakat görseli"
          className="w-full h-full object-cover"
          style={{ opacity: 0.4 }}
        />
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(10,12,15,0.7) 0%, rgba(20,15,50,0.6) 100%)',
          }}
        >
          <img src="/logo.png" alt="logo" className="w-28 h-28 object-contain mb-5"
            style={{ filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.4))' }} />
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#dee4ea' }}>
            Mülakat Soruları
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#596773', maxWidth: 200 }}>
            Kariyerinde bir adım öne geç. Binlerce soru, AI mülakat simülasyonu ve CV optimizasyonu seni bekliyor.
          </p>
        </div>
      </div>
    </div>
  )
}
