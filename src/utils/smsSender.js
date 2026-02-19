// src/utils/smsSender.js - Fast2SMS via Vercel API Route (CORS-safe, Free)

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

export async function sendSMS(phoneNumber, templateType, data = {}) {
  if (!phoneNumber) return { success: false, error: 'No phone number' }

  const messageTemplate = SMS_TEMPLATES[templateType]
  if (!messageTemplate) return { success: false, error: 'Invalid template' }

  const message = typeof messageTemplate === 'function'
    ? messageTemplate(data.name, data.event, data.product, data.reason, data.price, data.views)
    : messageTemplate

  const truncatedMessage = message.slice(0, 160)

  try {
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneNumber, message: truncatedMessage }),
    })

    const result = await response.json()
    const success = result.success === true

    logSMS({
      to: phoneNumber,
      message: truncatedMessage,
      status: success ? 'sent' : 'failed',
      provider: 'fast2sms',
      metadata: { templateType, userId: data.userId },
    })

    console.log('📱 SMS result:', result)
    return { success, data: result.data }
  } catch (error) {
    console.error('❌ SMS error:', error.message)
    logSMS({
      to: phoneNumber, message: truncatedMessage,
      status: 'failed', provider: 'fast2sms',
      metadata: { templateType, error: error.message },
    })
    return { success: false, error: error.message }
  }
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