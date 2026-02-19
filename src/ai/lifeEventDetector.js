/**
 * Life Event Detector
 * Uses Claude to detect life events from user messages
 * that trigger personalized insurance recommendations
 */

import { chatWithClaude } from './claudeAgent'
import { addLifeEvent } from '../firebase/firestore'
import { sendLifeEventEmail } from '../utils/smsSender'

export const LIFE_EVENTS = {
  MARRIAGE: { type: 'MARRIAGE', label: '💍 Marriage', products: ['Term Life', 'Health Insurance'] },
  NEW_BABY: { type: 'NEW_BABY', label: '👶 New Baby', products: ['Child Plan', 'Health Insurance', 'Term Life'] },
  HOME_PURCHASE: { type: 'HOME_PURCHASE', label: '🏠 Home Purchase', products: ['Home Insurance', 'Term Life'] },
  NEW_JOB: { type: 'NEW_JOB', label: '💼 New Job', products: ['Health Insurance', 'Term Life'] },
  RETIREMENT_PLAN: { type: 'RETIREMENT_PLAN', label: '🌅 Planning Retirement', products: ['Retirement Plan'] },
  HEALTH_CONCERN: { type: 'HEALTH_CONCERN', label: '❤️ Health Concern', products: ['Health Insurance'] },
  CAR_PURCHASE: { type: 'CAR_PURCHASE', label: '🚗 Car Purchase', products: ['Motor Insurance'] },
  BUSINESS_START: { type: 'BUSINESS_START', label: '🏢 Starting Business', products: ['Term Life', 'Health Insurance'] },
}

/**
 * Detect life events from a user message
 */
export async function detectLifeEvents(message) {
  const prompt = `
Analyze this message from an insurance customer and detect any life events mentioned.

Message: "${message}"

Life events to detect: ${Object.keys(LIFE_EVENTS).join(', ')}

Return ONLY a JSON array of detected event types (from the list above), or empty array [] if none detected.
Example: ["MARRIAGE", "NEW_BABY"]
`

  const result = await chatWithClaude([{ role: 'user', content: prompt }])

  if (!result.success) return []

  try {
    const cleaned = result.text.replace(/```json|```/g, '').trim()
    const detected = JSON.parse(cleaned)
    return Array.isArray(detected) ? detected.filter(e => LIFE_EVENTS[e]) : []
  } catch {
    return []
  }
}

/**
 * Process detected life events — save and return matching products
 */
export async function processLifeEvents(uid, message, user = null) {
  const detectedTypes = await detectLifeEvents(message)

  if (detectedTypes.length === 0) return { events: [], products: [] }

  const events = detectedTypes.map(type => LIFE_EVENTS[type])
  const products = [...new Set(events.flatMap(e => e.products))]

  // Save to Firestore
  for (const event of events) {
    await addLifeEvent(uid, event)
  }

  // Send email if user has email
  if (user?.email) {
    for (const event of events) {
      try {
        await sendLifeEventEmail(user, event.label)
        console.log('📧 Life event email sent for:', event.label)
      } catch (err) {
        console.error('Life event email error:', err)
      }
    }
  }

  return { events, products }
}