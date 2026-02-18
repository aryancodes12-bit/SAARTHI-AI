/**
 * Message Generator
 * Generates proactive WhatsApp/SMS messages and VAPI voice scripts
 * based on life events and customer profile
 */

import { chatWithClaude } from './claudeAgent'

/**
 * Generate a WhatsApp/SMS message for a life event
 * @param {object} lifeEvent - Detected life event
 * @param {object} userProfile - Customer profile
 * @param {object} product - Recommended product
 * @returns {Promise<string>} - Generated message
 */
export async function generateEventMessage(lifeEvent, userProfile, product) {
  const firstName = userProfile.displayName?.split(' ')[0] || 'there'

  const prompt = `
Generate a warm, non-pushy WhatsApp message for an insurance customer.

Context:
- Customer first name: ${firstName}
- Life event detected: ${lifeEvent.label}
- Recommended product: ${product.name} (${product.type})
- Platform: SaarthiAI insurance advisor

Requirements:
- Max 3 sentences
- Warm, congratulatory tone (if positive event like marriage/baby)
- Mention the product naturally, not aggressively
- End with a gentle call to action
- Include relevant emoji
- Must feel human and personal, not automated
`

  const result = await chatWithClaude([{ role: 'user', content: prompt }])
  return result.success ? result.text : getDefaultMessage(lifeEvent, firstName, product)
}

/**
 * Generate VAPI voice call script
 */
export async function generateVoiceScript(userProfile, topProduct) {
  const firstName = userProfile.displayName?.split(' ')[0] || 'there'

  const prompt = `
Write a 30-second voice call opening script for an AI insurance advisor.

Context:
- Customer name: ${firstName}
- Top recommended product: ${topProduct.name}
- Company: SaarthiAI
- Must mention it's an AI call and they can hang up anytime
- Warm, professional, Indian English tone
- End with a yes/no question to continue

Format the script naturally, as it would be spoken.
`

  const result = await chatWithClaude([{ role: 'user', content: prompt }])
  return result.success ? result.text : getDefaultVoiceScript(firstName, topProduct)
}

// ─── Fallback messages ────────────────────────────────────────────

function getDefaultMessage(event, name, product) {
  const messages = {
    MARRIAGE: `🎊 Congratulations ${name} on your upcoming marriage! As you start this beautiful journey, it's a great time to think about protecting your family's future. Our ${product.name} could be a perfect fit. Want to know more?`,
    NEW_BABY: `👶 Congratulations on your new addition to the family, ${name}! There's no better gift than securing their future. Check out our ${product.name} — designed for moments just like this.`,
    HOME_PURCHASE: `🏠 Congratulations on your new home, ${name}! Protect your biggest investment with our ${product.name}. Would you like a quick overview?`,
    DEFAULT: `Hi ${name}! Based on your recent activity, we think ${product.name} could be perfect for you. Want to learn more?`,
  }
  return messages[event.type] || messages.DEFAULT
}

function getDefaultVoiceScript(name, product) {
  return `Hello, may I speak with ${name}? 

Hi ${name}, this is Saarthi, your AI insurance advisor from SaarthiAI. Just to be transparent, I'm an AI assistant and you can end this call at any time.

I noticed you might be interested in protecting your family's future, and I wanted to share some information about our ${product.name}, which many customers in similar situations have found very helpful.

Would you like to hear more about how it could benefit you specifically? Just say yes or no.`
}

/**
 * Generate bulk campaign messages for agent dashboard
 */
export async function generateCampaignMessages(eventType, productName, count = 5) {
  const prompt = `
Generate ${count} different WhatsApp message variations for this insurance campaign.

Life Event: ${eventType}
Product: ${productName}
Brand: SaarthiAI

Each message should:
- Be unique in tone and approach
- Be max 3 sentences
- Feel personal and warm
- Include 1-2 relevant emojis
- Have a gentle CTA

Return as JSON array: [{ "id": 1, "message": "..." }, ...]
`

  const result = await chatWithClaude([{ role: 'user', content: prompt }])

  if (!result.success) return []

  try {
    const cleaned = result.text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return []
  }
}
