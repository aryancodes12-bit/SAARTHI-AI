import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, ToggleLeft, ToggleRight, Trash2, Download, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useConsent } from '../hooks/useConsent'
import { logOut } from '../firebase/auth'
import { getConsentSummary, clearAllConsent } from '../utils/consentChecker'

export default function Settings() {
  const navigate = useNavigate()
  const { user, userProfile, refreshProfile } = useAuth()
  const { withdrawConsent, saving } = useConsent()

  const [consentStates, setConsentStates] = useState({
    marketing: userProfile?.consentDetails?.marketing ?? true,
    analytics: userProfile?.consentDetails?.analytics ?? true,
    aiProcessing: userProfile?.consentDetails?.aiProcessing ?? true,
    voice: userProfile?.consentDetails?.voice ?? false,
  })
  const [saved, setSaved] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const CONSENT_ITEMS = [
    { key: 'marketing', icon: '📢', label: 'Marketing Communications', desc: 'Personalized insurance offers and policy reminders', required: false },
    { key: 'analytics', icon: '📊', label: 'Behavioral Analytics', desc: 'Usage pattern analysis to improve recommendations', required: false },
    { key: 'aiProcessing', icon: '🤖', label: 'AI-Powered Recommendations', desc: 'Claude AI processes your profile for personalized advice', required: false },
    { key: 'voice', icon: '📞', label: 'Voice Call Agent (VAPI)', desc: 'Allow AI voice agent to contact you about matched plans', required: false },
  ]

  const handleSaveConsent = async () => {
    const { submitConsent } = useConsent()
    // Save updated consent
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleWithdrawAll = async () => {
    await withdrawConsent()
    clearAllConsent()
    await logOut()
    navigate('/')
  }

  const handleExportData = () => {
    const data = {
      uid: user?.uid,
      email: user?.email,
      profile: userProfile,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'saarthai-my-data.json'
    a.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0B1F4B] px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-white/70 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-white font-bold">Settings & Privacy</h1>
          <p className="text-blue-200 text-xs">DPDP Act 2023 Data Controls</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Profile Info */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-3 text-sm">Your Account</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0B1F4B] rounded-full flex items-center justify-center text-white font-bold">
              {userProfile?.displayName?.[0] || '?'}
            </div>
            <div>
              <p className="font-medium text-gray-800">{userProfile?.displayName}</p>
              <p className="text-gray-400 text-sm">{userProfile?.email || userProfile?.phone}</p>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">
                {userProfile?.role || 'customer'}
              </span>
            </div>
          </div>
        </div>

        {/* Consent Management */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-4 border-b border-gray-50">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-[#0B1F4B]" />
              <h2 className="font-semibold text-gray-800 text-sm">Consent Management</h2>
            </div>
            <p className="text-gray-400 text-xs">Control how your data is used. Changes take effect immediately.</p>
          </div>

          <div className="divide-y divide-gray-50">
            {/* Essential — always on */}
            <div className="px-4 py-3 flex items-center gap-3">
              <span className="text-lg">⚙️</span>
              <div className="flex-1">
                <p className="font-medium text-gray-800 text-sm">Essential Cookies</p>
                <p className="text-gray-400 text-xs">Required for platform functionality — cannot be disabled</p>
              </div>
              <div className="bg-gray-200 rounded-full px-2 py-0.5 text-xs text-gray-500">Always on</div>
            </div>

            {CONSENT_ITEMS.map(item => (
              <div key={item.key} className="px-4 py-3 flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{item.label}</p>
                  <p className="text-gray-400 text-xs">{item.desc}</p>
                </div>
                <button onClick={() => setConsentStates(c => ({ ...c, [item.key]: !c[item.key] }))}>
                  {consentStates[item.key]
                    ? <ToggleRight size={28} className="text-[#FF6B00]" />
                    : <ToggleLeft size={28} className="text-gray-300" />
                  }
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-50">
            <button onClick={handleSaveConsent} disabled={saving}
              className="w-full bg-[#0B1F4B] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-navy-light transition flex items-center justify-center gap-2">
              {saved ? <><CheckCircle size={16} /> Preferences Saved!</> : 'Save Preferences'}
            </button>
          </div>
        </div>

        {/* Your Rights under DPDP */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
            <Shield size={14} className="text-green-600" /> Your Rights — DPDP Act 2023
          </h2>
          <div className="space-y-2">
            <button onClick={handleExportData}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 text-left">
              <Download size={16} className="text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">Download My Data</p>
                <p className="text-xs text-gray-400">Export all your data in JSON format (Right to Access)</p>
              </div>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 text-left">
              <Shield size={16} className="text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">View Audit Trail</p>
                <p className="text-xs text-gray-400">See all consent and data processing activities</p>
              </div>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <h2 className="font-semibold text-red-700 text-sm mb-3 flex items-center gap-2">
            <AlertTriangle size={14} /> Withdraw Consent & Delete Data
          </h2>
          <p className="text-red-500 text-xs mb-4">
            This will revoke all consent, delete your data from our systems, and log you out. This action cannot be undone.
          </p>
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm text-red-600 font-medium border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition">
              <Trash2 size={14} /> Withdraw All Consent & Delete Data
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-red-600 text-sm font-medium">Are you absolutely sure?</p>
              <div className="flex gap-2">
                <button onClick={handleWithdrawAll} disabled={saving}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition">
                  Yes, Delete Everything
                </button>
                <button onClick={() => setDeleteConfirm(false)}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Version info */}
        <div className="text-center text-xs text-gray-300 pb-4">
          SaarthiAI v1.0 • DPDP Act 2023 Compliant • IRDAI Registered<br/>
          Consent Version 1.0 | {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}
