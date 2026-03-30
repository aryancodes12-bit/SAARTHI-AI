import { sanitizeForAI } from '../utils/piiMasker'
import { getFairnessSystemPrompt, checkResponseBias, logBiasEvent } from '../utils/biasDetector'
import { hasConsent, CONSENT_TYPES } from '../utils/consentChecker'

// ─── Groq API (Free! 🚀) ───────────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// Demo mode — agar Groq key bhi nahi hai
export const DEMO_MODE = !GROQ_API_KEY

const PRODUCT_URLS = {
  'SecureTerm 30': 'https://www.canarahsbclife.com/term-insurance/30-year-term-insurance-plan',
  'Family Shield Term 20': 'https://www.bajajallianzlife.com/term-insurance/iprotect-smart-term-plan.jsp',
  'HealthGuard Comprehensive': 'https://www.religarehealthinsurance.com/health-insurance-plans/health-advantedge',
  'WellnessPrime Health Plan': 'https://www.niva-bupa.com/health-insurance-plans/health-premia',
  'Optima Restore': 'https://www.hdfcergo.com/health-insurance/optima-restore',
  'Star Comprehensive': 'https://www.starhealth.in/health-insurance-plans/star-comprehensive-insurance-policy',
  'BrightFuture Child ULIP': 'https://lifeinsurance.pnbmetlife.com/child-insurance-plans/youngstar-unit-linked-plan',
  'HomeSafe Standard Cover': 'https://www.hdfcergo.com/home-insurance/home-insurance-policy',
  'DriveEasy Motor Protect': 'https://www.bharti-axagi.co.in/motor-insurance',
  'RoadGuard Comprehensive': 'https://www.tataaig.com/motor-insurance/car-insurance',
  'GoldenNest Retirement Plan': 'https://www.sbilife.co.in/en/pension-plans/golden-years-pension-plan'
}

const getUrlForProduct = (name) => {
  if (!name) return 'https://saarthi-ai-mu.vercel.app/'
  // Try exact match
  if (PRODUCT_URLS[name]) return PRODUCT_URLS[name]
  // Try partial match
  const key = Object.keys(PRODUCT_URLS).find(k => name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase()))
  return key ? PRODUCT_URLS[key] : 'https://saarthi-ai-mu.vercel.app/'
}

const DEMO_RESPONSES = {
  marri: `Congratulations on your upcoming marriage! 🎊\n\nI'd recommend:\n• **SecureTerm 30** — Joint term life cover for both partners 🔗 [View Plan](https://www.canarahsbclife.com/term-insurance/30-year-term-insurance-plan)\n• **HealthGuard Comprehensive** — Family floater health plan 🔗 [View Plan](https://www.religarehealthinsurance.com/health-insurance-plans/health-advantedge)\n\nShall I explain the premium details for your age group?`,
  baby: `What wonderful news — a new baby! 👶\n\nTop picks for new parents:\n• **BrightFuture Child ULIP** — Builds education corpus from birth 🔗 [View Plan](https://lifeinsurance.pnbmetlife.com/child-insurance-plans/youngstar-unit-linked-plan)\n• **Family Shield Term 20** — Protects your family's income 🔗 [View Plan](https://www.bajajallianzlife.com/term-insurance/iprotect-smart-term-plan.jsp)\n• **HealthGuard Comprehensive** — Covers the whole family 🔗 [View Plan](https://www.religarehealthinsurance.com/health-insurance-plans/health-advantedge)\n\nWould you like to see how BrightFuture grows over 18 years?`,
  home: `Congratulations on your new home! 🏠\n\n• **HomeSafe Standard Cover** — Fire, theft, natural disasters 🔗 [View Plan](https://www.hdfcergo.com/home-insurance/home-insurance-policy)\n• **HomeShield Premium** — Comprehensive contents + liability cover 🔗 [View Plan](https://www.hdfcergo.com/home-insurance/home-insurance-policy)\n\nWant a quick premium estimate?`,
  health: `Great thinking! ❤️\n\n• **HealthGuard Comprehensive** — ₹5L cover, 500+ hospitals, zero copay 🔗 [View Plan](https://www.religarehealthinsurance.com/health-insurance-plans/health-advantedge)\n• **WellnessPrime Health Plan** — OPD, dental & mental health cover 🔗 [View Plan](https://www.niva-bupa.com/health-insurance-plans/health-premia)\n\nHow old are you? I'll find the best plan for your age.`,
  retire: `Starting early is the wisest decision! 🌅\n\n• **GoldenNest Retirement Plan** — Guaranteed returns + life cover 🔗 [View Plan](https://www.sbilife.co.in/en/pension-plans/golden-years-pension-plan)\n• **FutureIncome Retirement Plus** — Monthly pension from age 60 🔗 [View Plan](https://www.exideinsurance.com/exide-life-future-income-plan)\n\n₹5,000/month from age 30 = ~₹1.2 Cr at 60. Want the full projection?`,
  car: `New car! 🚗\n\n• **DriveEasy Motor Protect** — Third party + basic own damage 🔗 [View Plan](https://www.bharti-axagi.co.in/motor-insurance)\n• **RoadGuard Comprehensive** — Zero depreciation + roadside assist 🔗 [View Plan](https://www.tataaig.com/motor-insurance/car-insurance)\n\nRoadGuard is only ~₹2,000/year extra but saves lakhs in accidents. Interested?`,
  optima: `Optima Restore (HDFC ERGO) is a top-tier health plan. Its star feature is the **Restore Benefit** — if you exhaust your cover, it refills automatically for the next claim! it also includes a Stay Active discount and daily cash allowance. \n\n🔗 [View Plan](https://www.hdfcergo.com/health-insurance/optima-restore) \n\nSince you've computed a quote, shall I explain the exclusion period?`,
  star: `The **Star Comprehensive Health Plan** is a powerhouse policy. It covers maternity, newborn expenses, and even bariatric surgery. It's designed for families who want zero compromises on health care. \n\n🔗 [View Plan](https://www.starhealth.in/health-insurance-plans/star-comprehensive-insurance-policy) \n\nWould you like me to check the network hospital count near your pincode?`,
  default: `Namaste! 🙏 I'm SaarthiAI, your personal insurance advisor.\n\nTell me what's happening in your life:\n• 💍 Getting married?\n• 👶 New baby?\n• 🏠 Buying a home?\n• ❤️ Need health cover?\n• 🌅 Planning retirement?\n\nWhat's on your mind?`
}

