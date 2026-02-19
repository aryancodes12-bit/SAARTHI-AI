// src/utils/smsSender.js - SMS (mock) + Email via EmailJS browser SDK

const SMS_TEMPLATES = {
  onboarding: (name) =>
    `Namaste ${name}! Welcome to SaarthiAI. Your AI insurance advisor is ready. Visit saarthiai.in Reply STOP to opt-out.`,
  lifeEventDetected: (name, event, product) =>
    `Hi ${name}! Congrats on ${event}! We recommend ${product}. Visit saarthiai.in for details. Reply STOP to opt-out.`,
  recommendation: (name, product, price) =>
    `Hi ${name}! SaarthiAI suggests: ${product} at Rs${price}/mo. Perfect for you! Visit saarthiai.in or call 1800-123-4567`,
  behaviorBased: (name, product, views) =>
    `Hi ${name}! You viewed ${product} ${views} times. Special offer just for you! Visit saarthiai.in Reply STOP to opt-out.`,
  consent: (name) =>
    `Hi ${name}, SaarthiAI here. Get personalized insurance tips via SMS? Reply YES to opt-in or STOP to opt-out.`,
}

// EmailJS config
const EMAILJS_SERVICE_ID = 'service_n7mx59n'
const EMAILJS_TEMPLATE_ID = 'template_q17vqyq'
const EMAILJS_PUBLIC_KEY = 'h8aFcNKUWZTN8_R4O'

function logSMS({ to, message, status, provider, metadata }) {
  const sms = {
    id: `sms_${Date.now()}`,
    to, message, metadata, status,
    timestamp: new Date().toISOString(),
    provider,
  }
  const logs = JSON.parse(localStorage.getItem('sms_logs') || '[]')
  logs.unshift(sms)
  localStorage.setItem('sms_logs', JSON.stringify(logs.slice(0, 100)))
  return sms
}

// ── Email (browser-side EmailJS) ─────────────────────────────────────

async function sendEmailDirect({ to_email, to_name, subject, message }) {
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        accessToken: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email,
          to_name: to_name || 'Customer',
          name: to_name || 'Customer',
          subject,
          message,
        },
      }),
    })
    const text = await response.text()
    console.log('📧 EmailJS response:', text)
    return { success: response.ok, data: text }
  } catch (error) {
    console.error('❌ Email error:', error)
    return { success: false, error: error.message }
  }
}

function getEmailContent(eventLabel, name) {
  const templates = {
    'New Baby': {
      subject: `${name}, protect your growing family 👶`,
      message: `Congratulations on your new baby, ${name}! 🎉\n\nA new baby is a beautiful milestone — and the perfect time to secure their future.\n\nWe recommend:\n• Child ULIP Plan — Build education corpus\n• Term Life Insurance — Protect your family income\n• Maternity & Newborn Plan — Cover medical expenses\n\nChat with SaarthiAI: https://saarthi-ai.vercel.app/chat`,
    },
    'Getting Married': {
      subject: `${name}, plan your future together 💍`,
      message: `Congratulations on your upcoming wedding, ${name}! 💍\n\nMarriage is a new beginning — secure your journey together.\n\nWe recommend:\n• Term Life Insurance — Protect your partner\n• Health Insurance — Family floater plan\n\nChat with SaarthiAI: https://saarthi-ai.vercel.app/chat`,
    },
  }
  return templates[eventLabel] || {
    subject: `${name}, personalized insurance advice for you`,
    message: `Hi ${name}! 👋\n\nBased on your recent life update — ${eventLabel} — we have personalized insurance plans for you.\n\nChat with SaarthiAI: https://saarthi-ai.vercel.app/chat`,
  }
}

export async function sendLifeEventEmail(user, eventLabel) {
  const name = user.displayName?.split(' ')[0] || 'there'
  const { subject, message } = getEmailContent(eventLabel, name)
  return sendEmailDirect({
    to_email: user.email,
    to_name: user.displayName || 'Customer',
    subject,
    message,
  })
}

export async function sendWelcomeEmail(user) {
  const name = user.displayName?.split(' ')[0] || 'there'
  return sendEmailDirect({
    to_email: user.email,
    to_name: user.displayName || 'Customer',
    subject: `Welcome to SaarthiAI, ${name}! 🎉`,
    message: `Namaste ${name}! 🙏\n\nWelcome to SaarthiAI — your personal AI insurance advisor.\n\nYou can ask anything about insurance in Hindi or English.\n\nGet started: https://saarthi-ai.vercel.app/chat\n\nTeam SaarthiAI`,
  })
}

// ── SMS functions ────────────────────────────────────────────────────

export async function sendSMS(phoneNumber, templateType, data = {}) {
  if (!phoneNumber) return { success: false, error: 'No phone number' }

  const messageTemplate = SMS_TEMPLATES[templateType]
  if (!messageTemplate) return { success: false, error: 'Invalid template' }

  const message = typeof messageTemplate === 'function'
    ? messageTemplate(data.name, data.event, data.product, data.reason, data.price, data.views)
    : messageTemplate

  const truncatedMessage = message.slice(0, 160)

  // Mock SMS — logs to admin panel
  logSMS({
    to: phoneNumber,
    message: truncatedMessage,
    status: 'sent',
    provider: 'mock',
    metadata: { templateType, userId: data.userId },
  })

  console.log('📱 SMS logged (mock):', truncatedMessage)
  return { success: true }
}

export async function sendOnboardingSMS(user) {
  return sendSMS(user.phoneNumber, 'onboarding', {
    name: user.displayName?.split(' ')[0] || 'Customer',
    userId: user.uid,
  })
}

export async function sendLifeEventSMS(user, event, product) {
  return sendSMS(user.phoneNumber, 'lifeEventDetected', {
    name: user.displayName?.split(' ')[0] || 'Customer',
    event: event.label || event,
    product: product.name || product,
    userId: user.uid,
  })
}

export async function sendRecommendationSMS(user, product) {
  return sendSMS(user.phoneNumber, 'recommendation', {
    name: user.displayName?.split(' ')[0] || 'Customer',
    product: product.name,
    price: product.price || Math.floor(Math.random() * 500 + 300),
    userId: user.uid,
  })
}

export async function sendBehaviorBasedSMS(user, productName, viewCount) {
  return sendSMS(user.phoneNumber, 'behaviorBased', {
    name: user.displayName?.split(' ')[0] || 'Customer',
    product: productName,
    views: viewCount,
    userId: user.uid,
  })
}

export async function sendConsentSMS(phoneNumber, name) {
  return sendSMS(phoneNumber, 'consent', { name })
}

export function getSMSLogs() {
  return JSON.parse(localStorage.getItem('sms_logs') || '[]')
}

export function clearSMSLogs() {
  localStorage.removeItem('sms_logs')
}