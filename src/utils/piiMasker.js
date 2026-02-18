/**
 * PII Masker — DPDP Act 2023 Compliance
 * Masks personally identifiable information before sending to AI models
 */

// Patterns for PII detection
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+91|0)?[6-9]\d{9}/g,
  aadhaar: /\d{4}\s?\d{4}\s?\d{4}/g,
  pan: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g,
  name: /(my name is|i am|i'm|call me)\s+([A-Z][a-z]+\s?)+/gi,
  dob: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
}

const REPLACEMENT_MAP = {
  email: '[EMAIL_REDACTED]',
  phone: '[PHONE_REDACTED]',
  aadhaar: '[AADHAAR_REDACTED]',
  pan: '[PAN_REDACTED]',
  name: (match, prefix) => `${prefix} [NAME_REDACTED]`,
  dob: '[DOB_REDACTED]',
}

/**
 * Mask PII in a string
 * @param {string} text - Input text
 * @returns {{ masked: string, piiDetected: string[] }} - Masked text and list of PII types found
 */
export function maskPII(text) {
  if (!text) return { masked: text, piiDetected: [] }

  let masked = text
  const piiDetected = []

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const replacement = REPLACEMENT_MAP[type]
    if (pattern.test(masked)) {
      piiDetected.push(type)
      pattern.lastIndex = 0 // Reset regex state
      if (typeof replacement === 'function') {
        masked = masked.replace(pattern, replacement)
      } else {
        masked = masked.replace(pattern, replacement)
      }
    }
    pattern.lastIndex = 0
  }

  return { masked, piiDetected }
}

/**
 * Mask PII in an object (shallow)
 * @param {object} obj
 * @returns {object} - Masked object
 */
export function maskObjectPII(obj) {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = maskPII(value).masked
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * Check if text contains PII
 */
export function containsPII(text) {
  if (!text) return false
  for (const pattern of Object.values(PII_PATTERNS)) {
    pattern.lastIndex = 0
    if (pattern.test(text)) {
      pattern.lastIndex = 0
      return true
    }
  }
  return false
}

/**
 * Sanitize user message before sending to Claude API
 */
export function sanitizeForAI(message) {
  const { masked, piiDetected } = maskPII(message)
  return {
    sanitized: masked,
    hadPII: piiDetected.length > 0,
    piiTypes: piiDetected,
  }
}
