import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { serverTimestamp } from 'firebase/firestore'
import { auth } from '../lib/firebase'
import { useAuthStore } from '../store/useAuthStore'
import { setDocument, userProfilesCol } from '../lib/firestore'

/**
 * Uygulama başlatıldığında Firebase auth durumunu dinler.
 * Kullanıcı oturumu açık/kapalı olduğunda store'u günceller.
 * Giriş yapıldığında Firestore'da userProfiles dokümanını oluşturur/günceller.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore(s => s.setUser)
  const setLoading = useAuthStore(s => s.setLoading)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      setLoading(false)

      if (user) {
        // userProfiles koleksiyonuna kayıt — admin panelinde görmek için
        try {
          await setDocument(userProfilesCol(), user.uid, {
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? '',
            photoURL: user.photoURL ?? '',
            lastLogin: serverTimestamp(),
          })
        } catch {
          // sessizce geç — profil sync kritik değil
        }
      }
    })
    return unsubscribe
  }, [setUser, setLoading])

  return <>{children}</>
}
