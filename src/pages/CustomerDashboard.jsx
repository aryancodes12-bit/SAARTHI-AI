// src/pages/CustomerDashboard.jsx
import ChatWidget from "../components/ChatWidget";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Shield, MessageCircle, Phone, Star, ChevronRight, Zap, TrendingUp, RefreshCw } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useBehaviorTracker } from "../hooks/useBehaviorTracker";
import { getUserLifeEvents, getAllPolicies } from "../firebase/firestore";
import { initEmailTriggers, useScrollAndTimeTrigger, trackProductViewAndEmail } from "../hooks/useEmailTriggers";
import { generateRecommendations } from "../ai/claudeAgent";
import { motion } from "framer-motion";


const TEXTBEE_API_KEY = "98583199-400b-4518-a203-30ef9632d6d0";
const TEXTBEE_DEVICE_ID = "69c58495c3538b609d2039fa";
const TEXTMEBOT_API_KEY = "puXy9N2m6Q26";
const ONESIGNAL_APP_ID = "085dddb7-507c-40ef-9ffd-107f87fb2d65";

const WHATSAPP_TEMPLATES = [
  `╔══════════════════════════════╗\n  🛡️  *SAARTHI AI — PROTECTION ALERT*\n╚══════════════════════════════╝\n\nNameste! 🙏\n\nOur AI ran a *full risk analysis* on your profile.\n\n🔴 Coverage Gap Detected\n📈 Term life premiums rising with age\n\n✅ *Term Life Plan* — ₹1 Crore from ₹490/month\n\n🔗 https://saarthi-ai-mu.vercel.app/\n\n_SaarthiAI — Built for Bharat_ 🇮🇳`,
  `📊 *YOUR FINANCIAL HEALTH SCORE*\n\n⚡ 3 critical gaps found\n💸 Medical inflation: *14% per year*\n🏥 1 hospitalisation = ₹5–15 Lakhs+\n\n🩺 Health Top-Up Plan ready.\n\n🔗 https://saarthi-ai-mu.vercel.app/\n\n_SaarthiAI — Your Family Deserves the Best_ ❤️`,
  `🚨 *EXCLUSIVE OPPORTUNITY DETECTED*\n\n📈 Coverage boost up to *40%*\n💰 No major change in monthly cost\n\n💼 Explore now:\n🔗 https://saarthi-ai-mu.vercel.app/\n\n_SaarthiAI — Smarter Decisions._ 🛡️`,
  `⏰ *COVERAGE REVIEW REMINDER*\n\n🏥 Medical inflation: *14% annually*\n🔢 80% of Indians are *underinsured*\n\n✅ Top 3 enhancement options waiting\n\n🔗 https://saarthi-ai-mu.vercel.app/\n\n_SaarthiAI — Always Protecting._ 👁️`,
  `🎉 *LIFE EVENT DETECTED BY AI*\n\n🏠 Home Loan Protection\n👨‍👩‍👧 Term Life\n❤️ Health Floater\n🎓 Child ULIP\n\n✅ Compare 50+ top Indian insurers\n\n🔗 https://saarthi-ai-mu.vercel.app/\n\n_SaarthiAI — Har Pal Saath._ 🙏`,
  `🌅 *RETIREMENT PLANNING ALERT*\n\n📉 Only 12% Indians have pension\n💸 Inflation erodes savings 6% p.a.\n\n🌟 NPS + Annuity plans ready for you.\n\n🔗 https://saarthi-ai-mu.vercel.app/\n\n_SaarthiAI — Aapka Kal Surakshit._ 🇮🇳`,
]

