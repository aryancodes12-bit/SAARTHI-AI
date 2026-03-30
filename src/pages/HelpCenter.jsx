import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronDown, ArrowLeft, Mail,
  MessageSquare, Phone, Shield, ExternalLink,
  X, HelpCircle, FileText, UserCircle, Lock, Mic
} from 'lucide-react'
import { GlowingShadow } from '../components/ui/GlowingShadow'

const FAQ_DATA = [
  {
    category: 'Claims',
    icon: <FileText size={18} />,
    questions: [
      {
        q: "How do I file a claim on SaarthiAI?",
        a: "Go to Claims Tracker → File New Claim. Fill in policy type, incident date, amount and upload supporting documents. Our team reviews within 3-5 business days."
      },
      {
        q: "What documents are needed for a health claim?",
        a: "Hospital discharge summary, bills, prescriptions, and your policy number. Upload these in the Claims Tracker under Supporting Documents."
      }
    ]
  },
  {
    category: 'Policy',
    icon: <Shield size={18} />,
    questions: [
      {
        q: "Does SaarthiAI sell insurance directly?",
        a: "No. SaarthiAI is an AI-powered advisory platform. We help you compare, understand, and choose the best insurance — the actual policy is issued by IRDAI-licensed insurers."
      },
      {
        q: "How does AI recommendation work?",
        a: "Our AI detects life events from your conversations (marriage, new baby, etc.) and suggests relevant insurance products based on your profile, age, income, and dependents."
      }
    ]
  },
  {
    category: 'Account',
    icon: <UserCircle size={18} />,
    questions: [
      {
        q: "How do I update my profile?",
        a: "Go to Profile page from the sidebar. Update your age, occupation, income, and dependents for better recommendations."
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Go to Settings → Privacy → Request Account Deletion. We will process within 30 days as per DPDP Act 2023."
      }
    ]
  },
  {
    category: 'Privacy & DPDP',
    icon: <Lock size={18} />,
    questions: [
      {
        q: "What is DPDP Act 2023?",
        a: "Digital Personal Data Protection Act 2023 is India's data privacy law. SaarthiAI is fully compliant — we never sell your data and you can withdraw consent anytime."
      },
      {
        q: "What data does SaarthiAI collect?",
        a: "We collect your profile info (age, occupation, income), chat messages (PII-masked), and consent preferences. No Aadhaar or PAN stored without explicit consent."
      },
      {
        q: "How do I withdraw my consent?",
        a: "Go to Settings → Privacy → Manage Consent. You can withdraw marketing, analytics, or AI processing consent anytime."
      }
    ]
  },
  {
    category: 'Voice Agent',
    icon: <Mic size={18} />,
    questions: [
      {
        q: "What is the VAPI Voice Agent?",
        a: "SaarthiAI's voice advisor calls you to provide personalized insurance guidance in Hindi or English. Enable it in Settings → Voice Agent."
      },
      {
        q: "Is my voice call recorded?",
        a: "Calls are processed in real-time for advisory purposes only. No recordings are stored permanently. DPDP 2023 compliant."
      }
    ]
  }
]

