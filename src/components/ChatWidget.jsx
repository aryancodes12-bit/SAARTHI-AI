import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Loader, Shield, AlertTriangle, MessageCircle, X, Sparkles, Phone } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { chatWithClaude } from '../ai/claudeAgent'
import { processLifeEvents } from '../ai/lifeEventDetector'
import { saveChatMessage, getChatHistory } from '../firebase/firestore'
import { containsPII } from '../utils/piiMasker'

const QUICK_REPLIES = [
    "I'm getting married soon 💍",
    "I just had a baby 👶",
    "Buying a new home 🏠",
    "Show me health plans ❤️",
    "Planning retirement 🌅",
]

const WELCOME_MESSAGE = {
    id: 'welcome',
    role: 'assistant',
    content: "Namaste! 🙏 Main **SaarthiAI** hoon, aapka personal insurance advisor.\n\nAap mujhe apni life events ke baare mein bata sakte hain, ya insurance ke baare mein kuch bhi pooch sakte hain. Main Hindi aur English dono samajhta hoon!\n\n*Sabhi conversations private aur DPDP 2023 compliant hain.* 🛡️",
    timestamp: new Date(),
}

export default function ChatWidget() {
    const navigate = useNavigate()
    const { user, userProfile } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([WELCOME_MESSAGE])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [lifeEventAlert, setLifeEventAlert] = useState(null)
    const [piiWarning, setPiiWarning] = useState(false)
    const [showVoiceCard, setShowVoiceCard] = useState(true)
    const bottomRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        if (user && isOpen) {
            loadHistory()
        }
    }, [user, isOpen])

    useEffect(() => {
        if (isOpen) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isOpen])

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    const loadHistory = async () => {
        if (!user) return
        try {
            const history = await getChatHistory(user.uid, 20)
            if (history.length > 0) {
                setMessages([WELCOME_MESSAGE, ...history.map(h => ({
                    ...h,
                    timestamp: h.timestamp?.toDate?.() || new Date(),
                }))])
            }
        } catch (err) {
            console.error('Chat history load error:', err)
        }
    }

    const sendMessage = async (text = input.trim()) => {
        if (!text || loading) return

        if (containsPII(text)) {
            setPiiWarning(true)
            setTimeout(() => setPiiWarning(false), 4000)
        }

        const userMsg = {
            id: Date.now().toString(),
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
            if (user) {
                processLifeEvents(user.uid, text).then(({ events, products }) => {
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
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.success ? result.text : "Sorry, I had trouble processing that. Kya aap dobara try kar sakte hain?",
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
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Kshama kijiye, kuch technical issue aa gaya. Please try again.',
                timestamp: new Date(),
            }])
        } finally {
            setLoading(false)
            inputRef.current?.focus()
        }
    }

    const formatMessage = (text) => {
        // First convert markdown links [text](url) → clickable anchor tags
        let formatted = text.replace(
            /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#FF6B00;text-decoration:underline;font-weight:600;cursor:pointer;">$1 ↗</a>'
        )
        // Then handle bold, italic, newlines
        formatted = formatted
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br/>')
        return formatted
    }

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-gradient-to-r from-[#FF6B00] to-orange-600 text-white p-4 rounded-full shadow-2xl hover:shadow-orange-500/50 hover:scale-110 transition-all z-50 animate-bounce [animation-duration:2s]"
                    aria-label="Open SaarthiAI Chat"
                >
                    <MessageCircle size={28} />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[380px] h-[650px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden animate-slideUp">
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#0B1F4B] to-[#1a3468] px-4 py-4 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B00] to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                                <Shield size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm flex items-center gap-1">
                                    SaarthiAI Assistant
                                    <Sparkles size={12} className="text-yellow-400" />
                                </p>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <p className="text-green-300 text-xs font-medium">Online — AI Advisor</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
                            aria-label="Close chat"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* PII Warning */}
                    {piiWarning && (
                        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2 text-amber-700 text-xs animate-slideDown">
                            <AlertTriangle size={14} className="flex-shrink-0" />
                            <span className="flex-1">Personal info detected & masked for your privacy (DPDP 2023) 🛡️</span>
                        </div>
                    )}

                    {/* Life Event Alert */}
                    {lifeEventAlert && (
                        <div className="bg-gradient-to-r from-[#0B1F4B] to-[#1a3468] px-4 py-3 mx-3 mt-3 rounded-xl shadow-md animate-slideDown">
                            <p className="text-white text-xs font-semibold mb-1 flex items-center gap-1">
                                🎯 Life event detected: {lifeEventAlert.events.map(e => e.label).join(', ')}
                            </p>
                            <p className="text-blue-200 text-xs">
                                Suggested: {lifeEventAlert.products.join(' • ')}
                            </p>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 bg-gradient-to-br from-[#0B1F4B] to-[#1a3468] rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0 shadow-md">
                                        <Shield size={14} className="text-[#FF6B00]" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-gradient-to-r from-[#0B1F4B] to-[#1a3468] text-white rounded-tr-sm shadow-md'
                                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                                    }`}>
                                    <p className="text-sm leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                                    {msg.biasWarning && (
                                        <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 flex items-center gap-1">
                                            <AlertTriangle size={10} />
                                            Fairness check applied
                                        </div>
                                    )}
                                    <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {msg.timestamp?.toLocaleTimeString?.('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {loading && (
                            <div className="flex justify-start animate-fadeIn">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#0B1F4B] to-[#1a3468] rounded-full flex items-center justify-center mr-2 shadow-md">
                                    <Shield size={14} className="text-[#FF6B00]" />
                                </div>
                                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
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

                    {/* Voice Call Card */}
                    {messages.length > 3 && showVoiceCard && (
                        <div className="px-3 pb-2 pt-2">
                            <div className="bg-gradient-to-r from-[#0B1F4B] to-[#1a3468] rounded-lg px-3 py-2 shadow-md flex items-center gap-3">
                                <div className="w-7 h-7 bg-[#FF6B00] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Phone size={13} className="text-white" />
                                </div>
                                <button
                                    className="flex-1 text-left"
                                    onClick={() => { setIsOpen(false); navigate('/chat') }}
                                >
                                    <p className="text-white font-semibold text-xs">Prefer talking?</p>
                                    <p className="text-blue-200 text-[10px]">Switch to voice call with SaarthiAI</p>
                                </button>
                                <button
                                    onClick={() => setShowVoiceCard(false)}
                                    className="text-white/40 hover:text-white/80 transition"
                                    aria-label="Dismiss"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quick Replies */}
                    {messages.length <= 2 && !loading && (
                        <div className="px-4 pb-3 flex gap-2 flex-wrap border-t border-gray-100 pt-3">
                            <p className="text-xs text-gray-400 w-full mb-1">Quick start:</p>
                            {QUICK_REPLIES.map(qr => (
                                <button key={qr} onClick={() => sendMessage(qr.replace(/[💍👶🏠❤️🌅]/g, '').trim())}
                                    className="text-xs bg-gradient-to-r from-gray-50 to-white border border-gray-200 text-gray-600 px-3 py-2 rounded-full hover:border-[#FF6B00] hover:text-[#FF6B00] hover:shadow-md transition-all">
                                    {qr}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="border-t border-gray-200 px-4 py-3 bg-white">
                        <div className="flex gap-2 items-end">
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 flex items-center gap-2 focus-within:border-[#FF6B00] transition">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent text-sm focus:outline-none text-gray-800 placeholder-gray-400"
                                />
                            </div>
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || loading}
                                className="w-11 h-11 bg-gradient-to-r from-[#FF6B00] to-orange-600 rounded-full flex items-center justify-center hover:shadow-lg hover:scale-110 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                            >
                                {loading ? (
                                    <Loader size={18} className="text-white animate-spin" />
                                ) : (
                                    <Send size={18} className="text-white" />
                                )}
                            </button>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
                            <Shield size={10} className="text-green-500" />
                            PII-masked • DPDP 2023 • Bias-free
                        </p>
                    </div>
                </div>
            )}
        </>
    )
}