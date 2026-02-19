import ChatWidget from '../components/ChatWidget'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, MessageCircle, Phone, Bell, Settings, Star,
  ChevronRight, Zap, TrendingUp, LogOut, RefreshCw, HelpCircle
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBehaviorTracker } from '../hooks/useBehaviorTracker'
import { logOut } from '../firebase/auth'
import { getUserLifeEvents, getRecommendations } from '../firebase/firestore'
import { getAIRecommendations } from '../ai/recommendationEngine'
import VoiceCallButton from '../components/VoiceCallButton'


// ----- REAL PRODUCT DATA (from your table) -----
const PRODUCTS = [
  // Term Life
  { name: 'SecureTerm 30', type: 'Term Life', url: 'https://www.canarahsbclife.com/term-insurance/30-year-term-insurance-plan', icon: '🛡️', urgency: 'high', reason: 'Ideal for covering your family for 30 years at low cost.' },
  { name: 'Family Shield Term 20', type: 'Term Life', url: 'https://www.bajajallianzlife.com/term-insurance/iprotect-smart-term-plan.jsp', icon: '🛡️', urgency: 'medium', reason: 'Smart term plan with return of premium option.' },
  { name: 'IncomeSecure Term', type: 'Term Life', url: 'https://www.posb.com.sg/personal/insurance/endowment/income-stream-plans/manulife-incomesecure', icon: '🛡️', urgency: 'medium', reason: 'Regular income for your family in your absence.' },
  { name: 'Mortgage Protection Plan', type: 'Term Life', url: 'https://www.hsbc.com.hk/insurance/products/life/mortgage-protection/', icon: '🛡️', urgency: 'low', reason: 'Protect your mortgage repayments.' },

  // Health
  { name: 'HealthGuard Comprehensive', type: 'Health', url: 'https://www.religarehealthinsurance.com/health-insurance-plans/health-advantedge', icon: '❤️', urgency: 'high', reason: 'Comprehensive cover with wellness benefits.' },
  { name: 'WellnessPrime Health Plan', type: 'Health', url: 'https://play.google.com/store/apps/details?id=com.wealthassure.wealthassureapp', icon: '❤️', urgency: 'medium', reason: 'Digital-first health plan with telemedicine.' },
  { name: 'Critical Illness Cover', type: 'Health', url: 'https://www.axismaxlife.com/term-insurance-plans/critical-illness', icon: '❤️', urgency: 'high', reason: 'Lump sum on diagnosis of 35 critical illnesses.' },
  { name: 'Senior Citizen Health Plan', type: 'Health', url: 'https://www.hdfclife.com/health-insurance-plans/health-insurance-for-senior-citizens', icon: '❤️', urgency: 'medium', reason: 'Tailored for parents and seniors.' },
  { name: 'Maternity & Newborn Plan', type: 'Health', url: 'https://www.nivaanlife.com/health-insurance/maternity-cover', icon: '❤️', urgency: 'medium', reason: 'Covers delivery and newborn expenses.' },
  { name: 'TopUp Mediclaim', type: 'Health', url: 'https://www.adityabirlahealth.com/healthinsurance/super-health-topup', icon: '❤️', urgency: 'low', reason: 'Super top-up for high medical bills.' },

  // Home
  { name: 'HomeSafe Standard Cover', type: 'Home', url: 'https://www.hdfcergo.com/home-insurance/home-insurance-policy', icon: '🏠', urgency: 'high', reason: 'Basic coverage for structure and contents.' },
  { name: 'HomeShield Premium', type: 'Home', url: 'https://www.tp-link.com/us/homeshield/', icon: '🏠', urgency: 'low', reason: 'Premium protection with gadget cover.' },
  { name: 'Tenant Insurance', type: 'Home', url: 'https://www.thepersonal.com/insurance/home-insurance/coverage/tenant.html', icon: '🏠', urgency: 'medium', reason: 'Ideal for renters.' },
  { name: 'Landlord Shield', type: 'Home', url: 'https://www.sbi-general.in/landlord-insurance', icon: '🏠', urgency: 'medium', reason: 'Cover for rental income and property damage.' },

  // Motor
  { name: 'DriveEasy Motor Protect', type: 'Motor', url: 'https://www.bharti-axagi.co.in/motor-insurance', icon: '🚗', urgency: 'high', reason: 'Comprehensive car insurance with add-ons.' },
  { name: 'RoadGuard Comprehensive', type: 'Motor', url: 'https://www.tataaig.com/motor-insurance/car-insurance', icon: '🚗', urgency: 'high', reason: 'Zero depreciation and roadside assistance.' },
  { name: 'Two Wheeler Insurance', type: 'Motor', url: 'https://www.bajajallianz.com/two-wheeler-insurance.html', icon: '🚗', urgency: 'medium', reason: 'Cover for bikes and scooters.' },
  { name: 'Fleet Insurance', type: 'Motor', url: 'https://www.icicilombard.com/business-insurance/fleet', icon: '🚗', urgency: 'low', reason: 'For businesses with multiple vehicles.' },

  // Child
  { name: 'BrightFuture Child ULIP', type: 'Child', url: 'https://lifeinsurance.pnbmetlife.com/child-insurance-plans/youngstar-unit-linked-plan', icon: '🎓', urgency: 'high', reason: "Market-linked plan for child's education." },
  { name: 'EduGrow Child ULIP Plus', type: 'Child', url: 'https://www.tataaia.com/life-insurance-plans/child-plans/future-child-plan.html', icon: '🎓', urgency: 'high', reason: 'Build corpus for higher studies.' },

  // Retirement
  { name: 'RetireSmart Deferred Annuity', type: 'Retire', url: 'https://www.iciciprulife.com/retirement-plans/immediate-deferred-annuity-plan.html', icon: '🌅', urgency: 'medium', reason: 'Immediate or deferred annuity options.' },
  { name: 'GoldenNest Retirement Plan', type: 'Retire', url: 'https://www.sbilife.co.in/en/pension-plans/golden-years-pension-plan', icon: '🌅', urgency: 'high', reason: 'Guaranteed pension for golden years.' },
  { name: 'FutureIncome Retirement Plus', type: 'Retire', url: 'https://www.exideinsurance.com/exide-life-future-income-plan', icon: '🌅', urgency: 'medium', reason: 'Regular income post retirement.' },
  { name: 'Pension Plus', type: 'Retire', url: 'https://www.maxlifeinsurance.com/pension-plans/pension-plus-plan', icon: '🌅', urgency: 'medium', reason: 'Flexible pension with lump sum.' },
  { name: 'Annuity Guarantee', type: 'Retire', url: 'https://www.canarahsbclife.com/retirement-plans/guaranteed-annuity-plan', icon: '🌅', urgency: 'low', reason: 'Guaranteed annuity for life.' },
  { name: 'NPS Turbo', type: 'Retire', url: 'https://www.hdfclife.com/retirement-plans/nps-pension-plan', icon: '🌅', urgency: 'low', reason: 'National Pension Scheme with tax benefits.' },
]

