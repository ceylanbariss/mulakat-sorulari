import * as React from 'react'
import { useState, useCallback } from 'react'
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
  phone: string; agreeToTerms: boolean; rememberMe: boolean; verificationCode: string
}

interface FormErrors {
  name?: string; email?: string; password?: string; confirmPassword?: string
  phone?: string; agreeToTerms?: string; general?: string; verificationCode?: string
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

function PasswordStrengthIndicator({ password }: { password: string }) {
  const { score, feedback } = calcStrength(password)
  if (!password) return null
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
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
}

function InputField({ icon, error, rightElement, className: _cls, ...rest }: InputFieldProps) {
  const [focused, setFocused] = useState(false)

  const borderColor = error
    ? (focused ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,0.55)')
    : (focused ? 'rgba(99,102,241,0.65)' : 'rgba(255,255,255,0.14)')
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
            minHeight: 52,
            paddingTop: 14,
            paddingBottom: 14,
            paddingLeft: 44,
            paddingRight: rightElement ? 44 : 16,
            borderRadius: 12,
            border: `1px solid ${borderColor}`,
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(226,232,240,0.95)',
            fontSize: 15,
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

// ─── OTP Input ────────────────────────────────────────────────────────────────

function OtpInput({ value, error, onChange, onBlur }: {
  value: string; error?: string; onChange: (v: string) => void; onBlur: () => void
}) {
  const [focused, setFocused] = useState(false)
  const borderColor = error
    ? (focused ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,0.55)')
    : (focused ? 'rgba(99,102,241,0.65)' : 'rgba(255,255,255,0.14)')
  const boxShadow = focused
    ? (error ? '0 0 0 3px rgba(239,68,68,0.15)' : '0 0 0 3px rgba(99,102,241,0.18)')
    : 'none'
  return (
    <div>
      <input
        type="text"
        placeholder="000000"
        value={value}
        maxLength={6}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); onBlur() }}
        style={{
          width: '100%',
          minHeight: 56,
          padding: '14px 16px',
          borderRadius: 12,
          textAlign: 'center',
          background: 'rgba(255,255,255,0.08)',
          color: '#f1f5f9',
          border: `1px solid ${borderColor}`,
          fontSize: 24,
          fontFamily: 'monospace',
          letterSpacing: '0.5em',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow,
        }}
      />
      {error && (
        <p className="flex items-center justify-center gap-1 mt-1.5 text-xs text-red-400">
          <AlertTriangle className="h-3 w-3" />{error}
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
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode)
  const [step, setStep] = useState<RegistrationStep>('details')
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm] = useState<FormData>({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', agreeToTerms: false, rememberMe: false, verificationCode: '',
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
      case 'agreeToTerms': return (authMode === 'signup' && !value) ? 'Koşulları kabul etmelisiniz' : ''
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
    const fields: (keyof FormData)[] = ['email']
    if (authMode !== 'reset') fields.push('password')
    if (authMode === 'signup') fields.push('name', 'confirmPassword', 'agreeToTerms')
    if (step === 'verification') fields.push('verificationCode')
    const newErr: FormErrors = {}
    fields.forEach(f => { const e = validate(f, form[f]); if (e) newErr[f as keyof FormErrors] = e })
    setErrors(newErr)
    return Object.keys(newErr).length === 0
  }, [authMode, step, form, validate])