function getDemoResponse(messages) {
  const last = messages[messages.length - 1]?.content?.toLowerCase() || ''
  if (last.includes('optima')) return DEMO_RESPONSES.optima
  if (last.includes('star') || last.includes('comprehensive')) return DEMO_RESPONSES.star
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

OFFICIAL PRODUCT CATALOGUE WITH VERIFIED LINKS:
Use ONLY these links. Never invent or modify URLs.

📋 TERM LIFE:
- SecureTerm 30 → https://www.canarahsbclife.com/term-insurance/30-year-term-insurance-plan
- Family Shield Term 20 → https://www.bajajallianzlife.com/term-insurance/iprotect-smart-term-plan.jsp

👶 CHILD PLANS:
- BrightFuture Child ULIP → https://lifeinsurance.pnbmetlife.com/child-insurance-plans/youngstar-unit-linked-plan
- EduGrow Child ULIP Plus → https://www.tataaia.com/life-insurance-plans/child-plans/future-child-plan.html

📋 HEALTH INSURANCE:
- HealthGuard Comprehensive → https://www.religarehealthinsurance.com/health-insurance-plans/health-advantedge
- WellnessPrime Health Plan → https://www.niva-bupa.com/health-insurance-plans/health-premia
- Optima Restore (HDFC ERGO) → https://www.hdfcergo.com/health-insurance/optima-restore
- Star Comprehensive Health Plan → https://www.starhealth.in/health-insurance-plans/star-comprehensive-insurance-policy
- Critical Illness Cover → https://www.axismaxlife.com/term-insurance-plans/critical-illness

🏠 HOME INSURANCE:
- HomeSafe Standard Cover → https://www.hdfcergo.com/home-insurance/home-insurance-policy
- HomeShield Premium → https://www.hdfcergo.com/home-insurance/home-insurance-policy

🌅 RETIREMENT / PENSION:
- GoldenNest Retirement Plan → https://www.sbilife.co.in/en/pension-plans/golden-years-pension-plan
- FutureIncome Retirement Plus → https://www.exideinsurance.com/exide-life-future-income-plan

🚗 MOTOR INSURANCE:
- DriveEasy Motor Protect → https://www.bharti-axagi.co.in/motor-insurance
- RoadGuard Comprehensive → https://www.tataaig.com/motor-insurance/car-insurance

USER CONTEXT:
${JSON.stringify(userContext, null, 2)}

${getFairnessSystemPrompt()}

MANDATORY RULES (follow every single one, no exceptions):
1. ALWAYS include the official product link for EVERY product you mention, formatted as: 🔗 [View Plan](URL)
2. LINK INTEGRITY: Only use URLs from the Official Product Catalogue above. NEVER invent, guess, or modify URLs.
3. Keep responses concise (3-6 lines max)
4. Use bullet points when listing products
5. End every reply with one helpful follow-up question
6. NEVER ask for Aadhaar, PAN, bank account, or card details
7. If the user mentions a life event (marriage, baby, home, retirement), recommend 2 most relevant products with links immediately
8. For general insurance questions, explain briefly then recommend the best plan + link
9. ADVISORY CONTEXT: If the user mentions a specific quote from our "Premium Calculator" (like Optima Restore or Star Comprehensive), acknowledge the result they just obtained and provide expert reasoning for that recommendation.
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
    const recs = [
      { productName: 'SecureTerm 30', productType: 'Term Life', reason: 'Best protection for your family as per your profile.', urgency: 'high', matchScore: 98, icon: '🛡️' },
      { productName: 'Optima Restore', productType: 'Health', reason: 'Refills automatically after a claim—perfect for you.', urgency: 'high', matchScore: 94, icon: '❤️' },
      { productName: 'HomeSafe Standard Cover', productType: 'Home', reason: "Essential protection for your new asset.", urgency: 'medium', matchScore: 88, icon: '🏠' },
    ]
    return recs.map(r => ({ ...r, url: getUrlForProduct(r.productName) }))
  }

  const prompt = `
Generate 3 highly personalized insurance recommendations for this Indian customer.
USER PROFILE:
- Life Events: ${lifeEvents.map(e => e.label || e.type).join(', ') || 'None Detected'}
- Age Group: ${userProfile.ageGroup || 'Not specified'}
- Occupation: ${userProfile.occupation || 'Not specified'}
- Dependents: ${userProfile.dependents || 'Not specified'}
- Behavior Data: ${JSON.stringify(behaviorData || {})}

GUIDELINES:
1. Diversity: Return 3 DIFFERENT categories (e.g., 1 Health, 1 Term, 1 Motor/Home/Child).
2. Continuity: Use product names from our inventory (SecureTerm 30, Optima Restore, Star Comprehensive, etc.).
3. Personalization: Why this? Reason must mention specific user data (e.g. "To protect your family as you mentioned being ${userProfile.occupation}").

Return ONLY a JSON array, no extra text:
[{ 
  "productName": "...", 
  "productType": "...", 
  "reason": "...", 
  "urgency": "high|medium|low", 
  "matchScore": 85-98,
  "icon": "..." 
}]
`
  const result = await chatWithClaude([{ role: 'user', content: prompt }], {}, userProfile.uid)
  try {
    const match = (result.text || '').match(/\[[\s\S]*\]/)
    const recs = match ? JSON.parse(match[0]) : []
    
    // Attach URLs to AI results
    const finalized = (recs.length > 0 ? recs : [
      { productName: 'Optima Restore', productType: 'Health', reason: 'Best coverage for your family with restore benefit.', urgency: 'high', matchScore: 92, icon: '❤️' },
      { productName: 'SecureTerm 30', productType: 'Term Life', reason: 'High protection cover at your age.', urgency: 'high', matchScore: 98, icon: '🛡️' },
      { productName: 'HomeSafe Standard Cover', productType: 'Home', reason: 'Essential for your home purchase.', urgency: 'medium', matchScore: 85, icon: '🏠' }
    ]).map(r => ({ ...r, url: getUrlForProduct(r.productName) }))

    return finalized
  } catch {
    return [
      { productName: 'SecureTerm 30', productType: 'Term Life', reason: 'High protection cover at your age.', urgency: 'high', matchScore: 98, icon: '🛡️', url: getUrlForProduct('SecureTerm 30') },
      { productName: 'Optima Restore', productType: 'Health', reason: 'Best coverage for your family with restore benefit.', urgency: 'high', matchScore: 92, icon: '❤️', url: getUrlForProduct('Optima Restore') },
      { productName: 'HomeSafe Standard Cover', productType: 'Home', reason: 'Essential for your home purchase.', urgency: 'medium', matchScore: 85, icon: '🏠', url: getUrlForProduct('HomeSafe Standard Cover') }
    ]
  }
}