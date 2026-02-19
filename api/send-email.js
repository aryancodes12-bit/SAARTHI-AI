// api/send-email.js — Vercel Serverless Function (EmailJS)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { to_email, subject, message, to_name } = req.body

  if (!to_email || !message) {
    return res.status(400).json({ error: 'to_email aur message required hain' })
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'service_n7mx59n',
        template_id: 'template_q17vqyq',
     user_id: 'h8aFcNKUWZTN8_R4O',  // key- prefix hatao
        template_params: {
          to_email,
          to_name: to_name || 'Customer',
          subject: subject || 'SaarthiAI — Important Update',
          message,
          name: to_name || 'Customer',
        },
      }),
    })

    const text = await response.text()
    console.log('📧 EmailJS response:', text)

    return res.status(200).json({ success: response.ok, data: text })
  } catch (error) {
    console.error('❌ Email error:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}