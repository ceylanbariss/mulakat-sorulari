import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as _signOut,
  sendPasswordResetEmail,
  updateProfile,
  type AuthError,
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'

// ─── Türkçe hata mesajları ────────────────────────────────────────────────────

export function translateAuthError(error: unknown): string {
  const code = (error as AuthError)?.code ?? ''
  switch (code) {
    case 'auth/email-already-in-use':      return 'Bu e-posta adresi zaten kayıtlı'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':            return 'E-posta adresi veya şifre hatalı'
    case 'auth/invalid-email':             return 'Geçersiz e-posta adresi'
    case 'auth/weak-password':             return 'Şifre çok zayıf (en az 6 karakter)'
    case 'auth/too-many-requests':         return 'Çok fazla deneme yapıldı. Lütfen bir süre bekleyin'
    case 'auth/network-request-failed':    return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':   return 'Google girişi iptal edildi'
    case 'auth/popup-blocked':             return 'Popup engellendi. Lütfen izin verin ve tekrar deneyin'
    case 'auth/account-exists-with-different-credential':
                                           return 'Bu e-posta başka bir yöntemle kayıtlı'
    default:                               return 'Bir hata oluştu. Lütfen tekrar deneyin'
  }
}

// ─── Auth fonksiyonları ───────────────────────────────────────────────────────

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signupWithEmail(name: string, email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  if (name.trim()) {
    await updateProfile(result.user, { displayName: name.trim() })
  }
  return result
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email)
}

export async function logout() {
  return _signOut(auth)
}
