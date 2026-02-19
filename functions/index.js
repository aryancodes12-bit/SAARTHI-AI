const functions = require('firebase-functions')
const admin = require('firebase-admin')
const nodemailer = require('nodemailer')
const twilio = require('twilio')

admin.initializeApp()
const db = admin.firestore()

// ─── Twilio WhatsApp Client ────────────────────────────────────────
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)
const TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886' // Twilio Sandbox number

// ─── Groq AI ──────────────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// ─── Email (existing) ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD,
  }
})

// ═══════════════════════════════════════════════════════════════════
// HELPER: Generate AI message via Groq
// ═══════════════════════════════════════════════════════════════════
async function generateWhatsAppMessage(trigger, userData) {
  const { displayName, lifeEvents, intentScore, mobileNumber } = userData
  const name = displayName?.split(' ')[0] || 'there'

  const prompts = {
    ONBOARDING_COMPLETE: `Write a warm WhatsApp welcome message for ${name} who just joined SaarthiAI insurance platform. 2-3 sentences. Mention they can ask anything about insurance in Hindi or English. End with a question about their biggest insurance need. Include 1-2 relevant emojis. No markdown.`,

    LIFE_EVENT: `Write a warm, non-pushy WhatsApp message for ${name} who just had this life event: "${lifeEvents?.[lifeEvents.length - 1]?.label}". Congratulate them and naturally suggest they explore insurance options. 2-3 sentences. End with a soft CTA to chat. Include relevant emojis. No markdown.`,

    PRODUCT_VIEW: `Write a helpful WhatsApp follow-up for ${name} who was browsing insurance products on SaarthiAI. Let them know our AI advisor can help them choose. 2 sentences max. Warm tone, not salesy. Include 1 emoji. No markdown.`,

    HIGH_INTENT: `Write a WhatsApp message for ${name} who has been actively exploring insurance options (intent score: ${intentScore}/100). They seem ready to make a decision. Offer a personalized consultation. 2-3 sentences. Confident but not pushy. 1-2 emojis. No markdown.`,

    INACTIVE: `Write a gentle WhatsApp re-engagement message for ${name} who hasn't visited SaarthiAI in 3+ days. Remind them their personalized insurance recommendations are ready. 2 sentences. Friendly, not guilt-tripping. 1 emoji. No markdown.`,
  }

  try {
    const fetch = require('node-fetch')
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompts[trigger] }],
        max_tokens: 200,
        temperature: 0.8,
      }),
    })
    const data = await response.json()
    return data.choices?.[0]?.message?.content || getFallbackMessage(trigger, name)
  } catch (err) {
    console.error('Groq error:', err)
    return getFallbackMessage(trigger, name)
  }
}

// ─── Fallback messages ─────────────────────────────────────────────
function getFallbackMessage(trigger, name) {
  const messages = {
    ONBOARDING_COMPLETE: `Namaste ${name}! 🙏 Welcome to SaarthiAI — your personal AI insurance advisor. You can ask me anything about insurance in Hindi or English. What's your biggest insurance concern right now?`,
    LIFE_EVENT: `Congratulations ${name}! 🎉 This is a wonderful milestone — and a great time to protect what matters most. Chat with SaarthiAI to explore the best insurance options for your new journey.`,
    PRODUCT_VIEW: `Hi ${name}! 👋 Noticed you were exploring insurance options. Our AI advisor can help you compare and choose the perfect plan. Want a quick recommendation?`,
    HIGH_INTENT: `Hi ${name}! ⚡ You've been actively exploring insurance options — our AI advisor has personalized recommendations ready for you. Want to see them now?`,
    INACTIVE: `Hi ${name}! 🌟 Your personalized insurance recommendations are waiting on SaarthiAI. Takes just 2 minutes to find the perfect plan for you!`,
  }
  return messages[trigger] || messages.ONBOARDING_COMPLETE
}