const SMS_TEMPLATES = [
  `SAARTHI AI ALERT: Coverage gap detected! Medical costs rising 14% p.a. Top-Up plan ready: https://saarthi-ai-mu.vercel.app/ Reply STOP`,
  `SAARTHI AI: Protection Score updated! 3 critical gaps found. View: https://saarthi-ai-mu.vercel.app/ Reply STOP`,
  `SAARTHI AI URGENT: Health cover shortfall! 1 hospitalisation = Rs5-15L. Plan ready: https://saarthi-ai-mu.vercel.app/ Reply STOP`,
  `SAARTHI AI: Smart Top-Up boosts protection 40%: https://saarthi-ai-mu.vercel.app/ Reply STOP`,
  `SAARTHI AI: Rs1Cr term cover from Rs490/mo. Free analysis: https://saarthi-ai-mu.vercel.app/ Reply STOP`,
  `SAARTHI AI: Medical inflation 14% pa. Coverage analysis ready: https://saarthi-ai-mu.vercel.app/ Reply STOP`,
]

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const { trackPageView, trackProductView, trackTimeOnPage, getBehaviorData } = useBehaviorTracker()

  useScrollAndTimeTrigger(user, userProfile)

  const notificationsSent = useRef(false)
  const [lifeEvents, setLifeEvents] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [displayedRecs, setDisplayedRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshSeed, setRefreshSeed] = useState(0)
  const [allPolicies, setAllPolicies] = useState([])
  const [dynamicQuickLinks, setDynamicQuickLinks] = useState([])

  const displayPhone = userProfile?.phoneNumber || userProfile?.mobileNumber || userProfile?.mobile || user?.phoneNumber || "Not Found"

  useEffect(() => {
    trackPageView("/dashboard")
    loadDashboardData()
    if (user && userProfile) initEmailTriggers(user, userProfile)
    return () => trackTimeOnPage("/dashboard")
  }, [user, userProfile])

  useEffect(() => { if (recommendations.length > 0) updateDisplayedRecs() }, [recommendations, refreshSeed])

  useEffect(() => {
    if (user && displayPhone !== "Not Found" && displayPhone.length > 9 && !notificationsSent.current) {
      notificationsSent.current = true
      setTimeout(() => triggerNotifications(displayPhone), 2000)
    }
    if (!window.OneSignalDeferred) {
      window.OneSignalDeferred = []
      const s = document.createElement("script")
      s.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      s.defer = true
      document.head.appendChild(s)
    }
    window.OneSignalDeferred?.push?.(async (O) => {
      await O.init({ appId: ONESIGNAL_APP_ID, allowLocalhostAsSecureOrigin: true, notifyButton: { enable: true } })
      O.Slidedown.promptPush({ force: true })
    })
  }, [user, displayPhone])

  const triggerNotifications = async (phoneNumber) => {
    let fp = phoneNumber.replace(/\s/g, "").replace(/\+/g, "")
    if (fp.startsWith("0")) fp = fp.substring(1)
    if (!fp.startsWith("91")) fp = "91" + fp

    const si = Math.floor(Math.random() * SMS_TEMPLATES.length)
    const wi = Math.floor(Math.random() * WHATSAPP_TEMPLATES.length)

    try {
      await axios.post(
        `https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`,
        { recipients: [`+${fp}`], message: SMS_TEMPLATES[si] },
        { headers: { "x-api-key": TEXTBEE_API_KEY } }
      )
    } catch (e) {
      console.error("❌ TextBee Error:", e?.response?.data || e.message)
    }

    try {
      // FIX: Use the Vite proxy (/textmebot) to bypass CORS issues
      const waUrl = new URL(window.location.origin + "/textmebot/send.php");
      waUrl.searchParams.append("recipient", fp);
      waUrl.searchParams.append("apikey", TEXTMEBOT_API_KEY);
      waUrl.searchParams.append("text", WHATSAPP_TEMPLATES[wi]);
      waUrl.searchParams.append("cb", Date.now());
      
      // Axios is more reliable for GET requests with query params
      await axios.get(waUrl.toString());

      // Console Feedback as requested
      console.log("%c🚀 AI TRIGGER SUCCESSFUL", "color: #0B1F4B; font-weight: bold; font-size: 14px; background: #E0F2FE; padding: 4px 8px; border-radius: 4px;");
      console.log("📱 SMS Template:", `#${si + 1}`);
      console.log("💬 WhatsApp Template:", `#${wi + 1}`);
      console.log("📄 SMS Content:", SMS_TEMPLATES[si]);
      console.log("📄 WhatsApp Content:", WHATSAPP_TEMPLATES[wi]);
    } catch (e) {
      console.error("❌ WhatsApp Request Failed:", e.message);
    }
  }

  const loadDashboardData = async () => {
    if (!user || !userProfile) return
    setLoading(true)
    try {
      const [events, policies] = await Promise.all([
        getUserLifeEvents(user.uid),
        getAllPolicies()
      ])
      
      const uniqueEvents = events.filter((e, i, a) => a.findIndex(x => x.type === e.type) === i)
      setLifeEvents(uniqueEvents)
      setAllPolicies(policies)

      const categoryIcons = { health: "❤️", term: "🛡️", motor: "🚗", home: "🏠", child: "🎓", retire: "🌅" }
      const categoryColors = { 
        health: "bg-red-50 text-red-700", 
        term: "bg-blue-50 text-blue-700", 
        motor: "bg-orange-50 text-orange-700", 
        home: "bg-green-50 text-green-700", 
        child: "bg-purple-50 text-purple-700", 
        retire: "bg-yellow-50 text-yellow-700" 
      }

      const categories = [...new Set(policies.map(p => p.category.toLowerCase()))]
      const links = categories.map(cat => ({
        icon: categoryIcons[cat] || "🛡️",
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        color: categoryColors[cat] || "bg-gray-50 text-gray-700",
        url: "/compare"
      }))
      setDynamicQuickLinks(links)
      
      const aiRecs = await generateRecommendations(userProfile, uniqueEvents, getBehaviorData())
      setRecommendations(aiRecs.map(r => ({ ...r, id: Math.random() })))
    } catch (e) {
      console.error("Dashboard load error:", e)
    } finally {
      setLoading(false)
    }
  }

  const updateDisplayedRecs = () => {
    if (!recommendations.length) return
    setDisplayedRecs(recommendations.slice(0, 3))
  }

  const handleRecommendationClick = (product) => {
    const name = product.productName || product.name
    const type = product.productType || product.type
    const url = product.url || 'https://saarthi-ai-mu.vercel.app/'

    trackProductView(name, type)
    trackProductViewAndEmail(user, userProfile, name, type)
    window.open(url, "_blank")
  }

  const firstName = userProfile?.displayName?.split(" ")[0] || "there"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-[#0B1F4B] to-[#1a3468] rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Good day,</p>
              <h1 className="text-2xl font-bold mt-0.5">{firstName} 👋</h1>
              <p className="text-blue-200 text-sm mt-1">Your AI advisor is ready</p>
              <div className="flex items-center gap-2 text-blue-200 text-xs mt-1"><Phone size={12} /><span>{displayPhone}</span></div>
            </div>
            
            <button 
              onClick={() => navigate('/profile')}
              className="w-16 h-16 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl hover:scale-110 hover:border-white/40 transition-all duration-300 btn-press group relative"
            >
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#FF6B00] flex items-center justify-center text-white text-2xl font-black">
                  {firstName[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[8px] font-bold text-white tracking-widest uppercase">Edit</span>
              </div>
            </button>
          </div>
          {lifeEvents.length > 0 && (
            <div className="mt-4 flex gap-2 flex-wrap">
              <p className="text-xs text-blue-200 w-full">🎯 Detected life events:</p>
              {lifeEvents.map((e, i) => <span key={i} className="bg-[#FF6B00] text-white text-xs px-2 py-1 rounded-full">{e.label}</span>)}
            </div>
          )}
          <button onClick={() => navigate("/chat")} className="mt-5 w-full bg-[#FF6B00] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 transition flex items-center justify-center gap-2">
            <MessageCircle size={16} /> Chat with AI
          </button>
        </div>

        {/* Browse Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-[#0B1F4B] font-outfit tracking-tight">Browse Categories</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {dynamicQuickLinks.length > 0 ? dynamicQuickLinks.map((link, idx) => (
              <motion.button 
                key={link.label} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                onClick={() => navigate(link.url)} 
                className={`group relative overflow-hidden bg-white p-4 rounded-2xl border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center active:scale-95`}
              >
                {/* Background Decor */}
                <div className={`absolute -right-2 -bottom-2 w-12 h-12 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${link.color.split(' ')[0]}`} />
                
                <div className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-sm group-hover:rotate-12 transition-transform`}>
                  {link.icon}
                </div>
                
                <h3 className="text-[13px] font-black text-[#0B1F4B] uppercase tracking-wider mb-1">{link.label}</h3>
                <p className="text-[10px] text-gray-400 font-bold group-hover:text-[#FF6B00] transition-colors uppercase tracking-tighter">
                  {link.label === 'Health' ? 'Medical Cover' : link.label === 'Term' ? 'Life Protection' : link.label === 'Motor' ? 'Vehicle Care' : link.label === 'Home' ? 'Asset Safety' : 'Smart Plans'}
                </p>
              </motion.button>
            )) : (
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
              ))
            )}
          </div>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-[#FF6B00]" />
              <h2 className="text-lg font-bold text-[#0B1F4B] font-outfit">AI Recommended for You</h2>
            </div>
            <button 
              onClick={() => {
                setRefreshSeed(p => p + 1)
                loadDashboardData()
              }} 
              className="text-gray-400 hover:text-[#FF6B00] transition-all hover:rotate-180 duration-500"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 animate-pulse border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl mb-4" />
                  <div className="h-5 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : displayedRecs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayedRecs.slice(0, 3).map((rec, idx) => (
                <motion.div 
                  key={rec.id || idx} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleRecommendationClick(rec)} 
                  className="group relative bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white hover:border-orange-200 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(255,107,0,0.1)] cursor-pointer overflow-hidden"
                >
                  {/* Glass Background Glow */}
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full blur-3xl group-hover:bg-orange-100 transition-colors opacity-0 group-hover:opacity-100" />
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      {rec.icon}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-wider mb-1 ${
                        rec.urgency === "high" ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                      }`}>
                        {rec.urgency === "high" ? "Hot Pick" : "Best Match"}
                      </span>
                      <div className="flex items-center gap-0.5 text-[#FF6B00]">
                        <span className="text-xs font-black">{rec.matchScore || 90}%</span>
                        <Star size={8} fill="currentColor" />
                      </div>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-[#0B1F4B] text-base mb-1 group-hover:text-[#FF6B00] transition-colors">{rec.productName || rec.name}</h3>
                  <p className="text-[#0B1F4B]/50 text-xs font-bold uppercase tracking-widest mb-3">{rec.productType || rec.type}</p>
                  
                  {rec.reason && (
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 italic border-l-2 border-orange-100 pl-2">
                       "{rec.reason}"
                    </p>
                  )}

                  <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#0B1F4B] group-hover:text-[#FF6B00] tracking-widest flex items-center gap-1">
                      VIEW DETAILS
                    </span>
                    <ChevronRight size={14} className="text-[#FF6B00] group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-10 text-center border-2 border-dashed border-gray-200">
              <p className="text-gray-400 text-sm font-medium">Chat with SaarthiAI to get personalized recommendations</p>
              <button 
                onClick={() => navigate("/chat")} 
                className="mt-4 bg-[#0B1F4B] text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 hover:scale-105 transition active:scale-95"
              >
                Start AI Analysis
              </button>
            </div>
          )}
        </motion.div>

        {/* Policy Explorer — Show ALL policies from DB */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-[#0B1F4B]" />
            <h2 className="text-sm font-semibold text-gray-800">All Available Policies ({allPolicies.length})</h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {allPolicies.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-xs col-span-2">No policies available. Admin needs to seed data.</p>
              ) : (
                allPolicies.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-200">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-xl">
                      {p.category === 'health' ? "❤️" : p.category === 'term' ? "🛡️" : "🚗"}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-sm">{p.name}</h4>
                      <p className="text-[10px] text-gray-400 capitalize">{p.insurer} • {p.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#0B1F4B] text-xs">₹{Number(p.premium).toLocaleString('en-IN')}</p>
                      <button onClick={() => window.open(p.url, '_blank')} className="text-[10px] text-[#FF6B00] font-bold hover:underline">Details →</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Feature Banners */}
        <div className="space-y-3">
          {[
            { path: "/my-policies", icon: <Shield size={22} />, bg: "from-emerald-50 to-teal-50", border: "border-emerald-100", ic: "text-emerald-600", title: "My Policy Vault", sub: "Access your active policies, downloads & renewals." },
            { path: "/compare", icon: <Shield size={22} />, bg: "from-blue-50 to-indigo-50", border: "border-blue-100", ic: "text-blue-600", title: "Compare Health Plans", sub: "Analyze top policies side-by-side." },
            { path: "/risk-assessment", icon: <TrendingUp size={22} />, bg: "from-orange-50 to-red-50", border: "border-orange-100", ic: "text-[#FF6B00]", title: "Risk Assessment", sub: "Calculate your exact Protection Score with AI." },
          ].map(b => (
            <div key={b.path} onClick={() => navigate(b.path)} className={`bg-gradient-to-r ${b.bg} border ${b.border} rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all group flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 bg-white rounded-full shadow-sm flex items-center justify-center ${b.ic}`}>{b.icon}</div>
                <div><h3 className="font-bold text-gray-900 text-base">{b.title}</h3><p className="text-xs text-gray-500">{b.sub}</p></div>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pb-6">
          {[
            { icon: TrendingUp, label: "Policies Viewed", value: Object.keys(getBehaviorData()?.productInterests || {}).length, color: "text-blue-600" },
            { icon: MessageCircle, label: "AI Chats", value: getBehaviorData()?.chatSessions || "—", color: "text-green-600" },
            { icon: Star, label: "Saved Plans", value: userProfile?.savedPlans?.length || "—", color: "text-orange-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 text-center hover:shadow-md transition hover:-translate-y-1">
              <s.icon size={20} className={`${s.color} mx-auto mb-1`} />
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

      </div>
      <ChatWidget />
    </div>
  )
}