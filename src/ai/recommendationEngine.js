/**
 * Recommendation Engine
 * Combines life events + behavior + Claude AI to generate
 * hyper-personalized insurance recommendations
 */

import { generateRecommendations, chatWithClaude } from './claudeAgent'
import { getRecommendations, saveRecommendations } from '../firebase/firestore'
import { hasConsent, CONSENT_TYPES } from '../utils/consentChecker'

const ALL_PRODUCTS = [
  { id: 'p1', name: 'SecureTerm 30', type: 'Term Life', category: 'Life', icon: '🛡️', tags: ['MARRIAGE', 'NEW_BABY', 'NEW_JOB'] },
  { id: 'p2', name: 'Family Shield Term 20', type: 'Term Life', category: 'Life', icon: '👨‍👩‍👧', tags: ['MARRIAGE', 'NEW_BABY'] },
  { id: 'p3', name: 'BrightFuture Child ULIP', type: 'Child Plan', category: 'Life', icon: '🎓', tags: ['NEW_BABY'] },
  { id: 'p4', name: 'EduGrow Child ULIP Plus', type: 'Child Plan', category: 'Life', icon: '📚', tags: ['NEW_BABY'] },
  { id: 'p5', name: 'HealthGuard Comprehensive', type: 'Health', category: 'Health', icon: '❤️', tags: ['MARRIAGE', 'NEW_BABY', 'HEALTH_CONCERN'] },
  { id: 'p6', name: 'WellnessPrime Health Plan', type: 'Health', category: 'Health', icon: '💊', tags: ['NEW_BABY', 'HEALTH_CONCERN'] },
  { id: 'p7', name: 'HomeSafe Standard Cover', type: 'Home Insurance', category: 'Property', icon: '🏠', tags: ['HOME_PURCHASE'] },
  { id: 'p8', name: 'HomeShield Premium', type: 'Home Insurance', category: 'Property', icon: '🏡', tags: ['HOME_PURCHASE'] },
  { id: 'p9', name: 'GoldenNest Retirement Plan', type: 'Retirement', category: 'Retirement', icon: '🌅', tags: ['RETIREMENT_PLAN'] },
  { id: 'p10', name: 'FutureIncome Retirement Plus', type: 'Retirement', category: 'Retirement', icon: '💰', tags: ['RETIREMENT_PLAN'] },
  { id: 'p11', name: 'DriveEasy Motor Protect', type: 'Motor', category: 'Property', icon: '🚗', tags: ['CAR_PURCHASE'] },
  { id: 'p12', name: 'RoadGuard Comprehensive', type: 'Motor', category: 'Property', icon: '🚙', tags: ['CAR_PURCHASE'] },
]

/**
 * Rule-based recommendations from life events (fast, no API call)
 */
export function getRuleBasedRecommendations(lifeEvents = []) {
  const eventTypes = lifeEvents.map(e => e.type)
  if (eventTypes.length === 0) return ALL_PRODUCTS.slice(0, 3) // Default top 3

  const scored = ALL_PRODUCTS.map(product => ({
    ...product,
    score: product.tags.filter(t => eventTypes.includes(t)).length,
  }))

  return scored
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
}

/**
 * AI-powered recommendations (uses Claude, requires AI consent)
 */
export async function getAIRecommendations(userProfile, lifeEvents, behaviorData) {
  if (!hasConsent(CONSENT_TYPES.AI_PROCESSING)) {
    return getRuleBasedRecommendations(lifeEvents)
  }

  try {
    // Check cache first (valid for 1 hour)
    const cached = await getRecommendations(userProfile.uid)
    if (cached?.length > 0 && cached[0].generatedAt) {
      const age = Date.now() - new Date(cached[0].generatedAt).getTime()
      if (age < 3600000) return cached // Return if < 1 hour old
    }

    // Generate fresh recommendations
    const aiRecs = await generateRecommendations(userProfile, lifeEvents, behaviorData)

    if (aiRecs.length > 0) {
      const enriched = aiRecs.map(rec => ({
        ...rec,
        generatedAt: new Date().toISOString(),
        source: 'AI',
      }))
      await saveRecommendations(userProfile.uid, enriched)
      return enriched
    }

    return getRuleBasedRecommendations(lifeEvents)
  } catch (err) {
    console.error('AI recommendations failed, falling back to rules:', err)
    return getRuleBasedRecommendations(lifeEvents)
  }
}

/**
 * Explain a recommendation in plain language
 */
export async function explainRecommendation(productName, userContext) {
  const result = await chatWithClaude([
    {
      role: 'user',
      content: `Explain in 2 simple sentences why "${productName}" is right for someone with this context: ${JSON.stringify(userContext)}. Be specific and mention the life event if relevant.`
    }
  ], userContext)

  return result.success ? result.text : `${productName} is recommended based on your current life stage and needs.`
}

export { ALL_PRODUCTS }
