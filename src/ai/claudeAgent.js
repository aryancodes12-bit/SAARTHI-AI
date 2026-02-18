import { sanitizeForAI } from '../utils/piiMasker'
import { getFairnessSystemPrompt, checkResponseBias, logBiasEvent } from '../utils/biasDetector'
import { hasConsent, CONSENT_TYPES } from '../utils/consentChecker'

// ─── Groq API (Free! 🚀) ───────────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// Demo mode — agar Groq key bhi nahi hai
export const DEMO_MODE = !GROQ_API_KEY

const DEMO_RESPONSES = {
  marri: `Congratulations on your upcoming marriage! 🎊\n\nI'd recommend:\n• **SecureTerm 30** — Joint term life cover for both partners\n• **HealthGuard Comprehensive** — Family floater health plan\n\nShall I explain the premium details for your age group?`,
  baby: `What wonderful news — a new baby! 👶\n\nTop picks for new parents:\n• **BrightFuture Child ULIP** — Builds education corpus from birth\n• **Family Shield Term 20** — Protects your family's income\n• **HealthGuard Comprehensive** — Covers the whole family\n\nWould you like to see how BrightFuture grows over 18 years?`,
  home: `Congratulations on your new home! 🏠\n\n• **HomeSafe Standard Cover** — Fire, theft, natural disasters\n• **HomeShield Premium** — Adds contents + liability cover\n\nWant a quick premium estimate?`,
  health: `Great thinking! ❤️\n\n• **HealthGuard Comprehensive** — ₹5L cover, 500+ hospitals, zero copay\n• **WellnessPrime Health Plan** — Adds OPD, dental, mental health\n\nHow old are you? I'll find the best plan for your age.`,
  retire: `Starting early is the wisest decision! 🌅\n\n• **GoldenNest Retirement Plan** — Guaranteed returns + life cover\n• **FutureIncome Retirement Plus** — Monthly pension from age 60\n\n₹5,000/month from age 30 = ~₹1.2 Cr at 60. Want the full projection?`,
  car: `New car! 🚗\n\n• **DriveEasy Motor Protect** — Third party + basic own damage\n• **RoadGuard Comprehensive** — Zero depreciation + roadside assist\n\nRoadGuard is only ~₹2,000/year extra but saves lakhs in accidents. Interested?`,
  default: `Namaste! 🙏 I'm SaarthiAI, your personal insurance advisor.\n\nTell me what's happening in your life:\n• 💍 Getting married?\n• 👶 New baby?\n• 🏠 Buying a home?\n• ❤️ Need health cover?\n• 🌅 Planning retirement?\n\nWhat's on your mind?`
}

function getDemoResponse(messages) {
  const last = messages[messages.length - 1]?.content?.toLowerCase() || ''
  if (last.includes('marri') || last.includes('shadi')) return DEMO_RESPONSES.marri
  if (last.includes('baby') || last.includes('child') || last.includes('bachha')) return DEMO_RESPONSES.baby
  if (last.includes('home') || last.includes('house') || last.includes('ghar')) return DEMO_RESPONSES.home
  if (last.includes('health') || last.includes('hospital')) return DEMO_RESPONSES.health
  if (last.includes('retire') || last.includes('pension')) return DEMO_RESPONSES.retire
  if (last.includes('car') || last.includes('vehicle') || last.includes('gaadi')) return DEMO_RESPONSES.car
  return DEMO_RESPONSES.default
}

function buildSystemPrompt(userContext = {}) {
  return `
You are SaarthiAI, India's most trusted AI-powered insurance advisor.
You help customers find the right insurance products from LIC and Policybazaar ecosystem.

PERSONALITY:
- Warm, professional, and empathetic
- Speak in simple English (or Hinglish if user prefers)
- Never be pushy or salesy — educate first, recommend second
- Always prioritize customer's genuine needs over upselling

PRODUCT KNOWLEDGE:
- Term Life Insurance: SecureTerm 30, Family Shield Term 20
- Child Plans: BrightFuture Child ULIP, EduGrow Child ULIP Plus
- Health Insurance: HealthGuard Comprehensive, WellnessPrime Health Plan
- Home Insurance: HomeSafe Standard Cover, HomeShield Premium
- Retirement: GoldenNest Retirement Plan, FutureIncome Retirement Plus
- Motor Insurance: DriveEasy Motor Protect, RoadGuard Comprehensive

USER CONTEXT:
${JSON.stringify(userContext, null, 2)}

${getFairnessSystemPrompt()}

RULES:
- Keep responses concise (2-4 sentences)
- Use bullet points only when listing products
- End with a helpful question
- Never ask for Aadhaar, PAN, or bank details
`.trim()
}

