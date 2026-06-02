import * as React from 'react'
import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'
import {
  Mail, Lock, User, Eye, EyeOff, Shield,
  AlertTriangle, KeyRound, Phone, Loader2,
} from 'lucide-react'
import {
  loginWithEmail,
  signupWithEmail,
  loginWithGoogle as firebaseLoginWithGoogle,
  resetPassword as firebaseResetPassword,
  translateAuthError,
} from '../../lib/auth'
import { useAppStore } from '../../store/useAppStore'

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthMode = 'login' | 'signup' | 'reset'
type RegistrationStep = 'details' | 'verification' | 'complete'

export interface AuthFormProps {
  onSuccess?: (userData: { email: string; name?: string }) => void
  onClose?: () => void
  initialMode?: AuthMode
  className?: string
}

interface FormData {
  name: string; email: string; password: string; confirmPassword: string
  phone: string; agreeToTerms: boolean; agreeToKvkk: boolean; agreeToAI: boolean; rememberMe: boolean; verificationCode: string
}

interface FormErrors {
  name?: string; email?: string; password?: string; confirmPassword?: string
  phone?: string; agreeToTerms?: string; agreeToKvkk?: string; general?: string; verificationCode?: string
}

// ─── Password Strength ────────────────────────────────────────────────────────

function calcStrength(pw: string) {
  const r = {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw),
  }
  const score = Object.values(r).filter(Boolean).length
  const feedback: string[] = []
  if (!r.length) feedback.push('En az 8 karakter')
  if (!r.uppercase) feedback.push('Bir büyük harf')
  if (!r.lowercase) feedback.push('Bir küçük harf')
  if (!r.number) feedback.push('Bir rakam')
  if (!r.special) feedback.push('Bir özel karakter')
  return { score, feedback }
}

function getStrengthColor(score: number) {
  if (score <= 1) return 'text-red-500'
  if (score <= 2) return 'text-orange-500'
  if (score <= 3) return 'text-yellow-500'
  if (score <= 4) return 'text-blue-500'
  return 'text-emerald-500'
}

function getStrengthText(score: number) {
  if (score <= 1) return 'Çok Zayıf'
  if (score <= 2) return 'Zayıf'
  if (score <= 3) return 'Orta'
  if (score <= 4) return 'İyi'
  return 'Güçlü'
}