// ─── Helper: Send WhatsApp via Twilio ──────────────────────────────
async function sendWhatsApp(phone, message, uid, trigger) {
  if (!phone) {
    console.log(`No phone number for uid: ${uid}, skipping WhatsApp`)
    return
  }

  // Format phone: ensure +91 prefix
  const formatted = phone.startsWith('+') ? `whatsapp:${phone}` : `whatsapp:+91${phone}`

  try {
    const msg = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: formatted,
      body: message,
    })

    // Log to Firestore for audit
    await db.collection('whatsappLogs').add({
      uid,
      trigger,
      message,
      phone: formatted,
      twilioSid: msg.sid,
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log(`✅ WhatsApp sent to ${formatted} | trigger: ${trigger} | sid: ${msg.sid}`)
  } catch (err) {
    console.error(`❌ WhatsApp failed for ${formatted}:`, err.message)
    await db.collection('whatsappLogs').add({
      uid, trigger, phone: formatted,
      status: 'failed', error: err.message,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  }
}

// ─── Helper: Check if already messaged recently (anti-spam) ────────
async function alreadyMessaged(uid, trigger, cooldownHours = 24) {
  const cutoff = new Date(Date.now() - cooldownHours * 60 * 60 * 1000)
  const snap = await db.collection('whatsappLogs')
    .where('uid', '==', uid)
    .where('trigger', '==', trigger)
    .where('sentAt', '>=', cutoff)
    .limit(1)
    .get()
  return !snap.empty
}

// ═══════════════════════════════════════════════════════════════════
// TRIGGER 1: Onboarding Complete
// ═══════════════════════════════════════════════════════════════════
exports.onOnboardingComplete = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()
    const uid = context.params.uid

    // Fire only when onboardingComplete flips false → true
    if (before.onboardingComplete || !after.onboardingComplete) return null
    if (!after.mobileNumber) return null

    const cooldown = await alreadyMessaged(uid, 'ONBOARDING_COMPLETE', 72)
    if (cooldown) return null

    const message = await generateWhatsAppMessage('ONBOARDING_COMPLETE', after)
    await sendWhatsApp(after.mobileNumber, message, uid, 'ONBOARDING_COMPLETE')
    return null
  })

// ═══════════════════════════════════════════════════════════════════
// TRIGGER 2: Life Event Detected
// ═══════════════════════════════════════════════════════════════════
exports.onLifeEventDetected = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()
    const uid = context.params.uid

    const oldEvents = before.lifeEvents || []
    const newEvents = after.lifeEvents || []

    // Only fire when a new life event is added
    if (newEvents.length <= oldEvents.length) return null
    if (!after.mobileNumber) return null

    const newEvent = newEvents[newEvents.length - 1]
    const cooldown = await alreadyMessaged(uid, `LIFE_EVENT_${newEvent.type}`, 48)
    if (cooldown) return null

    const message = await generateWhatsAppMessage('LIFE_EVENT', after)
    await sendWhatsApp(after.mobileNumber, message, uid, `LIFE_EVENT_${newEvent.type}`)

    // Also send email (existing behavior)
    if (after.email) {
      const emailContent = getEmailContent(newEvent.label, after.displayName?.split(' ')[0] || 'there')
      await transporter.sendMail({
        from: `"SaarthiAI" <${functions.config().gmail.email}>`,
        to: after.email,
        subject: emailContent.subject,
        html: emailContent.html,
      }).catch(e => console.error('Email error:', e))
    }

    return null
  })

// ═══════════════════════════════════════════════════════════════════
// TRIGGER 3: Product View (behavior tracking)
// ═══════════════════════════════════════════════════════════════════
exports.onProductView = functions.firestore
  .collection('behaviorLogs')
  .onWrite(async (change, context) => {
    const data = change.after.exists ? change.after.data() : null
    if (!data || data.event?.type !== 'PRODUCT_VIEW') return null

    const uid = data.uid
    const userSnap = await db.collection('users').doc(uid).get()
    if (!userSnap.exists) return null

    const user = userSnap.data()
    if (!user.mobileNumber) return null

    // Only send after 2nd product view (show intent)
    const recentViews = await db.collection('behaviorLogs')
      .where('uid', '==', uid)
      .where('event.type', '==', 'PRODUCT_VIEW')
      .get()

    if (recentViews.size < 2) return null

    const cooldown = await alreadyMessaged(uid, 'PRODUCT_VIEW', 6)
    if (cooldown) return null

    const message = await generateWhatsAppMessage('PRODUCT_VIEW', user)
    await sendWhatsApp(user.mobileNumber, message, uid, 'PRODUCT_VIEW')
    return null
  })

