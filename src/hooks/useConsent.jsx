import { useState, useCallback } from 'react'
import { saveConsent, revokeConsent } from '../firebase/firestore'
import { useAuth } from './useAuth'

export function useConsent() {
  const { user, grantConsent } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const submitConsent = useCallback(async (consentData) => {
    setSaving(true)
    setError(null)
    try {
      if (user) {
        await saveConsent(user.uid, consentData)
      }
      grantConsent()
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setSaving(false)
    }
  }, [user, grantConsent])

  const withdrawConsent = useCallback(async () => {
    setSaving(true)
    try {
      if (user) await revokeConsent(user.uid)
      // Clear cookies
      document.cookie.split(';').forEach(c => {
        document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
      })
      localStorage.removeItem('saarthi_behavior')
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false }
    } finally {
      setSaving(false)
    }
  }, [user])

  return { submitConsent, withdrawConsent, saving, error }
}
