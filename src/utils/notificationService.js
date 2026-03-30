import axios from 'axios'

const TEXTMEBOT_API_KEY = import.meta.env.VITE_TEXTMEBOT_API_KEY
const TEXTBEE_API_KEY = import.meta.env.VITE_TEXTBEE_API_KEY
const TEXTBEE_DEVICE_ID = import.meta.env.VITE_TEXTBEE_DEVICE_ID

/**
 * Sends a WhatsApp message via TextMeBot
 * @param {string} recipient - Phone number with country code (e.g. +91...)
 * @param {string} text - Message content
 */
export async function sendWhatsApp(recipient, text) {
  if (!TEXTMEBOT_API_KEY || TEXTMEBOT_API_KEY.includes('YOUR_')) {
    console.warn('TextMeBot API Key missing. Skipping WhatsApp.')
    return { success: false, error: 'API Key missing' }
  }

  try {
    // TextMeBot GET request via proxy to avoid CORS
    const response = await axios.get('/textmebot/send.php', {
      params: {
        recipient: recipient.replace('+', ''), 
        apikey: TEXTMEBOT_API_KEY,
        text: text,
        cb: Date.now() // Cache busting
      }
    })
    
    console.log('✅ WhatsApp Sent:', response.data)
    return { success: true, data: response.data }
  } catch (error) {
    console.error('❌ WhatsApp Error:', error.response?.data || error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Sends an SMS via TextBee.io
 * @param {string} recipient - Phone number with country code
 * @param {string} message - Message content
 */
export async function sendSMS(recipient, message) {
  if (!TEXTBEE_API_KEY || TEXTBEE_API_KEY.includes('YOUR_')) {
    console.warn('TextBee API Key missing. Skipping SMS.')
    return { success: false, error: 'API Key missing' }
  }

  try {
    // Calling via Vite proxy defined in vite.config.js to avoid CORS errors
    const response = await axios.post(`/textbee/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`, {
      recipients: [recipient.replace(/\s/g, '')], // Field must be 'recipients' and an array
      message: message
    }, {
      headers: {
        'x-api-key': TEXTBEE_API_KEY,
        'Content-Type': 'application/json'
      }
    })

    console.log('✅ SMS Sent:', response.data)
    return { success: true, data: response.data }
  } catch (error) {
    console.error('❌ SMS Error:', error.response?.data || error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Logs a notification to LocalStorage for admin visibility
 */
export function logNotification(type, to, message, status) {
  const logs = JSON.parse(localStorage.getItem('notification_logs') || '[]')
  logs.unshift({
    id: Date.now(),
    type, // 'whatsapp' | 'sms'
    to,
    message,
    status,
    timestamp: new Date().toISOString()
  })
  localStorage.setItem('notification_logs', JSON.stringify(logs.slice(0, 50)))
}
