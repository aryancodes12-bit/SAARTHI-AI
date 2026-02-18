/**
 * Bias Detector — Responsible AI Layer
 * Ensures recommendations are fair and unbiased
 * DPDP Act 2023 + AI Ethics compliance
 */

// Sensitive attributes that should NOT influence insurance recommendations
const PROTECTED_ATTRIBUTES = ['caste', 'religion', 'gender', 'ethnicity', 'region']

// Insurance products that shouldn't be filtered by protected attributes
const FAIRNESS_RULES = [
  {
    rule: 'NO_GENDER_BIAS',
    description: 'All products should be recommended regardless of gender',
    check: (context) => !context.toLowerCase().includes('for men only') &&
                        !context.toLowerCase().includes('for women only'),
  },
  {
    rule: 'NO_CASTE_DISCRIMINATION',
    description: 'No caste/religion-based filtering',
    check: (context) => {
      const lc = context.toLowerCase()
      return !PROTECTED_ATTRIBUTES.some(attr => lc.includes(attr + ' based'))
    },
  },
  {
    rule: 'INCLUSIVE_LANGUAGE',
    description: 'AI response should use inclusive language',
    check: (response) => {
      const exclusionary = ['only for', 'not suitable for', 'not recommended for']
      return !exclusionary.some(term => response.toLowerCase().includes(term))
    },
  },
]

/**
 * Check AI prompt for potential bias
 * @param {string} prompt
 * @returns {{ safe: boolean, issues: string[] }}
 */
export function checkPromptBias(prompt) {
  const issues = []

  PROTECTED_ATTRIBUTES.forEach(attr => {
    if (prompt.toLowerCase().includes(attr)) {
      issues.push(`Protected attribute detected in prompt: "${attr}"`)
    }
  })

  return {
    safe: issues.length === 0,
    issues,
  }
}

/**
 * Check AI response for bias
 * @param {string} response
 * @returns {{ fair: boolean, violations: string[], cleaned: string }}
 */
export function checkResponseBias(response) {
  const violations = []

  FAIRNESS_RULES.forEach(rule => {
    if (!rule.check(response)) {
      violations.push(`${rule.rule}: ${rule.description}`)
    }
  })

  return {
    fair: violations.length === 0,
    violations,
    cleaned: response, // In production: apply bias correction
  }
}

/**
 * Add fairness context to AI system prompt
 * @returns {string} - Fairness instructions to prepend to system prompt
 */
export function getFairnessSystemPrompt() {
  return `
RESPONSIBLE AI GUIDELINES (Non-negotiable):
1. NEVER discriminate based on: caste, religion, gender, ethnicity, region, or any protected characteristic
2. Recommend insurance based ONLY on: life stage, financial goals, stated needs, and risk profile
3. Use inclusive, respectful language at all times
4. If you detect a biased question, gently redirect to objective factors
5. Always disclose you are an AI assistant
6. Do NOT make assumptions about affordability based on name, location, or community
7. All recommendations must comply with IRDAI guidelines and DPDP Act 2023

TRANSPARENCY RULES:
- Always explain WHY you're recommending a product
- Acknowledge limitations in your recommendations
- Suggest consulting a licensed IRDAI advisor for final decisions
`.trim()
}

/**
 * Log bias event for audit trail
 */
export function logBiasEvent(uid, type, details) {
  const event = {
    uid,
    type,
    details,
    timestamp: new Date().toISOString(),
  }
  // In production: send to Firestore audit log
  console.warn('[BIAS AUDIT]', event)
  return event
}
