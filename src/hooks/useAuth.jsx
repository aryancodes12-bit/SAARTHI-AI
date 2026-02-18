import { useState, useEffect, createContext, useContext } from 'react'
import { onAuthChange } from '../firebase/auth'
import { getUserProfile } from '../firebase/firestore'
import Cookies from 'js-cookie'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [consentGiven, setConsentGiven] = useState(
    Cookies.get('saarthi_consent') === 'true'
  )

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        const profile = await getUserProfile(firebaseUser.uid)
        console.log('Profile loaded:', profile)
        console.log('Role:', profile?.role)
        setUserProfile(profile)
        if (profile?.consentGiven) {
          Cookies.set('saarthi_consent', 'true', { expires: 365 })
          setConsentGiven(true)
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const refreshProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.uid)
      setUserProfile(profile)
    }
  }

  const grantConsent = () => {
    Cookies.set('saarthi_consent', 'true', { expires: 365 })
    setConsentGiven(true)
  }

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      consentGiven,
      grantConsent,
      refreshProfile,
      isAgent: userProfile?.role === 'agent' || userProfile?.role === 'admin',
      isAdmin: userProfile?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}