export default function HelpCenter() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [openIndex, setOpenIndex] = useState(null)

  const categories = ['All', ...FAQ_DATA.map(d => d.category)]

  const filteredFAQs = useMemo(() => {
    let results = FAQ_DATA
    if (activeTab !== 'All') {
      results = results.filter(cat => cat.category === activeTab)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.map(cat => ({
        ...cat,
        questions: cat.questions.filter(f =>
          f.q.toLowerCase().includes(query) ||
          f.a.toLowerCase().includes(query)
        )
      })).filter(cat => cat.questions.length > 0)
    }
    return results
  }, [searchQuery, activeTab])

  return (
    <div className="min-h-screen bg-white">
      {/* ── STICKY NAVIGATION ── */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-[#0B1F4B] transition-colors text-sm font-bold tracking-tight"
          >
            <ArrowLeft size={18} /> BACK
          </button>
          <span className="text-[#0B1F4B] font-black tracking-tighter text-xl">
            Saarthi<span className="text-[#FF6B00]">AI</span> Help
          </span>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* ── HERO ── */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-[#0B1F4B] font-outfit mb-4">How can we help?</h1>
          <p className="text-gray-400 text-lg">Search our knowledge base or browse categories below.</p>
        </div>

        {/* ── SEARCH ── */}
        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
          <input
            type="text"
            placeholder="Search for assistance..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-14 pr-12 py-5 text-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:bg-white transition-all placeholder:text-gray-300"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF6B00]">
              <X size={20} />
            </button>
          )}
        </div>

        {/* ── CATEGORY FILTERS ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setActiveTab(cat)
                setOpenIndex(null)
              }}
              className={`
                px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all
                ${activeTab === cat
                  ? 'bg-[#0B1F4B] text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── FAQ LIST ── */}
        <div className="space-y-10">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-20">
              <HelpCircle className="mx-auto text-gray-100 mb-4" size={64} />
              <p className="text-gray-400 font-bold">No results found for "{searchQuery}"</p>
            </div>
          ) : (
            filteredFAQs.map((section, sIdx) => (
              <div key={section.category}>
                <h3 className="flex items-center gap-2 text-[#0B1F4B] font-black uppercase tracking-[0.2em] text-[10px] mb-6">
                  <span className="text-[#FF6B00]">{section.icon}</span>
                  {section.category}
                </h3>
                <div className="space-y-3">
                  {section.questions.map((faq, qIdx) => {
                    const id = `${sIdx}-${qIdx}`
                    const isOpen = openIndex === id
                    return (
                      <div key={id} className={`border rounded-2xl transition-all ${isOpen ? 'border-[#FF6B00]/30 bg-orange-50/10' : 'border-gray-100'}`}>
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : id)}
                          className="w-full text-left px-6 py-5 flex items-center justify-between group"
                        >
                          <span className={`font-bold text-sm ${isOpen ? 'text-[#0B1F4B]' : 'text-gray-600'}`}>
                            {faq.q}
                          </span>
                          <ChevronDown size={18} className={`text-gray-300 transition-transform ${isOpen ? 'rotate-180 text-[#FF6B00]' : ''}`} />
                        </button>
                        <div
                          className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}
                          style={{ maxHeight: isOpen ? '400px' : '0px' }}
                        >
                          <div className="px-6 pb-6 text-sm text-gray-500 leading-relaxed">
                            {faq.a}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── DPDP RIGHTS ── */}
        <div className="mt-16 flex justify-center">
          <GlowingShadow>
            <div className="p-10 text-white relative h-full">
              <h2 className="text-3xl font-black font-outfit mb-4">Your Privacy Matters.</h2>
              <p className="text-white/40 text-sm mb-8 max-w-md">We fully adhere to the Digital Personal Data Protection Act (DPDP) 2023 to ensure your insurance journey is secure.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 text-left">
                {['Right to Access', 'Right to Correction', 'Right to Erasure', 'Right to Grievance'].map(r => (
                  <div key={r} className="flex items-center gap-3 bg-white/5 px-5 py-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shadow-[0_0_8px_#FF6B00]"></div>
                    <span className="text-xs font-bold tracking-wide">{r}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/support')}
                className="w-full bg-white text-[#0B1F4B] font-black text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-[#FF6B00] hover:text-white transition-all shadow-xl active:scale-95"
              >
                CUSTOMER SUPPORT
              </button>
            </div>
          </GlowingShadow>
        </div>

        {/* ── CONTACT ── */}
        <div className="mt-20 border-t pt-16 flex flex-col items-center">
          <div className="flex gap-4 mb-8">
            <a href="mailto:support@saarthi-ai.com" className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-[#FF6B00] hover:bg-orange-50 transition-all"><Mail size={24} /></a>
            <button onClick={() => navigate('/chat')} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-[#FF6B00] hover:bg-orange-50 transition-all"><MessageSquare size={24} /></button>
            <button onClick={() => navigate('/chat')} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-[#FF6B00] hover:bg-orange-50 transition-all"><Phone size={24} /></button>
          </div>
          <p className="text-[#0B1F4B] font-black uppercase text-[10px] tracking-[0.3em] mb-4">Still have questions?</p>
          <button
            onClick={() => navigate('/chat')}
            className="text-[#FF6B00] font-black flex items-center gap-2 hover:gap-4 transition-all"
          >
            Chat with AI Advisor <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
