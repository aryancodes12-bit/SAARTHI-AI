// api/send-sms.js — Vercel Serverless Function (Textbelt - Free)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { phone, message } = req.body
  if (!phone || !message) {
    return res.status(400).json({ error: 'phone aur message required hain' })
  }

  const cleanPhone = '+91' + phone.replace(/\D/g, '').slice(-10)

  try {
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanPhone,
        message: message,
        key: process.env.TEXTBELT_API_KEY || 'textbelt', // 'textbelt' = 1 free SMS/day
      }),
    })

    const data = await response.json()
    console.log('📱 Textbelt response:', data)

    return res.status(200).json({
      success: data.success === true,
      data,
    })
  } catch (error) {
    console.error('❌ SMS error:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}