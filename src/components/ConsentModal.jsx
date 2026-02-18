import { useState } from 'react'
import { Shield, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useConsent } from '../hooks/useConsent'
import { saveConsentCookie } from '../utils/consentChecker'

export default function ConsentModal() {
  const { submitConsent } = useConsent()
  const [expanded, setExpanded] = useState(false)
  const [consents, setConsents] = useState({
    marketing: true,
    analytics: true,
    aiProcessing: true,
    voice: false,
  })
  const [saving, setSaving] = useState(false)

  const handleAcceptAll = async () => {
    setSaving(true)
    const all = { marketing: true, analytics: true, aiProcessing: true, voice: true }
    saveConsentCookie(all)
    await submitConsent(all)
    setSaving(false)
  }

  const handleEssentialOnly = async () => {
    setSaving(true)
    const essential = { marketing: false, analytics: false, aiProcessing: false, voice: false }
    saveConsentCookie(essential)
    await submitConsent(essential)
    setSaving(false)
  }

  const handleCustomSave = async () => {
    setSaving(true)
    saveConsentCookie(consents)
    await submitConsent(consents)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B1F4B] px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FF6B00] rounded-lg flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Privacy & Consent</p>
            <p className="text-blue-200 text-xs">DPDP Act 2023 — Your data, your choice</p>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            SaarthiAI uses cookies and AI processing to provide personalized insurance recommendations. 
            You have full control over your data under the <strong>Digital Personal Data Protection Act 2023</strong>.
          </p>

          {/* Expandable preferences */}
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-[#0B1F4B] font-medium mb-3 hover:underline">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Customize preferences
          </button>

          {expanded && (
            <div className="space-y-2 mb-4 border border-gray-100 rounded-xl p-3 bg-gray-50">
              {[
                { key: 'marketing', icon: '📢', label: 'Marketing', desc: 'Personalized offers' },
                { key: 'analytics', icon: '📊', label: 'Analytics', desc: 'Usage improvement' },
                { key: 'aiProcessing', icon: '🤖', label: 'AI Processing', desc: 'Smart recommendations' },
                { key: 'voice', icon: '📞', label: 'Voice Agent', desc: 'AI call advisor' },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-3"
                  onClick={() => setConsents(c => ({ ...c, [item.key]: !c[item.key] }))}>
                  <span>{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <div className={`w-9 h-5 rounded-full cursor-pointer transition-colors ${consents[item.key] ? 'bg-[#FF6B00]' : 'bg-gray-200'}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full shadow mt-0.5 transition-transform ${consents[item.key] ? 'translate-x-4.5 ml-0.5' : 'ml-0.5'}`} style={{transform: consents[item.key] ? 'translateX(18px)' : 'translateX(2px)', marginTop: '4px'}} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {expanded ? (
              <button onClick={handleCustomSave} disabled={saving}
                className="w-full bg-[#FF6B00] text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition">
                {saving ? 'Saving...' : 'Save My Preferences'}
              </button>
            ) : (
              <button onClick={handleAcceptAll} disabled={saving}
                className="w-full bg-[#FF6B00] text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition">
                {saving ? 'Saving...' : 'Accept All & Continue'}
              </button>
            )}
            <button onClick={handleEssentialOnly} disabled={saving}
              className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
              Essential Cookies Only
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-3">
            You can change preferences anytime in Settings → Privacy
          </p>
        </div>
      </div>
    </div>
  )
}
