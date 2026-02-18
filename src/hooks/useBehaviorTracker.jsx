import { useEffect, useCallback, useRef } from 'react'
import Cookies from 'js-cookie'
import { trackBehavior, updateUserProfile } from '../firebase/firestore'
import { useAuth } from './useAuth'

const SESSION_KEY = 'saarthi_session'
const BEHAVIOR_KEY = 'saarthi_behavior'

function getSession() {
  try {
    return JSON.parse(Cookies.get(SESSION_KEY) || '{}')
  } catch {
    return {}
  }
}

function getBehavior() {
  try {
    return JSON.parse(localStorage.getItem(BEHAVIOR_KEY) || '{}')
  } catch {
    return {}
  }
}

export function useBehaviorTracker() {
  const { user, userProfile, consentGiven } = useAuth()
  const startTime = useRef(Date.now())

  // ─── Track a page view ───────────────────────────────────────────
  const trackPageView = useCallback((page) => {
    if (!consentGiven) return

    const session = getSession()
    const behavior = getBehavior()

    const views = behavior.pageViews || {}
    views[page] = (views[page] || 0) + 1
    behavior.pageViews = views
    behavior.lastPage = page
    behavior.lastSeen = new Date().toISOString()

    localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(behavior))

    // Cookie for session
    Cookies.set(SESSION_KEY, JSON.stringify({
      ...session,
      lastPage: page,
      sessionStart: session.sessionStart || new Date().toISOString(),
    }), { expires: 1 })

    // Firestore (non-PII event)
    if (user) {
      trackBehavior(user.uid, { type: 'PAGE_VIEW', page, timestamp: new Date().toISOString() })
    }
  }, [consentGiven, user])

  // ─── Track product interest ──────────────────────────────────────
  const trackProductView = useCallback((productName, category) => {
    if (!consentGiven) return

    const behavior = getBehavior()
    const interests = behavior.productInterests || {}
    if (!interests[category]) interests[category] = []
    if (!interests[category].includes(productName)) {
      interests[category].push(productName)
    }
    behavior.productInterests = interests
    localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(behavior))

    if (user) {
      trackBehavior(user.uid, { type: 'PRODUCT_VIEW', productName, category })
    }
  }, [consentGiven, user])

  // ─── Track time on page ──────────────────────────────────────────
  const trackTimeOnPage = useCallback((page) => {
    if (!consentGiven) return
    const elapsed = Math.round((Date.now() - startTime.current) / 1000)
    if (user && elapsed > 5) {
      trackBehavior(user.uid, { type: 'TIME_ON_PAGE', page, seconds: elapsed })
    }
  }, [consentGiven, user])

  // ─── Compute intent score (simple heuristic) ─────────────────────
  const computeIntentScore = useCallback(async () => {
    if (!user || !consentGiven) return 0

    const behavior = getBehavior()
    let score = 0

    const pageViews = behavior.pageViews || {}
    score += Math.min((pageViews['/dashboard'] || 0) * 10, 30)
    score += Math.min((pageViews['/chat'] || 0) * 15, 30)

    const interests = behavior.productInterests || {}
    const totalProducts = Object.values(interests).flat().length
    score += Math.min(totalProducts * 5, 40)

    score = Math.min(score, 100)

    // Save to Firestore
    await updateUserProfile(user.uid, { intentScore: score, behaviorSummary: behavior })

    return score
  }, [user, consentGiven])

  // ─── Get stored behavior ─────────────────────────────────────────
  const getBehaviorData = useCallback(() => getBehavior(), [])

  // Auto-compute intent score on mount
  useEffect(() => {
    if (user && consentGiven) {
      const timer = setTimeout(() => computeIntentScore(), 3000)
      return () => clearTimeout(timer)
    }
  }, [user, consentGiven, computeIntentScore])

  return { trackPageView, trackProductView, trackTimeOnPage, computeIntentScore, getBehaviorData }
}
