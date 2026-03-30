import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ArrowRight, ChevronLeft, Loader, User, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { signInWithGoogle, signUpWithEmail, resendVerificationEmail } from '../firebase/auth'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

// Password strength helper
function getStrength(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score // 0-4
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500']

export default function Signup() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('google')           // 'google' | 'email'
  const [step, setStep] = useState('form')           // 'form' | 'verify'

  // Shared
  const [name, setName] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Email-specific
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [resent, setResent] = useState(false)

  const strength = getStrength(password)

  useEffect(() => { setError('') }, [tab, name, email, password, termsAccepted])

  // ── Validation ────────────────────────────────────────────────────
  const validate = () => {
    if (!name.trim()) { setError('Please enter your full name'); return false }
    if (!termsAccepted) { setError('Please accept the Terms & Conditions and Privacy Policy'); return false }
    if (tab === 'email') {
      if (!email) { setError('Please enter your email address'); return false }
      if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email address'); return false }
      if (password.length < 6) { setError('Password must be at least 6 characters'); return false }
    }
    return true
  }

  // ── Google Sign Up ────────────────────────────────────────────────
  const handleGoogle = async () => {
    if (!validate()) return
    setLoading(true)
    const { success, error: err } = await signInWithGoogle()
    setLoading(false)
    // Always go to onboarding for new users; existing users handled by ProtectedRoute
    if (success) navigate('/onboarding')
    else setError(err || 'Google sign-up failed')
  }

  // ── Email Sign Up ─────────────────────────────────────────────────
  const handleEmailSignup = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const { success, error: err, needsVerification } = await signUpWithEmail(email, password, name.trim())
    setLoading(false)
    if (success && needsVerification) {
      setStep('verify')
    } else if (success) {
      navigate('/onboarding')
    } else {
      setError(err || 'Sign-up failed')
    }
  }

  // ── Resend Email ──────────────────────────────────────────────────
  const handleResend = async () => {
    setResent(false)
    await resendVerificationEmail()
    setResent(true)
    setTimeout(() => setResent(false), 5000)
  }

  // ── Email Verify Pending Screen ───────────────────────────────────
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-[#0B1F4B] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" alt="SaarthiAI" className="w-9 h-9 object-contain" />
              <span className="text-white text-2xl font-bold">Saarthi<span className="text-[#FF6B00]">AI</span></span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} className="text-[#0B1F4B]" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Check your inbox</h2>
            <p className="text-gray-500 text-sm mb-1">We sent a verification link to:</p>
            <p className="text-[#0B1F4B] font-semibold mb-6">{email}</p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 mb-6 text-left space-y-1">
              <p className="font-semibold">Next steps:</p>
              <p>1. Open the email from SaarthiAI</p>
              <p>2. Click the <strong>"Verify Email"</strong> link</p>
              <p>3. Come back here and <strong>Sign In</strong></p>
            </div>
            <button
              onClick={handleResend}
              disabled={resent}
              className="w-full border-2 border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:border-[#0B1F4B] transition mb-3 disabled:opacity-60"
            >
              {resent ? '✅ Verification email resent!' : 'Resend verification email'}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#0B1F4B] text-white py-3 rounded-xl font-bold hover:bg-[#1a3468] transition flex items-center justify-center gap-2"
            >
              Go to Sign In <ArrowRight size={16} />
            </button>
          </div>
          <button onClick={() => navigate('/')} className="mt-6 text-blue-200 text-sm hover:text-white flex items-center gap-1 mx-auto">
            <ChevronLeft size={14} /> Back to home
          </button>
        </div>
      </div>
    )
  }

  // ── Main Signup Form ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B1F4B] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" alt="SaarthiAI Logo" className="w-9 h-9 object-contain" />
            <span className="text-white text-2xl font-bold">Saarthi<span className="text-[#FF6B00]">AI</span></span>
          </div>
          <p className="text-blue-200 text-sm">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {[
              { id: 'google', label: 'Google' },
              { id: 'email', label: 'Email & Password' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError('') }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                  tab === t.id
                    ? 'text-[#FF6B00] border-b-2 border-[#FF6B00] bg-orange-50/50'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-8">

            {/* ── Shared: Name field ─────────────────────────────── */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#0B1F4B]"
                />
              </div>
            </div>

            {/* ── Email Tab: Email + Password ────────────────────── */}
            {tab === 'email' && (
              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#0B1F4B]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-3 text-sm focus:outline-none focus:border-[#0B1F4B]"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-3.5 text-gray-400" tabIndex={-1}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${strength >= i ? STRENGTH_COLORS[strength] : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      <p className={`text-xs mt-1 ${strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-yellow-600' : strength === 3 ? 'text-blue-600' : 'text-green-600'}`}>
                        {STRENGTH_LABELS[strength]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Shared: Terms checkbox ──────────────────────────── */}
            <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 text-[#FF6B00] border-gray-300 rounded focus:ring-[#FF6B00]"
              />
              <span className="text-sm text-gray-700">
                I have read and agree to the{' '}
                <a href="/terms.pdf" target="_blank" rel="noopener noreferrer" className="text-[#0B1F4B] font-semibold underline hover:text-[#FF6B00]" onClick={e => e.stopPropagation()}>
                  Terms & Conditions
                </a>
                {' '}and{' '}
                <a href="/privacy.pdf" target="_blank" rel="noopener noreferrer" className="text-[#0B1F4B] font-semibold underline hover:text-[#FF6B00]" onClick={e => e.stopPropagation()}>
                  Privacy Policy
                </a>.
              </span>
            </label>

            {/* ── CTA Button ─────────────────────────────────────── */}
            {tab === 'google' ? (
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3.5 font-semibold text-gray-700 hover:border-[#0B1F4B] hover:bg-gray-50 transition disabled:opacity-60"
              >
                {loading ? <Loader size={18} className="animate-spin" /> : <><GoogleIcon /> Sign up with Google</>}
              </button>
            ) : (
              <button
                onClick={handleEmailSignup}
                disabled={loading}
                className="w-full bg-[#FF6B00] text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader size={18} className="animate-spin" /> : <>Create Account <ArrowRight size={16} /></>}
              </button>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Already have account */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-[#0B1F4B] font-bold hover:underline">
                Sign in
              </button>
            </p>
          </div>
        </div>

        <button onClick={() => navigate('/')} className="mt-6 text-blue-200 text-sm hover:text-white flex items-center gap-1 mx-auto">
          <ChevronLeft size={14} /> Back to home
        </button>
      </div>
    </div>
  )
}