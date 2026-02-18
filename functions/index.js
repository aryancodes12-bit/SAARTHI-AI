const functions = require('firebase-functions')
const admin = require('firebase-admin')
const nodemailer = require('nodemailer')

admin.initializeApp()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password, // Gmail App Password
  }
})

exports.sendLifeEventEmail = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    const oldEvents = before.lifeEvents || []
    const newEvents = after.lifeEvents || []

    // Naya event detect karo
    if (newEvents.length <= oldEvents.length) return null
    
    const newEvent = newEvents[newEvents.length - 1]
    const userEmail = after.email
    const userName = after.displayName || 'there'

    if (!userEmail) return null

    // Personalized email content based on life event
    const emailContent = getEmailContent(newEvent.label, userName)

    await transporter.sendMail({
      from: `"SaarthiAI" <${functions.config().gmail.email}>`,
      to: userEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    console.log(`Email sent to ${userEmail} for event: ${newEvent.label}`)
    return null
  })

function getEmailContent(eventLabel, name) {
  const templates = {
    'New Baby': {
      subject: `${name}, protect your growing family 👶`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px">
          <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" width="48" />
          <h2 style="color:#0B1F4B">Congratulations on your new baby, ${name}! 🎉</h2>
          <p style="color:#444">A new baby is a beautiful milestone — and the perfect time to secure their future.</p>
          <p style="color:#444">We recommend:</p>
          <ul style="color:#444">
            <li><strong>Child ULIP Plan</strong> — Build education corpus</li>
            <li><strong>Term Life Insurance</strong> — Protect your family income</li>
            <li><strong>Maternity & Newborn Plan</strong> — Cover medical expenses</li>
          </ul>
          <a href="https://your-app.com/chat" style="display:inline-block;margin-top:16px;background:#FF6B00;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Chat with SaarthiAI →
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px">SaarthiAI • DPDP 2023 Compliant • Unsubscribe anytime</p>
        </div>
      `
    },
    'Getting Married': {
      subject: `${name}, plan your future together 💍`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px">
          <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" width="48" />
          <h2 style="color:#0B1F4B">Congratulations on your upcoming wedding, ${name}! 💍</h2>
          <p style="color:#444">Marriage is a new beginning — secure your journey together.</p>
          <ul style="color:#444">
            <li><strong>Term Life Insurance</strong> — Protect your partner</li>
            <li><strong>Health Insurance</strong> — Family floater plan</li>
            <li><strong>Home Insurance</strong> — For your new home</li>
          </ul>
          <a href="https://your-app.com/chat" style="display:inline-block;margin-top:16px;background:#FF6B00;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Chat with SaarthiAI →
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px">SaarthiAI • DPDP 2023 Compliant</p>
        </div>
      `
    },
    'Buying Home': {
      subject: `${name}, protect your new home 🏠`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px">
          <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" width="48" />
          <h2 style="color:#0B1F4B">Exciting news, ${name}! A new home 🏠</h2>
          <p style="color:#444">Protect your biggest investment with the right insurance.</p>
          <ul style="color:#444">
            <li><strong>HomeSafe Standard Cover</strong> — Structure & contents</li>
            <li><strong>Mortgage Protection Plan</strong> — Cover your loan</li>
          </ul>
          <a href="https://your-app.com/chat" style="display:inline-block;margin-top:16px;background:#FF6B00;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Chat with SaarthiAI →
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px">SaarthiAI • DPDP 2023 Compliant</p>
        </div>
      `
    },
  }

  // Default template agar event match na ho
  return templates[eventLabel] || {
    subject: `${name}, personalized insurance advice for you`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px">
        <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" width="48" />
        <h2 style="color:#0B1F4B">Hi ${name}! SaarthiAI has recommendations for you</h2>
        <p style="color:#444">Based on your recent life update — <strong>${eventLabel}</strong> — we have personalized insurance plans for you.</p>
        <a href="https://your-app.com/chat" style="display:inline-block;margin-top:16px;background:#FF6B00;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Chat with SaarthiAI →
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px">SaarthiAI • DPDP 2023 Compliant</p>
      </div>
    `
  }
}