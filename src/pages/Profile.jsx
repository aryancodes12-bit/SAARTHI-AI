import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Camera, User, Mail, Phone, Briefcase,
  Users, MapPin, Save, CheckCircle, Loader, AlertCircle,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { updateUserProfile } from '../firebase/firestore'

const AGE_GROUPS = ['18-25', '26-35', '36-45', '46-55', '55+']
const OCCUPATIONS = ['Salaried', 'Self-Employed', 'Business Owner', 'Freelancer', 'Student', 'Retired']
const DEPENDENTS_OPTS = ['None', '1', '2', '3', '4+']
const INCOME_OPTS = ['Prefer not to say', 'Under 3L', '3L - 7L', '7L - 15L', '15L - 30L', 'Above 30L']
const LIFE_STAGES = [
  { id: 'single', emoji: '🧑', label: 'Single' },
  { id: 'married', emoji: '💍', label: 'Married' },
  { id: 'parent', emoji: '👶', label: 'New Parent' },
  { id: 'homeowner', emoji: '🏠', label: 'Homeowner' },
  { id: 'retirement', emoji: '🌅', label: 'Near Retirement' },
]

export default function Profile() {
  const navigate = useNavigate()
  const { user, userProfile, refreshProfile } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    displayName: userProfile?.displayName || '',
    phone: userProfile?.mobileNumber?.replace('+91', '') || userProfile?.phoneNumber?.replace('+91', '') || '',
    ageGroup: userProfile?.ageGroup || '',
    occupation: userProfile?.occupation || '',
    dependents: userProfile?.dependents || '',
    city: userProfile?.city || '',
    income: userProfile?.income || '',
    lifeStage: userProfile?.lifeStage || '',
  })

  const [avatarPreview, setAvatarPreview] = useState(userProfile?.photoURL || null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Photo must be under 2 MB'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const uploadAvatar = async () => {
    if (!avatarFile) return avatarPreview
    // Convert to base64 data URL (stored in Firestore directly for simplicity)
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.readAsDataURL(avatarFile)
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.displayName.trim()) { setError('Name is required'); return }
    setError('')
    setSaving(true)

    try {
      const photoURL = await uploadAvatar()
      await updateUserProfile(user.uid, {
        displayName: form.displayName.trim(),
        mobileNumber: form.phone ? `+91${form.phone.replace(/\D/g, '')}` : null,
        phoneNumber: form.phone ? `+91${form.phone.replace(/\D/g, '')}` : null,
        ageGroup: form.ageGroup,
        occupation: form.occupation,
        dependents: form.dependents,
        city: form.city,
        income: form.income,
        lifeStage: form.lifeStage,
        photoURL: photoURL || null,
      })
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const initials = (form.displayName || user?.email || '?')[0]?.toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <nav className="sticky top-0 z-40 bg-[#0B1F4B] px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium px-3 py-2 rounded-xl hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={16} /> Dashboard
          </button>
          <div className="w-px h-5 bg-white/20" />
          <span className="text-white font-bold text-lg">
            Saarthi<span className="text-[#FF6B00]">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <User size={16} className="text-white/60" />
          <span className="text-white text-sm font-semibold">My Profile</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSave} className="space-y-6">

          {/* ── Avatar Card ───────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#0B1F4B] to-[#1a3468] flex items-center justify-center shadow-lg ring-4 ring-[#FF6B00]/30">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-4xl font-bold">{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
              >
                <Camera size={22} className="text-white" />
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div className="text-center">
              <p className="font-bold text-gray-800 text-lg">{form.displayName || 'Your Name'}</p>
              <p className="text-gray-400 text-sm">{user?.email || userProfile?.email || '—'}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs text-[#FF6B00] font-semibold hover:underline"
              >
                Change photo
              </button>
            </div>
          </div>

          {/* ── Personal Details ─────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="text-base font-bold text-[#0B1F4B] flex items-center gap-2">
              <User size={16} className="text-[#FF6B00]" /> Personal Details
            </h2>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name *</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={form.displayName}
                  onChange={e => set('displayName', e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#0B1F4B] focus:ring-2 focus:ring-[#0B1F4B]/10 transition"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full border border-gray-100 rounded-xl pl-9 pr-4 py-3 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed here</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mobile Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-gray-500 text-sm">🇮🇳 +91</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="flex-1 border border-gray-200 rounded-r-xl px-3 py-3 text-sm focus:outline-none focus:border-[#0B1F4B] transition"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">City</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder="Mumbai"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#0B1F4B] transition"
                />
              </div>
            </div>
          </div>

          {/* ── Life Stage ────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-[#0B1F4B] mb-4 flex items-center gap-2">
              🎯 Life Stage
            </h2>
            <div className="grid grid-cols-5 gap-2">
              {LIFE_STAGES.map(ls => (
                <button
                  key={ls.id}
                  type="button"
                  onClick={() => set('lifeStage', ls.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                    form.lifeStage === ls.id
                      ? 'border-[#FF6B00] bg-orange-50 shadow-sm scale-105'
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{ls.emoji}</span>
                  <span className="text-[10px] font-semibold text-gray-600">{ls.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Professional & Financial ─────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="text-base font-bold text-[#0B1F4B] flex items-center gap-2">
              <Briefcase size={16} className="text-[#FF6B00]" /> Professional & Financial
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Age Group */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Age Group</label>
                <select
                  value={form.ageGroup}
                  onChange={e => set('ageGroup', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#0B1F4B] transition bg-white"
                >
                  <option value="">Select</option>
                  {AGE_GROUPS.map(a => <option key={a} value={a}>{a} years</option>)}
                </select>
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Occupation</label>
                <select
                  value={form.occupation}
                  onChange={e => set('occupation', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#0B1F4B] transition bg-white"
                >
                  <option value="">Select</option>
                  {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Dependents */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Dependents</label>
                <select
                  value={form.dependents}
                  onChange={e => set('dependents', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#0B1F4B] transition bg-white"
                >
                  <option value="">Select</option>
                  {DEPENDENTS_OPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Annual Income */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Annual Income</label>
                <select
                  value={form.income}
                  onChange={e => set('income', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#0B1F4B] transition bg-white"
                >
                  {INCOME_OPTS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Error & Save ─────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm animate-fadeIn">
              <CheckCircle size={16} /> Profile saved successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-[#FF6B00] to-orange-600 text-white py-4 rounded-2xl font-bold text-base hover:shadow-lg hover:shadow-orange-500/30 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:scale-100"
          >
            {saving ? (
              <><Loader size={20} className="animate-spin" /> Saving…</>
            ) : saved ? (
              <><CheckCircle size={20} /> Saved!</>
            ) : (
              <><Save size={20} /> Save Changes</>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 pb-4">
            🛡️ Your data is protected under DPDP Act 2023. Changes sync instantly.
          </p>
        </form>
      </div>
    </div>
  )
}
