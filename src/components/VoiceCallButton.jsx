import { useState, useEffect } from 'react'
import { Phone, PhoneOff, Loader, Mic, MicOff } from 'lucide-react'

// ─── DEMO MODE — No VAPI needed ────────────────────────────────────
// Realistic UI animation for hackathon demo
const DEMO_MODE = true // Set false when you have working VAPI account

export default function VoiceCallButton({ userProfile, compact = false }) {
  const [callState, setCallState] = useState('idle') // idle | connecting | active | ended
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Auto-end demo call after 15 seconds
    if (DEMO_MODE && callState === 'active') {
      const timer = setTimeout(() => {
        setCallState('ended')
        setTimeout(() => setCallState('idle'), 3000)
      }, 15000)
      return () => clearTimeout(timer)
    }
  }, [callState])

  const startCall = async () => {
    setCallState('connecting')
    setError('')

    if (DEMO_MODE) {
      // Demo mode — realistic timing
      await new Promise(r => setTimeout(r, 2000))
      setCallState('active')
      console.log('🎤 Demo voice call started')
      return
    }

    // Real VAPI code would go here when you have payment method added
    setError('Voice calls require VAPI account with payment method')
    setCallState('idle')
  }

  const endCall = () => {
    setCallState('ended')
    console.log('✅ Call ended')
    setTimeout(() => setCallState('idle'), 2000)
  }

  const toggleMute = () => {
    setMuted(m => !m)
  }

  // ─── Compact version (navbar) ──────────────────────────────────────
  if (compact) {
    return (
      <div className="flex flex-col items-center">
        <button
          onClick={callState === 'active' ? endCall : startCall}
          disabled={callState === 'connecting' || callState === 'ended'}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            callState === 'active'
              ? 'bg-red-500 text-white hover:bg-red-600'
              : callState === 'connecting'
              ? 'bg-gray-200 text-gray-500 cursor-wait'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
          }`}>
          {callState === 'connecting' ? <Loader size={14} className="animate-spin" /> :
           callState === 'active' ? <PhoneOff size={14} /> :
           <Phone size={14} />}
          {callState === 'connecting' ? 'Connecting...' :
           callState === 'active' ? 'End Call' :
           callState === 'ended' ? 'Call Ended' :
           'Voice Agent'}
        </button>
        {error && <p className="text-red-200 text-xs mt-1 text-center max-w-32">{error}</p>}
      </div>
    )
  }

  // ─── Full card version ─────────────────────────────────────────────
  return (
    <div className="bg-[#0B1F4B] rounded-2xl p-5 text-white shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <Phone size={18} className="text-[#FF6B00]" />
        <p className="font-semibold">Talk to SaarthiAI</p>
      </div>
      <p className="text-blue-200 text-xs mb-4">AI voice advisor — available 24/7 in Hindi & English</p>

      {callState === 'idle' && (
        <button onClick={startCall}
          className="w-full bg-[#FF6B00] text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition flex items-center justify-center gap-2 shadow-md">
          <Phone size={16} /> Start Voice Call
        </button>
      )}

      {callState === 'connecting' && (
        <div className="text-center py-4">
          <Loader size={28} className="animate-spin mx-auto mb-3 text-[#FF6B00]" />
          <p className="text-sm text-blue-200">Connecting to SaarthiAI...</p>
          <p className="text-xs text-blue-300 mt-1">Establishing voice channel</p>
        </div>
      )}

      {callState === 'active' && (
        <div className="space-y-3">
          {/* Waveform animation */}
          <div className="flex items-center justify-center gap-2 py-3 bg-green-900/30 rounded-xl">
            <div className="flex gap-1">
              {[0, 100, 200, 150, 250].map((delay, i) => (
                <div key={i}
                  className="w-1 bg-green-400 rounded-full animate-bounce"
                  style={{ 
                    height: `${12 + (i % 3) * 4}px`,
                    animationDelay: `${delay}ms`,
                    animationDuration: '800ms'
                  }} />
              ))}
            </div>
            <span className="text-green-300 text-sm font-medium ml-2">
              {muted ? 'Muted' : 'Speaking...'}
            </span>
          </div>

          {/* Simulated conversation hints */}
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-blue-200 mb-1">💬 Sample conversation:</p>
            <p className="text-xs text-white/60 italic">
              "Namaste! Aapka naam kya hai aur aap kaunse insurance mein interested hain?"
            </p>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button onClick={toggleMute}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition ${
                muted ? 'bg-red-500/20 text-red-300 border border-red-400' : 'bg-white/10 text-white hover:bg-white/20'
              }`}>
              {muted ? <MicOff size={14} /> : <Mic size={14} />}
              {muted ? 'Unmute' : 'Mute'}
            </button>
            <button onClick={endCall}
              className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition flex items-center justify-center gap-2 shadow-md">
              <PhoneOff size={14} /> End Call
            </button>
          </div>
        </div>
      )}

      {callState === 'ended' && (
        <div className="text-center py-4 bg-green-900/20 rounded-xl">
          <p className="text-green-300 text-sm font-medium">✅ Call ended</p>
          <p className="text-blue-200 text-xs mt-1">Thank you for using SaarthiAI!</p>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-xl">
          <p className="text-red-300 text-xs text-center">{error}</p>
        </div>
      )}

      {DEMO_MODE && callState === 'idle' && (
        <p className="text-yellow-300/60 text-[10px] text-center mt-2">
          Demo mode active
        </p>
      )}
    </div>
  )
}