// ═══════════════════════════════════════════════════════════════════
// TRIGGER 4 & 5: High Intent Score + Inactive Users (Scheduled)
// Runs every day at 10 AM IST
// ═══════════════════════════════════════════════════════════════════
exports.scheduledOutreach = functions.pubsub
  .schedule('0 4 * * *') // 4 AM UTC = 9:30 AM IST
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const now = new Date()
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000)

    const usersSnap = await db.collection('users')
      .where('role', '==', 'customer')
      .where('onboardingComplete', '==', true)
      .get()

    let sent = 0

    for (const doc of usersSnap.docs) {
      const user = doc.data()
      const uid = doc.id

      if (!user.mobileNumber) continue

      // ── TRIGGER 4: High Intent Score ────────────────────────────
      if ((user.intentScore || 0) >= 70) {
        const cooldown = await alreadyMessaged(uid, 'HIGH_INTENT', 48)
        if (!cooldown) {
          const message = await generateWhatsAppMessage('HIGH_INTENT', user)
          await sendWhatsApp(user.mobileNumber, message, uid, 'HIGH_INTENT')
          sent++
          continue // Don't send 2 messages same day
        }
      }

      // ── TRIGGER 5: Inactive 3+ Days ─────────────────────────────
      const lastSeen = user.behaviorSummary?.lastSeen
      if (lastSeen) {
        const lastSeenDate = new Date(lastSeen)
        if (lastSeenDate < threeDaysAgo) {
          const cooldown = await alreadyMessaged(uid, 'INACTIVE', 72)
          if (!cooldown) {
            const message = await generateWhatsAppMessage('INACTIVE', user)
            await sendWhatsApp(user.mobileNumber, message, uid, 'INACTIVE')
            sent++
          }
        }
      }
    }

    console.log(`✅ Scheduled outreach complete — ${sent} messages sent`)
    return null
  })

// ═══════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES (existing, kept intact)
// ═══════════════════════════════════════════════════════════════════
function getEmailContent(eventLabel, name) {
  const templates = {
    'New Baby': {
      subject: `${name}, protect your growing family 👶`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px">
        <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" width="48" />
        <h2 style="color:#0B1F4B">Congratulations on your new baby, ${name}! 🎉</h2>
        <p style="color:#444">A new baby is a beautiful milestone — and the perfect time to secure their future.</p>
        <ul style="color:#444">
          <li><strong>Child ULIP Plan</strong> — Build education corpus</li>
          <li><strong>Term Life Insurance</strong> — Protect your family income</li>
          <li><strong>Maternity & Newborn Plan</strong> — Cover medical expenses</li>
        </ul>
        <a href="https://saarthi-ai.vercel.app/chat" style="display:inline-block;margin-top:16px;background:#FF6B00;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Chat with SaarthiAI →</a>
        <p style="color:#999;font-size:12px;margin-top:24px">SaarthiAI • DPDP 2023 Compliant</p>
      </div>`
    },
    'Getting Married': {
      subject: `${name}, plan your future together 💍`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px">
        <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" width="48" />
        <h2 style="color:#0B1F4B">Congratulations on your upcoming wedding, ${name}! 💍</h2>
        <p style="color:#444">Marriage is a new beginning — secure your journey together.</p>
        <ul style="color:#444">
          <li><strong>Term Life Insurance</strong> — Protect your partner</li>
          <li><strong>Health Insurance</strong> — Family floater plan</li>
        </ul>
        <a href="https://saarthi-ai.vercel.app/chat" style="display:inline-block;margin-top:16px;background:#FF6B00;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Chat with SaarthiAI →</a>
        <p style="color:#999;font-size:12px;margin-top:24px">SaarthiAI • DPDP 2023 Compliant</p>
      </div>`
    },
  }
  return templates[eventLabel] || {
    subject: `${name}, personalized insurance advice for you`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px">
      <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" width="48" />
      <h2 style="color:#0B1F4B">Hi ${name}! SaarthiAI has recommendations for you</h2>
      <p style="color:#444">Based on your recent life update — <strong>${eventLabel}</strong> — we have personalized plans for you.</p>
      <a href="https://saarthi-ai.vercel.app/chat" style="display:inline-block;margin-top:16px;background:#FF6B00;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Chat with SaarthiAI →</a>
      <p style="color:#999;font-size:12px;margin-top:24px">SaarthiAI • DPDP 2023 Compliant</p>
    </div>`
  }
}