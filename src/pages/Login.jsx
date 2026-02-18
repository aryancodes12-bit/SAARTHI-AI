import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Loader, ChevronLeft } from 'lucide-react'
import { signInWithGoogle } from '../firebase/auth'
import { getUserProfile } from '../firebase/firestore'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { success, user, error: err } = await signInWithGoogle()
    setLoading(false)
    if (success) {
      const profile = await getUserProfile(user.uid)
      // If user has completed onboarding, go to dashboard; otherwise go to onboarding
      navigate(profile?.onboardingComplete ? '/dashboard' : '/onboarding')
    } else {
      setError(err || 'Google sign-in failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1F4B] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
<img
  src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png"
  alt="SaarthiAI Logo"
  className="w-9 h-9 object-contain"
/>
<span className="text-white text-2xl font-bold">Saarthi<span className="text-[#FF6B00]">AI</span></span>
          </div>
          <p className="text-blue-200 text-sm">Sign in to continue to your account</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
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
                Continue with Google
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              ⚠️ {error}
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            New to SaarthiAI?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-[#FF6B00] font-bold hover:underline"
            >
              Create account
            </button>
          </p>
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