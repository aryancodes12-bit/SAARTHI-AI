import Cookies from 'js-cookie'

/**
 * Consent Checker — Guards all AI/tracking features
 * Implements DPDP Act 2023 consent-first architecture
 */

export const CONSENT_TYPES = {
  ESSENTIAL: 'essential',       // Always required, cannot opt-out
  ANALYTICS: 'analytics',       // Behavioral tracking
  MARKETING: 'marketing',       // Personalized recommendations
  AI_PROCESSING: 'aiProcessing', // AI model processing
  VOICE: 'voice',               // Voice agent features
}

/**
 * Check if user has given specific consent
 */
export function hasConsent(type) {
  if (type === CONSENT_TYPES.ESSENTIAL) return true // Always true

  const consentData = getConsentData()
  if (!consentData) return false

  return consentData[type] === true
}

/**
 * Get all consent data from cookies
 */
export function getConsentData() {
  try {
    const raw = Cookies.get('saarthi_consent_details')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Save consent to cookie (also saved to Firestore via useConsent hook)
 */
export function saveConsentCookie(consentData) {
  Cookies.set('saarthi_consent_details', JSON.stringify(consentData), {
    expires: 365,
    sameSite: 'Strict',
    secure: process.env.NODE_ENV === 'production',
  })
  Cookies.set('saarthi_consent', 'true', {
    expires: 365,
    sameSite: 'Strict',
  })
}

/**
 * Clear all consent data (opt-out)
 */
export function clearAllConsent() {
  Cookies.remove('saarthi_consent')
  Cookies.remove('saarthi_consent_details')
  Cookies.remove('saarthi_session')
  localStorage.removeItem('saarthi_behavior')
}

/**
 * Guard function — throws if consent not given
 */
export function requireConsent(type, featureName) {
  if (!hasConsent(type)) {
    throw new Error(
      `Feature "${featureName}" requires "${type}" consent. ` +
      `Please update your consent preferences in Settings.`
    )
  }
}

/**
 * Get consent summary for display
 */
export function getConsentSummary() {
  const data = getConsentData()
  if (!data) return { given: false, types: [] }

  const types = Object.entries(CONSENT_TYPES)
    .filter(([, v]) => v !== 'essential')
    .map(([key, v]) => ({
      key,
      type: v,
      given: data[v] === true,
    }))

  return { given: true, types }
}
