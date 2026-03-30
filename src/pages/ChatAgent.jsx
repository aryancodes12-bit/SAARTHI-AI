import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Send, Loader, Shield, AlertTriangle, Mic, Sparkles, Phone } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { chatWithClaude } from '../ai/claudeAgent'
import { processLifeEvents } from '../ai/lifeEventDetector'
import { saveChatMessage, getChatHistory } from '../firebase/firestore'
import { containsPII } from '../utils/piiMasker'
import VoiceCallButton from '../components/VoiceCallButton'

const QUICK_REPLIES = [
  "Main shaadi karne wala hoon 💍",
  "Mere baby hua hai 👶",
  "Main naya ghar kharid raha hoon 🏠",
  "Health insurance dikhao ❤️",
  "Retirement planning chahiye 🌅",
]

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: "Namaste! 🙏 Main **SaarthiAI** hoon, aapka personal insurance advisor.\n\nAap mujhe apni life events ke baare mein bata sakte hain ya insurance ke baare mein kuch bhi pooch sakte hain. Main Hindi aur English dono samajhta hoon!\n\n*Sabhi conversations private aur DPDP 2023 compliant hain.* 🛡️",
  timestamp: new Date(),
}

export default function ChatAgent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, userProfile } = useAuth()
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const hasAutoPrompted = useRef(false)

  // Handle Calculator Redirect Auto-prompt
  useEffect(() => {
    if (location.state?.source === 'calculator' && !hasAutoPrompted.current && user) {
      hasAutoPrompted.current = true
      const { planName, insurer, sumAssuredDisplay, premium } = location.state
      const autoMessage = `I want to know more about the **${planName}** plan from **${insurer}**. The quote shows a cover of **${sumAssuredDisplay}** for an annual premium of ₹${Math.round(premium).toLocaleString('en-IN')}. Is this a good choice for me?`
      
      // Small delay to ensure UI is ready
      setTimeout(() => {
        sendMessage(autoMessage)
      }, 1500)
    }

    // Handle Notification Redirect Auto-prompt
    if (location.state?.source === 'notification' && !hasAutoPrompted.current && user) {
      hasAutoPrompted.current = true
      const { eventType, eventLabel } = location.state
      
      let eventMsg = ""
      const type = eventType.toLowerCase()
      
      if (type === 'marriage') {
        eventMsg = "I recently got **Married**! 💍 I want to update my insurance coverage to include my spouse. What are the best family floater or joint term plans you recommend?"
      } else if (type === 'baby') {
        eventMsg = "We just welcomed a **New Baby** to the family! 👶 I'm looking for a child education plan or a way to increase my current life cover to secure my child's future."
      } else if (type === 'home' || type === 'home_purchase') {
        eventMsg = "I just bought a **New Home**! 🏠 I need to protect my investment with home insurance. Can you suggest plans for fire, theft, and natural disasters?"
      } else if (type === 'car' || type === 'car_purchase') {
        eventMsg = "I've purchased a **New Car**! 🚗 I'm looking for comprehensive motor insurance with zero depreciation and roadside assistance."
      } else {
        eventMsg = `I have a new life event: **${eventLabel || eventType}**. How should I update my insurance portfolio for this?`
      }

      setTimeout(() => {
        sendMessage(eventMsg)
      }, 1500)
    }
  }, [location.state, user])
  const [loading, setLoading] = useState(false)
  const [lifeEventAlert, setLifeEventAlert] = useState(null)
  const [piiWarning, setPiiWarning] = useState(false)
  const [showVoicePanel, setShowVoicePanel] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const historyLoaded = useRef(false)

  useEffect(() => {
    if (user && !historyLoaded.current) {
      historyLoaded.current = true
      loadHistory()
    }
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const loadHistory = async () => {
    if (!user) return
    
    try {
      const history = await getChatHistory(user.uid, 50)
      
      if (history.length === 0) return
      
      // Ensure unique IDs
      const processedMessages = history.map((msg, idx) => ({
        id: msg.id || `hist-${idx}-${Date.now()}`,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp?.toDate?.() || new Date()
      }))
      
      setMessages([WELCOME_MESSAGE, ...processedMessages])
      
    } catch (err) {
      console.error('Chat history load error:', err)
    }
  }

  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return

    // PII check
    if (containsPII(text)) {
      setPiiWarning(true)
      setTimeout(() => setPiiWarning(false), 4000)
    }

    const userMsg = { 
      id: `msg-${Date.now()}`, 
      role: 'user', 
      content: text, 
      timestamp: new Date() 
    }
    
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    if (user) {
      saveChatMessage(user.uid, { role: 'user', content: text })
    }

    try {
      // Life event detection
      if (user) {
        processLifeEvents(user.uid, text, { email: user.email, displayName: userProfile?.displayName }).then(({ events, products }) => {
          if (events.length > 0) {
            setLifeEventAlert({ events, products })
            setTimeout(() => setLifeEventAlert(null), 8000)
          }
        })
      }

      const userContext = {
        name: userProfile?.displayName?.split(' ')[0] || 'Customer',
        ageGroup: userProfile?.ageGroup || 'unknown',
        occupation: userProfile?.occupation || 'unknown',
        dependents: userProfile?.dependents || 'unknown',
        lifeEvents: userProfile?.lifeEvents?.map(e => e.label) || [],
      }

      const history = messages
        .filter(m => m.id !== 'welcome')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }))

      history.push({ role: 'user', content: text })

      const result = await chatWithClaude(history, userContext, user?.uid)

      const assistantMsg = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: result.success ? result.text : "Kshama kijiye, kuch technical issue aa gaya. Kya aap dobara try kar sakte hain?",
        timestamp: new Date(),
        biasWarning: result.biasWarning,
        requiresConsent: result.requiresConsent,
      }

      setMessages(prev => [...prev, assistantMsg])

      if (user) {
        saveChatMessage(user.uid, { role: 'assistant', content: assistantMsg.content })
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Apologies, technical issue ho gaya. Please try again.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const formatMessage = (text) => {
    // Convert markdown links [text](url) → clickable anchor tags
    let formatted = text.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#FF6B00;text-decoration:underline;font-weight:600;cursor:pointer;">$1 ↗</a>'
    )
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
    return formatted
  }

  const firstName = userProfile?.displayName?.split(' ')[0] || 'there'

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B1F4B] to-[#1a3468] px-4 py-4 flex items-center gap-3 shadow-xl">
        <button onClick={() => navigate('/dashboard')} className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-lg transition">
          <ArrowLeft size={20} />
        </button>
       <img
  src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png"
  alt="SaarthiAI Logo"
  className="w-9 h-9 object-contain"
/>
        <div className="flex-1">
          <p className="text-white font-bold text-sm flex items-center gap-1">
            SaarthiAI Assistant
            <Sparkles size={12} className="text-yellow-400" />
          </p>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-green-300 text-xs font-medium">AI Agent Active</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-blue-200 flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
            <Shield size={10} /> DPDP 2023
          </div>

        </div>
      </div>

      {/* PII Warning */}
      {piiWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2 text-amber-700 text-xs animate-slideDown">
          <AlertTriangle size={14} />
          Personal info detected & masked for your privacy (DPDP 2023) 🛡️
        </div>
      )}

      {/* Life Event Alert */}
      {lifeEventAlert && (
        <div className="bg-gradient-to-r from-[#0B1F4B] to-[#1a3468] px-4 py-3 mx-4 mt-3 rounded-xl shadow-md animate-slideDown">
          <p className="text-white text-xs font-semibold mb-1 flex items-center gap-1">
            🎯 Life event detected: {lifeEventAlert.events.map(e => e.label).join(', ')}
          </p>
          <p className="text-blue-200 text-xs">
            Suggested: {lifeEventAlert.products.join(' • ')}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            {msg.role === 'assistant' && (
              <div className="w-9 h-9 bg-gradient-to-br from-[#0B1F4B] to-[#1a3468] rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0 shadow-md">
                <Shield size={14} className="text-[#FF6B00]" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-[#0B1F4B] to-[#1a3468] text-white rounded-tr-sm shadow-lg'
                : 'bg-white text-gray-800 shadow-md border border-gray-100 rounded-tl-sm'
            }`}>
              <p className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
              {msg.biasWarning && (
                <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Fairness check applied
                </div>
              )}
              <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                {msg.timestamp?.toLocaleTimeString?.('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="w-9 h-9 bg-gradient-to-br from-[#0B1F4B] to-[#1a3468] rounded-full flex items-center justify-center mr-3 shadow-md">
              <Shield size={14} className="text-[#FF6B00]" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-3 shadow-md border border-gray-100">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#FF6B00] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#FF6B00] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#FF6B00] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Replies */}
      {messages.length === 1 && !loading && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap border-t border-gray-100 pt-3 bg-white">
          <p className="text-xs text-gray-400 w-full mb-1">Quick start:</p>
          {QUICK_REPLIES.map(qr => (
            <button key={qr} onClick={() => sendMessage(qr.replace(/[💍👶🏠❤️🌅]/g, '').trim())}
              className="text-xs bg-gradient-to-r from-gray-50 to-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full hover:border-[#FF6B00] hover:text-[#FF6B00] hover:shadow-md transition-all">
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Voice Panel — opens below navbar when phone icon clicked */}
      {showVoicePanel && (
        <div className="fixed top-16 right-4 z-50 w-72 animate-slideDown">
          <div className="relative">
            <button
              onClick={() => setShowVoicePanel(false)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs z-10"
            >✕</button>
            <VoiceCallButton userProfile={userProfile} />
          </div>
        </div>
      )}
      {/* Input Area */}
      <div className="bg-white border-t-2 border-gray-200 px-4 py-4 shadow-2xl">
        {/* Call Me button row */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowVoicePanel(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${showVoicePanel ? 'bg-[#FF6B00] text-white border-[#FF6B00]' : 'bg-white text-[#0B1F4B] border-[#0B1F4B] hover:bg-[#FF6B00] hover:text-white hover:border-[#FF6B00]'}`}
          >
            <Phone size={13} /> Call Me
          </button>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2 focus-within:border-[#FF6B00] transition-all">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type your message in Hindi or English..."
              className="flex-1 bg-transparent text-sm focus:outline-none text-gray-800 placeholder-gray-400"
            />
            <button className="text-gray-300 hover:text-[#FF6B00] transition">
              <Mic size={18} />
            </button>
          </div>
          <button 
            onClick={() => sendMessage()} 
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-gradient-to-r from-[#FF6B00] to-orange-600 rounded-full flex items-center justify-center hover:shadow-xl hover:scale-110 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
          >
            {loading ? (
              <Loader size={20} className="text-white animate-spin" />
            ) : (
              <Send size={20} className="text-white" />
            )}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
          <Shield size={11} className="text-green-500" />
          Messages are PII-masked • DPDP 2023 compliant • Bias-free
        </p>
      </div>
    </div>
  )
}