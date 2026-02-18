import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Phone, ArrowRight, ChevronLeft, Loader, User, CheckCircle } from 'lucide-react'
import { signInWithGoogle } from '../firebase/auth'
import { updateUserProfile } from '../firebase/firestore'

// Hardcoded valid OTPs for demo (no actual SMS sent)
const VALID_OTPS = ['225705', '586546', '122644', '899662', '136439']

export default function Signup() {
  const navigate = useNavigate()
  const [step, setStep] = useState('google') // 'google', 'mobile', 'otp'
  const [tempUser, setTempUser] = useState(null)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    if (error) setError('')
  }, [name, phone, otp, termsAccepted])

  // Handle Google Sign-In
  const handleGoogle = async () => {
    if (!name.trim()) {
      setNameError('Please enter your name')
      return
    }
    if (!termsAccepted) {
      setError('You must accept the Terms & Conditions and Privacy Policy')
      return
    }
    setNameError('')
    setLoading(true)
    setError('')
    const { success, user, error: err } = await signInWithGoogle()
    setLoading(false)
    if (success) {
      setTempUser(user)
      setStep('mobile')
    } else {
      setError(err || 'Google sign-up failed')
    }
  }

  // Simulate sending OTP (no actual SMS)
  const handleSendOTP = async () => {
    if (!phone.match(/^[6-9]\d{9}$/)) {
      setError('Enter valid 10-digit mobile number')
      return
    }

    setLoading(true)
    setError('')

    // Simulate network delay
    setTimeout(() => {
      setOtpSent(true)
      setStep('otp')
      setLoading(false)
    }, 1000)
  }

  // Verify OTP against hardcoded list
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Enter 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    // Simulate verification delay
    setTimeout(async () => {
      if (VALID_OTPS.includes(otp)) {
        try {
          const formattedPhone = `+91${phone}`
          await updateUserProfile(tempUser.uid, {
            displayName: name.trim(),
            mobileNumber: formattedPhone,
            mobileVerified: true,
            termsAccepted: true,
            signupComplete: true
          })
          // Go directly to dashboard – signup complete
          navigate('/dashboard')
        } catch (err) {
          setError('Failed to save phone number. Please try again.')
        }
      } else {
        setError('Invalid OTP. Please try again.')
      }
      setLoading(false)
    }, 800)
  }

  // Render step content
  const renderStep = () => {
    switch (step) {
      case 'google':
        return (
          <>
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
                  className={`w-full border rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#0B1F4B] ${nameError ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                />
              </div>
              {nameError && <p className="text-red-500 text-xs mt-1">* {nameError}</p>}
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 text-[#FF6B00] border-gray-300 rounded focus:ring-[#FF6B00]"
              />
              <span className="text-sm text-gray-700">
                I have read and agree to the{' '}
                <a
                  href="/terms.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0B1F4B] font-semibold underline hover:text-[#FF6B00]"
                  onClick={e => e.stopPropagation()}
                >
                  Terms & Conditions
                </a>
                {' '}and{' '}
                <a
                  href="/privacy.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0B1F4B] font-semibold underline hover:text-[#FF6B00]"
                  onClick={e => e.stopPropagation()}
                >
                  Privacy Policy
                </a>.
              </span>
            </label>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3 font-medium text-gray-700 hover:border-[#0B1F4B] hover:bg-gray-50 transition disabled:opacity-60"
            >
              {loading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign up with Google
                </>
              )}
            </button>
          </>
        )

      case 'mobile':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Enter your mobile number</h3>
            <p className="text-sm text-gray-500 mb-4">We'll send a verification code to this number</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="flex-1 border border-gray-300 rounded-r-lg px-3 py-3 text-sm focus:outline-none focus:border-[#0B1F4B]"
                />
              </div>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading || phone.length < 10}
              className="w-full bg-[#0B1F4B] text-white py-3 rounded-xl font-bold hover:bg-blue-900 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader size={18} className="animate-spin" /> : <><Phone size={16} /> Send Verification Code</>}
            </button>

            <button
              onClick={() => setStep('google')}
              className="w-full text-sm text-gray-500 hover:text-[#0B1F4B] flex items-center justify-center gap-1"
            >
              <ChevronLeft size={14} /> Back
            </button>
          </div>
        )

      case 'otp':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle size={40} className="mx-auto text-green-500 mb-2" />
              <h3 className="text-lg font-semibold text-gray-800">Verification Code Sent</h3>
              <p className="text-sm text-gray-500 mt-1">
                Check your messages for a verification code
              </p>
            </div>

            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="• • • • • •"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest focus:outline-none focus:border-[#0B1F4B]"
              autoFocus
            />
<p className="text-xs text-gray-400 text-center mt-2">
  Prototype Demo OTPs: 225705
</p>

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full bg-[#FF6B00] text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader size={18} className="animate-spin" /> : <>Verify & Continue <ArrowRight size={16} /></>}
            </button>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('mobile')}
                className="text-sm text-gray-500 hover:text-[#0B1F4B] flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Change number
              </button>

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="text-sm text-[#FF6B00] hover:text-orange-700"
              >
                Resend Code
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1F4B] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
       <img
  src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png"
  alt="SaarthiAI Logo"
  className="w-9 h-9 object-contain"
/>
<span className="text-white text-2xl font-bold">Saarthi<span className="text-[#FF6B00]">AI</span></span>
          </div>
          <p className="text-blue-200 text-sm">
            {step === 'google' && 'Create your free account'}
            {step === 'mobile' && 'Verify your mobile number'}
            {step === 'otp' && 'Enter verification code'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {renderStep()}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Link to login (only on first step) */}
          {step === 'google' && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-[#0B1F4B] font-bold hover:underline">
                Sign in
              </button>
            </p>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-6 text-blue-200 text-sm hover:text-white flex items-center gap-1 mx-auto"
        >
          <ChevronLeft size={14} /> Back to home
        </button>
      </div>
    </div>
  )
}