// ─── Main Chat Function ────────────────────────────────────────────
export async function chatWithClaude(messages, userContext = {}, uid = null) {
  if (!hasConsent(CONSENT_TYPES.AI_PROCESSING)) {
    return {
      success: false,
      requiresConsent: true,
      text: 'Please enable AI Processing consent in Settings → Privacy Controls.',
    }
  }

  // Demo mode fallback
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 800))
    return { success: true, text: getDemoResponse(messages) }
  }

  // Sanitize PII
  const sanitizedMessages = [...messages]
  const lastMsg = sanitizedMessages[sanitizedMessages.length - 1]
  if (lastMsg?.role === 'user') {
    const { sanitized, hadPII, piiTypes } = sanitizeForAI(lastMsg.content)
    if (hadPII && uid) logBiasEvent(uid, 'PII_DETECTED_IN_MESSAGE', { types: piiTypes })
    sanitizedMessages[sanitizedMessages.length - 1] = { ...lastMsg, content: sanitized }
  }

  try {
    // ─── Groq uses OpenAI-compatible format ───────────────────────
    const systemPrompt = buildSystemPrompt(userContext)

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...sanitizedMessages.map(m => ({
            role: m.role, // 'user' | 'assistant' — same format!
            content: m.content,
          })),
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `Groq HTTP ${response.status}`)
    }

    const data = await response.json()
    const rawText = data.choices?.[0]?.message?.content || ''
    if (!rawText) throw new Error('Empty response from Groq')

    const { fair, violations, cleaned } = checkResponseBias(rawText)
    if (!fair && uid) logBiasEvent(uid, 'BIAS_IN_RESPONSE', { violations })

    return {
      success: true,
      text: cleaned,
      biasWarning: !fair ? violations : null,
    }

  } catch (err) {
    console.error('[SaarthiAI] Groq error:', err.message)
    // Graceful fallback to demo responses
    return { success: true, text: getDemoResponse(messages) }
  }
}

// ─── Recommendations ───────────────────────────────────────────────
export async function generateRecommendations(userProfile, lifeEvents, behaviorData) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 600))
    return [
      { productName: 'SecureTerm 30', productType: 'Term Life', reason: 'Best protection for your family at lowest premium.', urgency: 'high', icon: '🛡️' },
      { productName: 'HealthGuard Comprehensive', productType: 'Health', reason: 'Complete family health cover with zero copay.', urgency: 'high', icon: '❤️' },
      { productName: 'BrightFuture Child ULIP', productType: 'Child Plan', reason: "Secure your child's education corpus from today.", urgency: 'medium', icon: '🎓' },
    ]
  }

  const prompt = `
Generate 3 personalized insurance recommendations for this customer.
Life Events: ${lifeEvents.map(e => e.type).join(', ') || 'None'}
Age Group: ${userProfile.ageGroup || 'Not specified'}
Occupation: ${userProfile.occupation || 'Not specified'}
Dependents: ${userProfile.dependents || 'Not specified'}

Return ONLY a JSON array, no extra text:
[{ "productName": "...", "productType": "...", "reason": "1-2 sentences", "urgency": "high|medium|low", "icon": "emoji" }]
`
  const result = await chatWithClaude([{ role: 'user', content: prompt }], {}, userProfile.uid)
  try {
    const match = (result.text || '').match(/\[[\s\S]*\]/)
    return match ? JSON.parse(match[0]) : []
  } catch { return [] }
}