const QUICK_LINKS = [
  { icon: '🛡️', label: 'Term Life', color: 'bg-blue-50 text-blue-700', url: 'https://www.canarahsbclife.com/term-insurance/30-year-term-insurance-plan' },
  { icon: '❤️', label: 'Health', color: 'bg-red-50 text-red-700', url: 'https://www.religarehealthinsurance.com/health-insurance-plans/health-advantedge' },
  { icon: '🏠', label: 'Home', color: 'bg-green-50 text-green-700', url: 'https://www.hdfcergo.com/home-insurance/home-insurance-policy' },
  { icon: '🚗', label: 'Motor', color: 'bg-orange-50 text-orange-700', url: 'https://www.bharti-axagi.co.in/motor-insurance' },
  { icon: '🎓', label: 'Child', color: 'bg-purple-50 text-purple-700', url: 'https://lifeinsurance.pnbmetlife.com/child-insurance-plans/youngstar-unit-linked-plan' },
  { icon: '🌅', label: 'Retire', color: 'bg-yellow-50 text-yellow-700', url: 'https://www.iciciprulife.com/retirement-plans/immediate-deferred-annuity-plan.html' },
]

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const { trackPageView, trackProductView, trackTimeOnPage, getBehaviorData } = useBehaviorTracker()

  const [lifeEvents, setLifeEvents] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [displayedRecs, setDisplayedRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [intentScore, setIntentScore] = useState(0)
  const [refreshSeed, setRefreshSeed] = useState(0)
  const [showNotif, setShowNotif] = useState(false)

  useEffect(() => {
    trackPageView('/dashboard')
    loadDashboardData()
    return () => {
      trackTimeOnPage('/dashboard')
    }
  }, [user])

  useEffect(() => {
    if (recommendations.length > 0) {
      updateDisplayedRecs()
    }
  }, [recommendations, refreshSeed])

  const loadDashboardData = async () => {
    if (!user || !userProfile) return
    setLoading(true)
    try {
      const [events] = await Promise.all([
        getUserLifeEvents(user.uid),
      ])
      const uniqueEvents = events.filter((e, idx, arr) => arr.findIndex(x => x.type === e.type) === idx)
      setLifeEvents(uniqueEvents)

      let scored = PRODUCTS.map(p => {
        let score = 0
        if (events.some(e => e.label.toLowerCase().includes(p.type.toLowerCase()))) {
          score += 20
        }
        const behavior = getBehaviorData()
        if (behavior?.productInterests?.[p.type]) {
          score += 15
        }
        score += Math.random() * 30
        return { ...p, score }
      })
      scored.sort((a, b) => b.score - a.score)
      const topRecs = scored.slice(0, 6)
      setRecommendations(topRecs)

      const behavior = getBehaviorData()
      const rawScore = Math.min(
        (behavior?.pageViews?.['/dashboard'] || 0) * 10 +
        Object.values(behavior?.productInterests || {}).flat().length * 8,
        100
      )
      const scaledScore = Math.floor(20 + (rawScore / 100) * 70)
      setIntentScore(scaledScore)
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateDisplayedRecs = () => {
    if (recommendations.length === 0) return
    if (displayedRecs.length === 0) {
      setDisplayedRecs(recommendations.slice(0, 3))
      return
    }
    const currentIds = displayedRecs.map(r => r.name)
    const available = recommendations.filter(r => !currentIds.includes(r.name))
    if (available.length === 0) {
      const shuffled = [...displayedRecs].sort(() => Math.random() - 0.5)
      setDisplayedRecs(shuffled)
      return
    }
    const replaceIndex = Math.floor(Math.random() * 3)
    const newProduct = available[Math.floor(Math.random() * available.length)]
    const newDisplay = [...displayedRecs]
    newDisplay[replaceIndex] = newProduct
    setDisplayedRecs(newDisplay)
  }

  const handleSignOut = async () => {
    await logOut()
    navigate('/')
  }

  const handleQuickLinkClick = (link) => {
    trackProductView(link.label, link.label)
    window.open(link.url, '_blank')
  }

  const handleRefreshRecommendations = () => {
    setRefreshSeed(prev => prev + 1)
  }

  const handleRecommendationClick = (product) => {
    trackProductView(product.name, product.type)
    window.open(product.url, '_blank')
  }

  const firstName = userProfile?.displayName?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Top Nav */}
      <nav className="bg-[#0B1F4B] px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-2">
          <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" alt="logo" className="w-8 h-8 animate-pulse" />
          <span className="text-white font-bold text-lg">Saarthi<span className="text-[#FF6B00]">AI</span></span>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotif(v => !v)}
              className="relative text-white/70 hover:text-white transition-transform hover:scale-110"
            >
              <Bell size={20} />
              {(lifeEvents.length > 0 || displayedRecs.length > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6B00] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  {lifeEvents.length + displayedRecs.length > 9 ? '9+' : lifeEvents.length + displayedRecs.length}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showNotif && (
              <div className="absolute right-0 top-9 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-slideDown">
                <div className="bg-[#0B1F4B] px-4 py-3 flex items-center justify-between">
                  <p className="text-white font-bold text-sm">Notifications</p>
                  <button onClick={() => setShowNotif(false)} className="text-white/50 hover:text-white text-xs">✕</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {lifeEvents.length > 0 && (
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">🎯 Detected Life Events</p>
                      {lifeEvents.map((e, i) => (
                        <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                          <span className="text-base">{e.label?.split(' ')[0]}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{e.label}</p>
                            <p className="text-xs text-gray-400">{e.detectedAt ? new Date(e.detectedAt).toLocaleDateString('en-IN') : 'Recently detected'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {displayedRecs.length > 0 && (
                    <div className="px-4 pt-3 pb-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">⚡ AI Recommendations</p>
                      {displayedRecs.map((r, i) => (
                        <div key={i}
                          className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-1 transition"
                          onClick={() => { window.open(r.url, '_blank'); setShowNotif(false) }}
                        >
                          <span className="text-base">{r.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                            <p className="text-xs text-gray-400">{r.type}</p>
                          </div>
                          <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                  {lifeEvents.length === 0 && displayedRecs.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-400 text-sm">
                      No notifications yet
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-100 px-4 py-2">
                  <button onClick={() => { navigate('/chat'); setShowNotif(false) }}
                    className="w-full text-xs text-[#FF6B00] font-semibold hover:underline text-center py-1">
                    Chat with AI for personalized advice →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ✅ Support Button */}
          <button
            onClick={() => navigate('/support')}
            className="text-white/50 hover:text-white transition-transform hover:scale-110"
            title="Support"
          >
            <HelpCircle size={18} />
          </button>

          <button onClick={handleSignOut} className="text-white/50 hover:text-white transition-transform hover:scale-110"><LogOut size={18} /></button>
          <div className="w-8 h-8 bg-[#FF6B00] rounded-full flex items-center justify-center text-white font-bold text-sm animate-bounce [animation-duration:2s]">{firstName[0]?.toUpperCase()}</div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-[#0B1F4B] to-[#1a3468] rounded-2xl p-6 text-white shadow-xl animate-fadeIn">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-200 text-sm">Good day,</p>
              <h1 className="text-2xl font-bold">{firstName} 👋</h1>
              <p className="text-blue-200 text-sm mt-1">Your AI advisor is ready</p>
            </div>
            <div className="text-right">
              <div className="bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm">
                <p className="text-xs text-blue-200">Intent Score</p>
                <p className="text-2xl font-bold text-[#FF6B00]">{intentScore}</p>
                <p className="text-xs text-blue-200">/ 100</p>
              </div>
            </div>
          </div>

          {lifeEvents.length > 0 && (
            <div className="mt-4 flex gap-2 flex-wrap animate-slideUp">
              <p className="text-xs text-blue-200 w-full">🎯 Detected life events:</p>
              {lifeEvents.map((e, i) => (
                <span key={i} className="bg-[#FF6B00] text-white text-xs px-2 py-1 rounded-full shadow-md">{e.label}</span>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <button onClick={() => navigate('/chat')} className="w-full bg-[#FF6B00] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 transition-all hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2">
              <MessageCircle size={16} /> Chat with AI
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Quick Browse</h2>
          <div className="grid grid-cols-6 gap-2">
            {QUICK_LINKS.map(link => (
              <button
                key={link.label}
                onClick={() => handleQuickLinkClick(link)}
                className={`${link.color} rounded-xl p-3 text-center transition-all hover:scale-110 hover:shadow-md active:scale-95`}
              >
                <div className="text-xl mb-1">{link.icon}</div>
                <p className="text-xs font-medium">{link.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[#FF6B00]" />
              <h2 className="text-sm font-semibold text-gray-800">AI Recommendations For You</h2>
            </div>
            <button onClick={handleRefreshRecommendations} className="text-gray-400 hover:text-[#0B1F4B] transition-transform hover:rotate-180 duration-500">
              <RefreshCw size={14} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : displayedRecs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {displayedRecs.slice(0, 3).map((rec, i) => (
                <div
                  key={rec.name + i}
                  className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleRecommendationClick(rec)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{rec.icon}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rec.urgency === 'high' ? 'bg-red-100 text-red-600' :
                      rec.urgency === 'medium' ? 'bg-orange-100 text-orange-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                      {rec.urgency === 'high' ? 'Hot Pick' : rec.urgency === 'medium' ? 'Recommended' : 'You May Like'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">{rec.name}</h3>
                  <p className="text-gray-400 text-xs mb-2">{rec.type}</p>
                  {rec.reason && <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{rec.reason}</p>}
                  <div className="flex items-center gap-1 mt-3 text-[#FF6B00]">
                    <Star size={10} fill="currentColor" />
                    <span className="text-xs font-medium">AI Selected</span>
                    <ChevronRight size={12} className="ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 text-center border border-dashed border-gray-200 animate-pulse">
              <p className="text-gray-400 text-sm">Chat with SaarthiAI to get personalized recommendations</p>
              <button onClick={() => navigate('/chat')} className="mt-3 bg-[#0B1F4B] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-all hover:scale-105">
                Start Chatting
              </button>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: TrendingUp, label: 'Policies Viewed', value: Object.keys(getBehaviorData()?.productInterests || {}).length, color: 'text-blue-600' },
            { icon: MessageCircle, label: 'AI Chats', value: getBehaviorData()?.chatSessions || '—', color: 'text-green-600' },
            { icon: Star, label: 'Saved Plans', value: userProfile?.savedPlans?.length || '—', color: 'text-orange-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100 text-center hover:shadow-md transition-all hover:-translate-y-1">
              <stat.icon size={20} className={`${stat.color} mx-auto mb-1`} />
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-gray-400 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}