  // ─── Firebase handlers ────────────────────────────────────────────────────

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateAll()) return
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
          <h3 className="text-lg font-semibold text-slate-100 mb-1">Şifre Kurtarma</h3>
          <p className="text-sm text-slate-500">E-posta adresinizi girin, sıfırlama bağlantısı gönderelim.</p>
        </div>

        <InputField
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

    // Email Verification
    if (authMode === 'signup' && step === 'verification') return (
      <div className="space-y-5">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/15 mb-4">
            <Mail className="h-5 w-5 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-1">E-postanı Doğrula</h3>
          <p className="text-sm text-slate-500">
            <span className="text-slate-300 font-medium">{form.email}</span> adresine 6 haneli kod gönderdik.
          </p>
        </div>

        <OtpInput
          value={form.verificationCode}
          error={errors.verificationCode}
          onChange={v => onChange('verificationCode', v)}
          onBlur={() => onBlur('verificationCode')}
        />

        <button
          type="submit"
          disabled={loading || form.verificationCode.length !== 6}
          className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm text-white
            bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/30
            hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500/30
            disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ minHeight: 52, padding: '14px 24px' }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'E-postayı Doğrula'}
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
          <h3 className="text-xl font-bold text-slate-100 mb-1">Hoş Geldin!</h3>
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

    // Main login / signup
    return (
      <div className="space-y-4" style={{ gap: 16 }}>
        {authMode === 'signup' && (
          <InputField
            icon={<User className="h-4 w-4" />}
            type="text"
            placeholder="Ad Soyad"
            value={form.name}
            onChange={e => onChange('name', e.target.value)}
            onBlur={() => onBlur('name')}
            error={errors.name}
          />
        )}

        <InputField
          icon={<Mail className="h-4 w-4" />}
          type="email"
          placeholder="E-posta Adresi"
          value={form.email}
          onChange={e => onChange('email', e.target.value)}
          onBlur={() => onBlur('email')}
          error={errors.email}
        />

        <div>
          <InputField
            icon={<Lock className="h-4 w-4" />}
            type={showPw ? 'text' : 'password'}
            placeholder="Şifre"
            value={form.password}
            onChange={e => onChange('password', e.target.value)}
            onBlur={() => onBlur('password')}
            error={errors.password}
            rightElement={<EyeBtn show={showPw} onToggle={() => setShowPw(v => !v)} />}
          />
          {authMode === 'signup' && <PasswordStrengthIndicator password={form.password} />}
        </div>

        {authMode === 'signup' && (<>
          <InputField
            icon={<Shield className="h-4 w-4" />}
            type={showCPw ? 'text' : 'password'}
            placeholder="Şifre Tekrar"
            value={form.confirmPassword}
            onChange={e => onChange('confirmPassword', e.target.value)}
            onBlur={() => onBlur('confirmPassword')}
            error={errors.confirmPassword}
            rightElement={<EyeBtn show={showCPw} onToggle={() => setShowCPw(v => !v)} />}
          />
          <InputField
            icon={<Phone className="h-4 w-4" />}
            type="tel"
            placeholder="Telefon Numarası (İsteğe Bağlı)"
            value={form.phone}
            onChange={e => onChange('phone', e.target.value)}
            onBlur={() => onBlur('phone')}
            error={errors.phone}
          />
        </>)}

        <div className="flex items-center justify-between pt-0.5">
          {authMode === 'login' ? (<>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={e => onChange('rememberMe', e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/10 accent-indigo-500 cursor-pointer"
              />
              <span className="text-sm text-slate-500">Beni hatırla</span>
            </label>
            <button
              type="button"
              onClick={() => setAuthMode('reset')}
              className="text-sm text-slate-500 hover:text-blue-400 transition-colors"
            >
              Şifremi unuttum?
            </button>
          </>) : (
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.agreeToTerms}
                onChange={e => onChange('agreeToTerms', e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-white/20 bg-white/10 accent-indigo-500 cursor-pointer flex-shrink-0"
              />
              <span className="text-sm text-slate-500">
                <a href="#" className="text-slate-400 underline hover:text-slate-300 transition-colors">Kullanım Koşulları</a>
                {' '}ve{' '}
                <a href="#" className="text-slate-400 underline hover:text-slate-300 transition-colors">Gizlilik Politikası</a>
                'nı kabul ediyorum
              </span>
            </label>
          )}
        </div>

        {errors.agreeToTerms && (
          <p className="flex items-center gap-1 text-xs text-red-400">
            <AlertTriangle className="h-3 w-3" />{errors.agreeToTerms}
          </p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm text-white
              bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/30
              hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500/30
              disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ minHeight: 52, padding: '14px 24px' }}
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : (authMode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur')
            }
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(className)} style={{ paddingTop: 48, paddingBottom: 48, paddingLeft: 40, paddingRight: 40 }}>
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
            className="font-bold tracking-tight text-slate-100"
            style={{ fontSize: 30, lineHeight: 1.2 }}
          >
            {authMode === 'login' ? 'Tekrar Hoş Geldin' : 'Hesabını Oluştur'}
          </h2>
          <p className="text-sm text-slate-500" style={{ marginTop: 8 }}>
            {authMode === 'login' ? 'Hesabına giriş yap' : 'Dakikalar içinde ücretsiz başla'}
          </p>
        </div>
      )}

      {/* Tab Switcher — underline */}
      {showSocial && (
        <div
          className="flex mb-7"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
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
                color: authMode === m ? '#f1f5f9' : '#475569',
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
            className="w-full flex items-center justify-center gap-3 rounded-xl font-semibold text-sm mb-6
              focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            style={{
              minHeight: 52,
              padding: '14px 20px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#cbd5e1',
              fontSize: 15,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.11)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          >
            <GoogleIcon />
            Google ile devam et
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#334155' }}>veya e-posta ile</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>
        </>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {renderContent()}
      </form>

      {/* Alt link */}
      {showSocial && (
        <p className="text-center text-sm mt-6 text-slate-600">
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
