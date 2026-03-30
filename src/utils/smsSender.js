// src/utils/smsSender.js
import emailjs from '@emailjs/browser'

const EMAILJS_SERVICE_ID = 'service_n7mx59n'
const EMAILJS_TEMPLATE_ID = 'template_q17vqyq'
const EMAILJS_PUBLIC_KEY = 'h8aFcNKUWZTN8_R4O'

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

// ── Clean display name (removes underscores, numbers, capitalizes) ────
function sanitizeName(rawName) {
  if (!rawName) return null
  const cleaned = rawName
    .replace(/[_\d]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return null
  return cleaned
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function getFirstName(rawName) {
  const clean = sanitizeName(rawName)
  return clean?.split(' ')[0] || 'there'
}

// ── Email via @emailjs/browser SDK ───────────────────────────────────

function getEmailContent(eventLabel, name) {
  const templates = {
    'New Baby': {
      subject: `${name}, protect your growing family 👶`,
      message: `Namaste ${name}! 🎉\n\nCongratulations on your new baby! A new life deserves the best protection.\n\nWe recommend:\n• Child ULIP Plan — Build education corpus\n• Term Life Insurance — Protect your family income\n• Maternity & Newborn Plan — Cover medical expenses\n\nChat with SaarthiAI: https://saarthi-ai.vercel.app/chat\n\nTeam SaarthiAI 🙏`,
    },
    'Getting Married': {
      subject: `${name}, plan your future together 💍`,
      message: `Namaste ${name}! 💍\n\nCongratulations on your upcoming wedding! Marriage is a new beginning — secure your journey together.\n\nWe recommend:\n• Term Life Insurance — Protect your partner\n• Health Insurance — Family floater plan\n• Savings Plan — Build wealth together\n\nChat with SaarthiAI: https://saarthi-ai.vercel.app/chat\n\nTeam SaarthiAI 🙏`,
    },
    'Home Purchase': {
      subject: `${name}, protect your new home 🏠`,
      message: `Namaste ${name}! 🏠\n\nCongratulations on your new home — a huge milestone!\n\nNow is the perfect time to safeguard your investment:\n• Home Loan Protection Plan — Covers your EMI if anything happens to you\n• Home Insurance — Protect against fire, flood & theft\n• Term Life Insurance — Ensure your family keeps the home\n\nChat with SaarthiAI: https://saarthi-ai.vercel.app/chat\n\nTeam SaarthiAI 🙏`,
    },
    'New Job': {
      subject: `${name}, secure your new career 💼`,
      message: `Namaste ${name}! 💼\n\nCongratulations on your new job! A great career deserves great protection.\n\nWe recommend:\n• Health Insurance — Independent coverage beyond employer policy\n• Term Life Insurance — Lock in low premiums while you're young\n• NPS / Investment Plan — Start building retirement wealth now\n\nChat with SaarthiAI: https://saarthi-ai.vercel.app/chat\n\nTeam SaarthiAI 🙏`,
    },
    'Child Education': {
      subject: `${name}, invest in your child's future 🎓`,
      message: `Namaste ${name}! 🎓\n\nPlanning your child's education is one of the best gifts you can give.\n\nWe recommend:\n• Child ULIP Plan — Market-linked education corpus\n• Child Endowment Plan — Guaranteed savings at key milestones\n• Term Insurance — Waiver of premium if parent is unable to pay\n\nChat with SaarthiAI: https://saarthi-ai.vercel.app/chat\n\nTeam SaarthiAI 🙏`,
    },
    'Retirement Planning': {
      subject: `${name}, plan a comfortable retirement 🌅`,
      message: `Namaste ${name}! 🌅\n\nRetirement planning today means freedom tomorrow.\n\nWe recommend:\n• NPS (National Pension System) — Tax-saving retirement corpus\n• Annuity Plans — Guaranteed monthly income post retirement\n• Senior Citizen Health Plan — Comprehensive medical coverage\n\nChat with SaarthiAI: https://saarthi-ai.vercel.app/chat\n\nTeam SaarthiAI 🙏`,
    },
    'Business Started': {
      subject: `${name}, protect your new business 🚀`,
      message: `Namaste ${name}! 🚀\n\nStarting a business is bold — make sure it's protected from day one.\n\nWe recommend:\n• Business Insurance — Cover assets, liability & operations\n• Key Person Insurance — Protect against loss of a key employee\n• Health Group Plan — Keep your team healthy & motivated\n\nChat with SaarthiAI: https://saarthi-ai.vercel.app/chat\n\nTeam SaarthiAI 🙏`,
    },
    'Vehicle Purchase': {
      subject: `${name}, insure your new vehicle 🚗`,
      message: `Namaste ${name}! 🚗\n\nCongratulations on your new vehicle! Drive with confidence.\n\nWe recommend:\n• Comprehensive Car Insurance — Full coverage including own damage\n• Zero Depreciation Add-on — Get full claim without deductions\n• Personal Accident Cover — Protection for you & your family\n\nChat with SaarthiAI: https://saarthi-ai.vercel.app/chat\n\nTeam SaarthiAI 🙏`,
    },
  }

  return (
    templates[eventLabel] || {
      subject: `${name}, we have personalized insurance advice for you 🛡️`,
      message: `Namaste ${name}! 🙏\n\nBased on your recent life update — ${eventLabel} — we have handpicked insurance plans just for you.\n\nOur AI advisor is ready to guide you:\n✅ Compare top plans\n✅ Get instant quotes\n✅ Ask in Hindi or English\n\nChat with SaarthiAI: https://saarthi-ai.vercel.app/chat\n\nTeam SaarthiAI`,
    }
  )
}

export async function sendLifeEventEmail(user, eventLabel) {
  const firstName = getFirstName(user.displayName)
  const { subject, message } = getEmailContent(eventLabel, firstName)
  const cleanDisplayName = sanitizeName(user.displayName) || 'Customer'
  try {
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: user.email,
        to_name: cleanDisplayName,
        name: cleanDisplayName,
        subject,
        message,
      },
      EMAILJS_PUBLIC_KEY
    )
    console.log('📧 Life event email sent:', result)
    return { success: true }
  } catch (error) {
    console.error('❌ Email error:', error)
    return { success: false, error }
  }
}

