// api/send-sms.js — Vercel Serverless Function

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

  const cleanPhone = phone.replace(/\D/g, '').slice(-10)

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'q',
        message: message,
        language: 'english',
        flash: 0,
        numbers: cleanPhone,
      }),
    })

    const data = await response.json()
    console.log('📱 Fast2SMS response:', data)

    return res.status(200).json({
      success: data.return === true,
      data,
    })
  } catch (error) {
    console.error('❌ Fast2SMS error:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}