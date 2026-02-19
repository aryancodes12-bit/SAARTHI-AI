import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ChevronRight, CheckCircle, Loader, Phone } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { updateUserProfile } from '../firebase/firestore'
import { saveConsentCookie } from '../utils/consentChecker'
import { saveConsent } from '../firebase/firestore'
import { sendOnboardingSMS } from '../utils/smsSender'
import { sendWelcomeEmail } from '../utils/smsSender'

const STEPS = [
  { id: 'profile', title: 'Your Profile', subtitle: 'Help us personalize your experience' },
  { id: 'consent', title: 'Consent & Privacy', subtitle: 'DPDP Act 2023 — Your data, your choice' },
  { id: 'done', title: "You're all set!", subtitle: 'Welcome to SaarthiAI' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, refreshProfile, grantConsent } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const [profile, setProfile] = useState({
    ageGroup: '',
    occupation: '',
    dependents: '',
    city: '',
    income: '',
    mobileNumber: '',
  })

  const [consent, setConsent] = useState({
    marketing: true,
    analytics: true,
    aiProcessing: true,
    voice: false,
  })

  const handleProfileSubmit = async () => {
    const errors = {}
    if (!profile.ageGroup) errors.ageGroup = 'Required'
    if (!profile.occupation) errors.occupation = 'Required'
    if (!profile.dependents) errors.dependents = 'Required'
    if (!profile.mobileNumber) errors.mobileNumber = 'Mobile number is required'
    else if (!profile.mobileNumber.match(/^[6-9]\d{9}$/)) errors.mobileNumber = 'Enter valid 10-digit Indian mobile number'

    setFieldErrors(errors)
    if (errors.mobileNumber) setPhoneError(errors.mobileNumber)
    else setPhoneError('')

    if (Object.keys(errors).length > 0) return
    
    setLoading(true)
    await updateUserProfile(user.uid, {
      ...profile,
      phoneNumber: '+91' + profile.mobileNumber,
      mobileNumber: '+91' + profile.mobileNumber,
      onboardingStep: 'consent',
    })
    setLoading(false)
    setStep(1)
  }

  const handleConsentSubmit = async () => {
    setLoading(true)
    
    await saveConsent(user.uid, consent)
    saveConsentCookie(consent)
    grantConsent()
    await updateUserProfile(user.uid, { onboardingComplete: true })
    await refreshProfile()
    
    // Send welcome SMS
    if (consent.marketing && profile.mobileNumber) {
      try {
        await sendOnboardingSMS({
          phoneNumber: '+91' + profile.mobileNumber,
          displayName: user.displayName,
          uid: user.uid,
        })
        console.log('✅ Welcome SMS sent!')
      } catch (err) {
        console.error('SMS send error:', err)
      }
    }

    // Send welcome Email
    if (consent.marketing && user.email) {
      try {
        await sendWelcomeEmail({
          email: user.email,
          displayName: user.displayName,
        })
        console.log('✅ Welcome Email sent!')
      } catch (err) {
        console.error('Email send error:', err)
      }
    }
    
    setLoading(false)
    setStep(2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1F4B] to-[#1a3468] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-[#FF6B00] rounded-xl flex items-center justify-center">
              <Shield className="text-white" size={18} />
            </div>
            <span className="text-white text-xl font-bold">saarthi<span className="text-[#FF6B00]">ai</span></span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step ? 'bg-green-400 text-white' :
                i === step ? 'bg-[#FF6B00] text-white' :
                'bg-white/20 text-white/40'
              }`}>
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 ${i < step ? 'bg-green-400' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-[#0B1F4B] mb-1">{STEPS[step].title}</h2>
          <p className="text-gray-500 text-sm mb-6">{STEPS[step].subtitle}</p>

          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Age Group</label>
                  <select value={profile.ageGroup} onChange={e => setProfile(p => ({ ...p, ageGroup: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B1F4B] ${fieldErrors.ageGroup ? "border-red-400 bg-red-50" : "border-gray-200"}`}>
                    <option value="">Select</option>
                    {['18-25', '26-35', '36-45', '46-55', '55+'].map(a => <option key={a} value={a}>{a} years</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Occupation</label>
                  <select value={profile.occupation} onChange={e => setProfile(p => ({ ...p, occupation: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B1F4B] ${fieldErrors.occupation ? "border-red-400 bg-red-50" : "border-gray-200"}`}>
                    <option value="">Select</option>
                    {['Salaried', 'Self-Employed', 'Business Owner', 'Freelancer', 'Student', 'Retired'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dependents</label>
                  <select value={profile.dependents} onChange={e => setProfile(p => ({ ...p, dependents: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B1F4B] ${fieldErrors.dependents ? "border-red-400 bg-red-50" : "border-gray-200"}`}>
                    <option value="">Select</option>
                    {['None', '1', '2', '3', '4+'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                    placeholder="Mumbai"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B1F4B]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Annual Income (approx.)</label>
                <select value={profile.income} onChange={e => setProfile(p => ({ ...p, income: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B1F4B]">
                  <option value="">Prefer not to say</option>
                  {['Under 3L', '3L - 7L', '7L - 15L', '15L - 30L', 'Above 30L'].map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                  <span className="text-gray-400 ml-1 font-normal">(for SMS alerts & voice calls)</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={profile.mobileNumber}
                    onChange={e => {
                      setPhoneError('')
                      setProfile(p => ({ ...p, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))
                    }}
                    placeholder="9876543210"
                    className={`flex-1 border rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B1F4B] ${
                      phoneError ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                </div>
                {phoneError
                  ? <p className="text-red-500 text-xs mt-1">* {phoneError}</p>
                  : <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                      <Phone size={10} /> Used for SMS campaigns & VAPI voice advisor — never shared
                    </p>
                }
              </div>

              <button onClick={handleProfileSubmit} disabled={loading}
                className="w-full bg-[#0B1F4B] text-white py-3 rounded-xl font-bold hover:bg-blue-900 transition flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Loader size={16} className="animate-spin" /> : <>Continue <ChevronRight size={16} /></>}
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">Your data is protected under DPDP Act 2023</p>
                <p className="text-xs text-blue-500">You can withdraw consent any time from Settings → Privacy</p>
              </div>

              {[
                { key: 'marketing', icon: '📢', label: 'Marketing Communications', desc: 'Receive personalized offers via SMS, Email & WhatsApp' },
                { key: 'analytics', icon: '📊', label: 'Behavioral Analytics', desc: 'Help us improve by analyzing your usage patterns' },
                { key: 'aiProcessing', icon: '🤖', label: 'AI-Powered Recommendations', desc: 'Allow AI to analyze your profile for better recommendations' },
                { key: 'voice', icon: '📞', label: 'Voice Call Agent', desc: 'Allow VAPI AI voice agent to call you for personalized guidance' },
              ].map(item => (
                <div key={item.key} className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer"
                  onClick={() => setConsent(c => ({ ...c, [item.key]: !c[item.key] }))}>
                  <div className="text-xl">{item.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{item.label}</p>
                    <p className="text-gray-500 text-xs">{item.desc}</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${consent[item.key] ? 'bg-[#FF6B00]' : 'bg-gray-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${consent[item.key] ? 'translate-x-4' : ''}`} />
                  </div>
                </div>
              ))}

              <p className="text-xs text-gray-400 text-center">Essential cookies are always required for the platform to function.</p>

              <button onClick={handleConsentSubmit} disabled={loading}
                className="w-full bg-[#FF6B00] text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Loader size={16} className="animate-spin" /> : <>Save Preferences & Continue <ChevronRight size={16} /></>}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-500" size={40} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Welcome to SaarthiAI!</h3>
              <p className="text-gray-500 text-sm mb-2">Your AI-powered insurance advisor is ready.</p>
              {consent.marketing && (
                <p className="text-green-600 text-xs mb-4 flex items-center justify-center gap-1">
                  ✓ Welcome SMS & Email sent!
                </p>
              )}
              <p className="text-gray-400 text-xs mb-6">Let's find the perfect protection for you.</p>
              <button onClick={() => navigate('/dashboard')}
                className="w-full bg-[#0B1F4B] text-white py-3 rounded-xl font-bold hover:bg-blue-900 transition flex items-center justify-center gap-2">
                Go to Dashboard <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}