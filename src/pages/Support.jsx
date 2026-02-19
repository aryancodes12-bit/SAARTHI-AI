import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { ArrowLeft, Mail, Send, CheckCircle, AlertCircle, Loader } from 'lucide-react'

const SERVICE_ID = 'service_n7mx59n'
const TEMPLATE_ID = 'template_nyqfwcv'
const PUBLIC_KEY = 'h8aFcNKUWZTN8_R4O'

export default function Support() {
  const navigate = useNavigate()
  const formRef = useRef()
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState(null)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
  name: formData.name,
  email: formData.email,
  subject: formData.subject,
  message: formData.message,
}, PUBLIC_KEY)
      setStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#0B1F4B] text-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="hover:text-[#FF6B00]">
          <ArrowLeft size={20} />
        </button>
        <span className="font-bold text-lg">SaarthiAI Support</span>
      </div>

      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-[#0B1F4B] mb-2">Humein Likhe</h1>
        <p className="text-gray-500 mb-8">24 ghante mein jawab milega • DPDP 2023 Compliant</p>

        {status === 'success' ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Message Bhej Diya! 🎉</h3>
            <p className="text-gray-500 mb-6">Hum jald reply karenge.</p>
            <button onClick={() => setStatus(null)} className="text-[#FF6B00] font-medium hover:underline">
              Dobara likhein
            </button>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
              <input name="name" value={formData.name} onChange={handleChange} required
                placeholder="Ramesh Kumar"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required
                placeholder="ramesh@example.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vishay *</label>
              <select name="subject" value={formData.subject} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] bg-white">
                <option value="">-- Chunein --</option>
                <option value="Policy Recommendation Issue">Policy Recommendation mein dikkat</option>
                <option value="Account Login Problem">Account / Login problem</option>
                <option value="Data Privacy Request">Data Privacy Request (DPDP)</option>
                <option value="Voice Agent Issue">Voice Agent mein samasya</option>
                <option value="Billing / Refund">Billing / Refund</option>
                <option value="General Enquiry">Aam Poochh-taachh</option>
                <option value="Other">Kuch aur</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sandesh *</label>
              <textarea name="message" value={formData.message} onChange={handleChange} required rows={5}
                placeholder="Apni samasya yahan likhein..."
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] resize-none" />
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">
                <AlertCircle size={16} /> Message send nahi hua. Dobara try karein.
              </div>
            )}

            <button type="submit" disabled={status === 'loading'}
              className="w-full bg-[#FF6B00] hover:bg-[#e55f00] disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
              {status === 'loading' ? <><Loader size={18} className="animate-spin" /> Bhej rahe hain...</> : <><Send size={18} /> Message Bhejein</>}
            </button>
            <p className="text-gray-400 text-xs text-center">🔒 DPDP 2023 compliant • Aapka data secure hai</p>
          </form>
        )}
      </div>
    </div>
  )
}