export async function sendWelcomeEmail(user) {
  const firstName = getFirstName(user.displayName)
  const cleanDisplayName = sanitizeName(user.displayName) || 'Customer'
  try {
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: user.email,
        to_name: cleanDisplayName,
        name: cleanDisplayName,
        subject: `Welcome to SaarthiAI, ${firstName}! 🎉`,
        message: `Namaste ${firstName}! 🙏\n\nWelcome to SaarthiAI — your personal AI insurance advisor.\n\nHere's what you can do:\n✅ Get personalized insurance recommendations\n✅ Ask questions in Hindi or English\n✅ Compare top insurance plans instantly\n✅ Track your life events & coverage needs\n\nGet started now: https://saarthi-ai.vercel.app/chat\n\nTeam SaarthiAI 🛡️`,
      },
      EMAILJS_PUBLIC_KEY
    )
    console.log('📧 Welcome email sent:', result)
    return { success: true }
  } catch (error) {
    console.error('❌ Welcome email error:', error)
    return { success: false, error }
  }
}

// ── SMS (mock) ───────────────────────────────────────────────────────

export async function sendSMS(phoneNumber, templateType, data = {}) {
  if (!phoneNumber) return { success: false, error: 'No phone number' }
  const messageTemplate = SMS_TEMPLATES[templateType]
  if (!messageTemplate) return { success: false, error: 'Invalid template' }
  const message = typeof messageTemplate === 'function'
    ? messageTemplate(data.name, data.event, data.product, data.reason, data.price, data.views)
    : messageTemplate
  const truncatedMessage = message.slice(0, 160)
  logSMS({ to: phoneNumber, message: truncatedMessage, status: 'sent', provider: 'mock', metadata: { templateType, userId: data.userId } })
  console.log('📱 SMS logged (mock):', truncatedMessage)
  return { success: true }
}

export async function sendOnboardingSMS(user) {
  return sendSMS(user.phoneNumber, 'onboarding', {
    name: getFirstName(user.displayName),
    userId: user.uid,
  })
}
export async function sendLifeEventSMS(user, event, product) {
  return sendSMS(user.phoneNumber, 'lifeEventDetected', {
    name: getFirstName(user.displayName),
    event: event.label || event,
    product: product.name || product,
    userId: user.uid,
  })
}
export async function sendRecommendationSMS(user, product) {
  return sendSMS(user.phoneNumber, 'recommendation', {
    name: getFirstName(user.displayName),
    product: product.name,
    price: product.price || Math.floor(Math.random() * 500 + 300),
    userId: user.uid,
  })
}
export async function sendBehaviorBasedSMS(user, productName, viewCount) {
  return sendSMS(user.phoneNumber, 'behaviorBased', {
    name: getFirstName(user.displayName),
    product: productName,
    views: viewCount,
    userId: user.uid,
  })
}
export async function sendConsentSMS(phoneNumber, name) {
  return sendSMS(phoneNumber, 'consent', { name: sanitizeName(name) || name })
}
export function getSMSLogs() {
  return JSON.parse(localStorage.getItem('sms_logs') || '[]')
}
export function clearSMSLogs() {
  localStorage.removeItem('sms_logs')
}

// ── Export sanitizeName for use in other files ───────────────────────
export { sanitizeName, getFirstName }