function PasswordStrengthIndicator({ password, dark }: { password: string; dark?: boolean }) {
  const { score, feedback } = calcStrength(password)
  if (!password) return null
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="flex-1 rounded-full h-1.5 overflow-hidden"
          style={{ background: dark !== false ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
        >
          <div
            className={cn('h-full rounded-full bg-current transition-all duration-300', getStrengthColor(score))}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className={cn('text-xs min-w-[52px] text-right', getStrengthColor(score))}>
          {getStrengthText(score)}
        </span>
      </div>
      {feedback.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {feedback.map((item, i) => (
            <div key={i} className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 flex-shrink-0 text-amber-400" />
              <span className="text-xs text-amber-400">{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── InputField ───────────────────────────────────────────────────────────────

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode
  error?: string
  rightElement?: React.ReactNode
  dark?: boolean
}

function InputField({ icon, error, rightElement, dark = true, className: _cls, ...rest }: InputFieldProps) {
  const [focused, setFocused] = useState(false)

  const borderColor = error
    ? (focused ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,0.55)')
    : (focused ? 'rgba(99,102,241,0.65)' : (dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.15)'))
  const boxShadow = focused
    ? (error ? '0 0 0 3px rgba(239,68,68,0.15)' : '0 0 0 3px rgba(99,102,241,0.18)')
    : 'none'

  return (
    <div>
      <div className="relative">
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex"
          style={{ color: 'rgba(100,116,139,0.85)' }}
        >
          {icon}
        </div>
        <input
          {...rest}
          style={{
            width: '100%',
            minHeight: 56,
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 44,
            paddingRight: rightElement ? 44 : 16,
            borderRadius: 12,
            border: `1px solid ${borderColor}`,
            background: dark ? 'rgba(255,255,255,0.08)' : '#f8fafc',
            color: dark ? 'rgba(226,232,240,0.95)' : '#0f172a',
            fontSize: 16,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow,
          }}
          className="auth-input"
          onFocus={e => { setFocused(true); rest.onFocus?.(e) }}
          onBlur={e => { setFocused(false); rest.onBlur?.(e) }}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 mt-1.5 text-xs text-red-400">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />{error}
        </p>
      )}
    </div>
  )
}

// ─── Google Icon ──────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

// ─── AuthForm ─────────────────────────────────────────────────────────────────

export function AuthForm({ onSuccess, onClose, initialMode = 'login', className }: AuthFormProps) {
  const theme = useAppStore(s => s.theme)
  const d = theme === 'dark'
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode)
  const [step, setStep] = useState<RegistrationStep>('details')
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm] = useState<FormData>({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', agreeToTerms: false, agreeToKvkk: false, agreeToAI: false, rememberMe: false, verificationCode: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  React.useEffect(() => {
    const saved = localStorage.getItem('userEmail')
    if (saved && authMode === 'login')
      setForm(p => ({ ...p, email: saved, rememberMe: localStorage.getItem('rememberMe') === 'true' }))
  }, [authMode])

  const validate = useCallback((field: keyof FormData, value: string | boolean): string => {
    switch (field) {
      case 'name': return (typeof value === 'string' && authMode === 'signup' && !value.trim()) ? 'İsim zorunludur' : ''
      case 'email':
        if (!value || (typeof value === 'string' && !value.trim())) return 'E-posta zorunludur'
        if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Geçerli bir e-posta adresi girin'
        return ''
      case 'password':
        if (!value) return 'Şifre zorunludur'
        if (typeof value === 'string' && value.length < 8) return 'Şifre en az 8 karakter olmalıdır'
        if (typeof value === 'string' && authMode === 'signup' && calcStrength(value).score < 3) return 'Şifre çok zayıf'
        return ''
      case 'confirmPassword': return (authMode === 'signup' && value !== form.password) ? 'Şifreler eşleşmiyor' : ''
      case 'phone': return (typeof value === 'string' && value && !/^\+?[\d\s\-()]+$/.test(value)) ? 'Geçerli bir telefon numarası girin' : ''
      case 'verificationCode': return (typeof value === 'string' && authMode === 'signup' && step === 'verification' && !/^\d{6}$/.test(value)) ? 'Kod 6 haneli olmalıdır' : ''
      case 'agreeToTerms': return (authMode === 'signup' && !value) ? 'Üyelik Sözleşmesini kabul etmelisiniz' : ''
      case 'agreeToKvkk': return (authMode === 'signup' && !value) ? 'Aydınlatma Metnini onaylamalısınız' : ''
      default: return ''
    }
  }, [form.password, authMode, step])

  const onChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setForm(p => ({ ...p, [field]: value }))
    if (touched[field]) setErrors(p => ({ ...p, [field]: validate(field, value) || undefined }))
  }, [touched, validate])

  const onBlur = useCallback((field: keyof FormData) => {
    setTouched(p => ({ ...p, [field]: true }))
    setErrors(p => ({ ...p, [field]: validate(field, form[field]) || undefined }))
  }, [form, validate])

  const validateAll = useCallback(() => {
    let fields: (keyof FormData)[] = []
    if (authMode === 'login') fields = ['email', 'password']
    else if (authMode === 'signup' && step === 'details') fields = ['name', 'email', 'password', 'confirmPassword']
    else if (authMode === 'signup' && step === 'verification') fields = ['agreeToTerms', 'agreeToKvkk']
    else if (authMode === 'reset') fields = ['email']
    const newErr: FormErrors = {}
    fields.forEach(f => { const e = validate(f, form[f]); if (e) newErr[f as keyof FormErrors] = e })
    setErrors(newErr)
    return Object.keys(newErr).length === 0
  }, [authMode, step, form, validate])

  // ─── Firebase handlers ────────────────────────────────────────────────────

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateAll()) return

    // Signup adım 1 → adım 2'ye geç
    if (authMode === 'signup' && step === 'details') {
      setStep('verification')
      return
    }

    setLoading(true); setErrors({})
    try {
      if (authMode === 'login') {
        const result = await loginWithEmail(form.email, form.password)
        if (form.rememberMe) {
          localStorage.setItem('userEmail', form.email)
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('userEmail')
          localStorage.removeItem('rememberMe')
        }
        setSuccessMsg('Giriş başarılı! Yönlendiriliyorsunuz...')
        onSuccess?.({ email: result.user.email ?? form.email, name: result.user.displayName ?? undefined })
      } else if (authMode === 'signup') {
        const result = await signupWithEmail(form.name, form.email, form.password)
        setSuccessMsg('Hesabın oluşturuldu!')
        setStep('complete')
        onSuccess?.({ email: result.user.email ?? form.email, name: form.name })
      } else {
        await firebaseResetPassword(form.email)
        setSuccessMsg('Sıfırlama bağlantısı e-posta adresinize gönderildi!')
        setTimeout(() => switchMode('login'), 3000)
      }
    } catch (err) {
      setErrors({ general: translateAuthError(err) })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true); setErrors({})
    try {
      const result = await firebaseLoginWithGoogle()
      // Mobile: signInWithRedirect returns void and navigates away — result will be null/undefined
      // Desktop: signInWithPopup returns UserCredential
      if (!result || !('user' in result)) return
      setSuccessMsg('Google ile giriş başarılı!')
      onSuccess?.({ email: result.user.email ?? '', name: result.user.displayName ?? undefined })
    } catch (err) {
      setErrors({ general: translateAuthError(err) })
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: AuthMode) => { setAuthMode(m); setStep('details'); setErrors({}); setSuccessMsg('') }

  // ─── Eye toggle button ────────────────────────────────────────────────────

  const EyeBtn = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className="text-slate-500 hover:text-slate-300 transition-colors flex"
      aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )

  const showSocial = authMode !== 'reset' && step === 'details'

  // ─── Content sections ─────────────────────────────────────────────────────

  const renderContent = () => {
    // Password Reset
    if (authMode === 'reset') return (
      <div className="space-y-5">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/15 mb-4">
            <KeyRound className="h-5 w-5 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: d ? '#f1f5f9' : '#0f172a' }}>Şifre Kurtarma</h3>
          <p className="text-sm text-slate-500">E-posta adresinizi girin, sıfırlama bağlantısı gönderelim.</p>
        </div>

        <InputField
          dark={d}
          icon={<Mail className="h-4 w-4" />}
          type="email"
          placeholder="E-posta Adresi"
          value={form.email}
          onChange={e => onChange('email', e.target.value)}
          onBlur={() => onBlur('email')}
          error={errors.email}
        />

        <button
          type="submit"
          disabled={loading || !form.email}
          className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm text-white
            bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/30
            hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500/30
            disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ minHeight: 52, padding: '14px 24px' }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><KeyRound className="h-4 w-4" /> Sıfırlama Bağlantısı Gönder</>}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className="text-sm text-slate-500 hover:text-blue-400 transition-colors"
          >
            ← Girişe dön
          </button>
        </div>
      </div>
    )

    // Signup Adım 2 — Sözleşmeler
    if (authMode === 'signup' && step === 'verification') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* İlerleme */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="h-0.5 w-10 bg-indigo-600 rounded-full" />
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">2</span>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold" style={{ color: d ? '#f1f5f9' : '#0f172a' }}>Son Adım</h3>
          <p className="text-sm text-slate-500 mt-1">Sözleşmeleri onaylayın ve hesabınızı oluşturun</p>
        </div>

        {/* Telefon (isteğe bağlı) */}
        <InputField
          dark={d}
          icon={<Phone className="h-4 w-4" />}
          type="tel"
          placeholder="Telefon Numarası (İsteğe Bağlı)"
          value={form.phone}
          onChange={e => onChange('phone', e.target.value)}
          onBlur={() => onBlur('phone')}
          error={errors.phone}
        />

        {/* Sözleşmeler */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.agreeToTerms}
              onChange={e => onChange('agreeToTerms', e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded accent-indigo-500 cursor-pointer flex-shrink-0"
            />
            <span className="text-sm text-slate-500 leading-snug">
              <Link to="/kullanim-sartlari" target="_blank" className="text-slate-400 underline hover:text-slate-300 transition-colors">Üyelik Sözleşmesi</Link>'ni okudum, kabul ediyorum.{' '}
              <span className="text-red-400">*</span>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="flex items-center gap-1 text-xs text-red-400 -mt-2">
              <AlertTriangle className="h-3 w-3" />{errors.agreeToTerms}
            </p>
          )}

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.agreeToKvkk}
              onChange={e => onChange('agreeToKvkk', e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded accent-indigo-500 cursor-pointer flex-shrink-0"
            />
            <span className="text-sm text-slate-500 leading-snug">
              <Link to="/gizlilik-politikasi" target="_blank" className="text-slate-400 underline hover:text-slate-300 transition-colors">Aydınlatma Metni</Link>'ni okudum, kişisel verilerimin işlenmesini kabul ediyorum.{' '}
              <span className="text-red-400">*</span>
            </span>
          </label>
          {errors.agreeToKvkk && (
            <p className="flex items-center gap-1 text-xs text-red-400 -mt-2">
              <AlertTriangle className="h-3 w-3" />{errors.agreeToKvkk}
            </p>
          )}

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.agreeToAI}
              onChange={e => onChange('agreeToAI', e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded accent-indigo-500 cursor-pointer flex-shrink-0"
            />
            <span className="text-sm text-slate-500 leading-snug">
              Verilerimin AI analizleri için yurt dışına aktarılmasına{' '}
              <Link to="/gizlilik-politikasi" target="_blank" className="text-slate-400 underline hover:text-slate-300 transition-colors">açık rıza</Link> veriyorum.{' '}
              <span className="text-xs text-slate-600">(İsteğe bağlı)</span>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm text-white
            bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/30
            hover:opacity-90 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ minHeight: 52 }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Hesap Oluştur'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setStep('details')}
            className="text-sm text-slate-500 hover:text-blue-400 transition-colors"
          >
            ← Bilgilere dön
          </button>
        </div>
      </div>
    )

    // Registration Complete
    if (authMode === 'signup' && step === 'complete') return (
      <div className="text-center space-y-6 py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15">
          <svg className="w-8 h-8" fill="none" stroke="#34d399" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-1" style={{ color: d ? '#f1f5f9' : '#0f172a' }}>Hoş Geldin!</h3>
          <p className="text-sm text-slate-500">Hesabın başarıyla oluşturuldu.</p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white
            bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/30
            hover:opacity-90 focus:outline-none transition-all"
        >
          Başla
        </button>
      </div>
    )

    // Main login / signup adım 1
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {authMode === 'signup' ? (
          /* ── Signup: 2 sütunlu grid ── */
          <>
            {/* Adım göstergesi */}
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">1</span>
              </div>
              <div className="h-0.5 w-8 rounded-full" style={{ background: d ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }} />
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ border: `2px solid ${d ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}` }}>
                <span className="text-xs font-bold" style={{ color: d ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>2</span>
              </div>
            </div>

            {/* Satır 1: Ad Soyad | E-posta */}
            <div className="grid grid-cols-2 gap-4">
              <InputField
                dark={d} icon={<User className="h-4 w-4" />}
                type="text" placeholder="Ad Soyad"
                value={form.name} onChange={e => onChange('name', e.target.value)}
                onBlur={() => onBlur('name')} error={errors.name}
              />
              <InputField
                dark={d} icon={<Mail className="h-4 w-4" />}
                type="email" placeholder="E-posta Adresi"
                value={form.email} onChange={e => onChange('email', e.target.value)}
                onBlur={() => onBlur('email')} error={errors.email}
              />
            </div>

            {/* Satır 2: Şifre | Şifre Tekrar */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <InputField
                  dark={d} icon={<Lock className="h-4 w-4" />}
                  type={showPw ? 'text' : 'password'} placeholder="Şifre"
                  value={form.password} onChange={e => onChange('password', e.target.value)}
                  onBlur={() => onBlur('password')} error={errors.password}
                  rightElement={<EyeBtn show={showPw} onToggle={() => setShowPw(v => !v)} />}
                />
                <PasswordStrengthIndicator dark={d} password={form.password} />
              </div>
              <InputField
                dark={d} icon={<Shield className="h-4 w-4" />}
                type={showCPw ? 'text' : 'password'} placeholder="Şifre Tekrar"
                value={form.confirmPassword} onChange={e => onChange('confirmPassword', e.target.value)}
                onBlur={() => onBlur('confirmPassword')} error={errors.confirmPassword}
                rightElement={<EyeBtn show={showCPw} onToggle={() => setShowCPw(v => !v)} />}
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm text-white
                bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/30
                hover:opacity-90 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ minHeight: 52 }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Devam Et →'}
            </button>
          </>
        ) : (
          /* ── Login: tek sütun ── */
          <>
            <InputField
              dark={d} icon={<Mail className="h-4 w-4" />}
              type="email" placeholder="E-posta Adresi"
              value={form.email} onChange={e => onChange('email', e.target.value)}
              onBlur={() => onBlur('email')} error={errors.email}
            />
            <div>
              <InputField
                dark={d} icon={<Lock className="h-4 w-4" />}
                type={showPw ? 'text' : 'password'} placeholder="Şifre"
                value={form.password} onChange={e => onChange('password', e.target.value)}
                onBlur={() => onBlur('password')} error={errors.password}
                rightElement={<EyeBtn show={showPw} onToggle={() => setShowPw(v => !v)} />}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                <input type="checkbox" checked={form.rememberMe}
                  onChange={e => onChange('rememberMe', e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" style={{ accentColor: '#6366f1' }} />
                <span className="text-sm text-slate-500">Beni hatırla</span>
              </label>
              <button type="button" onClick={() => setAuthMode('reset')}
                className="text-sm text-slate-500 hover:text-blue-400 transition-colors py-1 px-1">
                Şifremi unuttum?
              </button>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm text-white
                bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/30
                hover:opacity-90 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ minHeight: 52 }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Giriş Yap'}
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={cn(className)} style={{ paddingTop: 44, paddingBottom: 44, paddingLeft: 56, paddingRight: 56 }}>
      {/* Başarı bildirimi */}
      {successMsg && (
        <div className="flex items-center gap-2 mb-5 rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="#34d399" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-emerald-300">{successMsg}</span>
        </div>
      )}

      {/* Hata bildirimi */}
      {errors.general && (
        <div className="flex items-center gap-2 mb-5 rounded-xl p-3 bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-400" />
          <span className="text-sm text-red-400">{errors.general}</span>
        </div>
      )}

      {/* Başlık */}
      {showSocial && (
        <div className="text-center mb-8">
          <h2
            className="font-bold tracking-tight"
            style={{ fontSize: 30, lineHeight: 1.2, color: d ? '#f1f5f9' : '#0f172a' }}
          >
            {authMode === 'login' ? 'Tekrar Hoş Geldin' : 'Hesabını Oluştur'}
          </h2>
          <p className="text-sm text-slate-500" style={{ marginTop: 14 }}>
            {authMode === 'login' ? 'Hesabına giriş yap' : 'Dakikalar içinde ücretsiz başla'}
          </p>
        </div>
      )}

      {/* Tab Switcher — underline */}
      {showSocial && (
        <div
          className="flex mb-4"
          style={{ borderBottom: `1px solid ${d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}` }}
        >
          {(['login', 'signup'] as AuthMode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className="relative flex-1 pb-3 text-sm font-semibold transition-colors"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: authMode === m ? (d ? '#f1f5f9' : '#0f172a') : '#64748b',
                letterSpacing: '0.01em',
              }}
            >
              {m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              {authMode === m && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ background: 'linear-gradient(to right, #2563eb, #6366f1)' }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Google Button */}
      {showSocial && (
        <>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl font-semibold text-sm mb-8
              focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            style={{
              minHeight: 56,
              padding: '16px 20px',
              background: d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${d ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
              color: d ? '#cbd5e1' : '#475569',
              fontSize: 16,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = d ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)')}
          >
            <GoogleIcon />
            Google ile devam et
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#94a3b8' }}>veya e-posta ile</span>
            <div className="flex-1 h-px" style={{ background: d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
          </div>
        </>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {renderContent()}
      </form>

      {/* Alt link */}
      {showSocial && (
        <p className="text-center text-sm mt-8 text-slate-600">
          {authMode === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}{' '}
          <button
            type="button"
            onClick={() => switchMode(authMode === 'login' ? 'signup' : 'login')}
            className="text-slate-400 hover:text-blue-400 font-medium transition-colors"
          >
            {authMode === 'login' ? 'Ücretsiz kayıt ol →' : 'Giriş yap →'}
          </button>
        </p>
      )}
    </div>
  )
}
