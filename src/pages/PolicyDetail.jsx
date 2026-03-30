import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Download, ShieldCheck, Heart, Car, AlertTriangle, FileText, CheckCircle, XCircle, MessageCircle, Info } from 'lucide-react'
import { getPurchasedPolicies } from '../firebase/firestore'
import { useAuth } from '../hooks/useAuth'

const COMMON_INCLUSIONS = [
  "In-patient hospitalisation (Room rent, ICU, nursing)",
  "Pre & Post hospitalisation (30/60 days)",
  "Day care procedures & treatments",
  "Ambulance cover up to limits",
  "Organ donor expenses"
]
const COMMON_EXCLUSIONS = [
  "Pre-existing diseases (during waiting period)",
  "Cosmetic or plastic surgery",
  "Dental treatments (unless due to accident)",
  "Self-inflicted injuries",
  "Adventure sports related injuries"
]

export default function PolicyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [policy, setPolicy] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPolicy() {
      if (!user) return
      setLoading(true)
      try {
        const policies = await getPurchasedPolicies(user.uid)
        const found = policies.find(p => p.id === id)
        if (found) {
          setPolicy(found)
        }
      } catch (e) {
        console.error("Failed to load policy:", e)
      } finally {
        setLoading(false)
      }
    }
    loadPolicy()
  }, [id, user])

  const getIcon = (type) => {
    if (type === 'health') return <Heart size={24} className="text-red-500" />
    if (type === 'motor') return <Car size={24} className="text-orange-500" />
    if (type === 'term') return <ShieldCheck size={24} className="text-blue-500" />
    return <FileText size={24} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#0B1F4B] border-t-[#FF6B00] rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Decrypting Vault Document...</p>
      </div>
    )
  }

  if (!policy) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center text-center">
        <ShieldCheck size={48} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Policy Not Found</h2>
        <p className="text-gray-500 mb-6 font-medium">We could not locate this document in your vault.</p>
        <button onClick={() => navigate('/my-policies')} className="btn-gradient px-6 py-2 rounded-xl text-white font-bold">Return to Vault</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* ── Header ── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/my-policies')} className="text-gray-500 hover:text-gray-800 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-gray-900 font-bold text-lg leading-tight">{policy.id}</h1>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/chat?context=explain_policy_${policy.id}`)}
          className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-100 transition shadow-sm"
        >
          <MessageCircle size={16} /> 
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6 animate-fade-in-up">

        {/* Hero Card */}
        <div className="bg-[#0B1F4B] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between relative z-10">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-white rounded-2xl p-2 border shadow-inner flex items-center justify-center shrink-0">
                <img 
                  src={policy.logo} 
                  alt={policy.insurer} 
                  className="max-w-full max-h-full object-contain mix-blend-multiply"
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span class="text-2xl text-gray-800">🏛️</span>'; }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getIcon(policy.type)}
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">{policy.type} POLICY</p>
                </div>
                <h2 className="text-3xl font-bold font-outfit text-white tracking-tight">{policy.planName}</h2>
                <p className="text-blue-100/80 font-medium">{policy.insurer}</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 w-full md:w-auto mt-4 md:mt-0">
              <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold mb-1">Total Coverage</p>
              <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">
                {policy.coverAmount}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Policy Snapshot Grid */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Info size={20} className="text-blue-600" /> Policy Snapshot
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Annual Premium</p>
                  <p className="font-bold text-gray-900">{policy.premium}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Status</p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> {policy.status}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Renewal Date</p>
                  <p className="font-bold text-gray-900">{policy.renewalDate}</p>
                </div>
                <div className="col-span-2 md:col-span-3">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Covered Members</p>
                  <p className="font-medium text-gray-800">{policy.members?.join(', ') || 'Self'}</p>
                </div>
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100">
                <h3 className="text-sm font-bold text-emerald-900 mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" /> What is Covered
                </h3>
                <ul className="space-y-3">
                  {COMMON_INCLUSIONS.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-emerald-900 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100">
                <h3 className="text-sm font-bold text-red-900 mb-4 flex items-center gap-2">
                  <XCircle size={18} className="text-red-500" /> What is NOT Covered
                </h3>
                <ul className="space-y-3">
                  {COMMON_EXCLUSIONS.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-red-900 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Documents */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-4">Official Documents</h3>
              <div className="space-y-3">
                {policy.documents?.map(doc => (
                  <button key={doc} className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-100 transition group text-left">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 truncate">{doc}</span>
                    </div>
                    <Download size={16} className="text-gray-400 group-hover:text-blue-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Summary */}
            <div className="bg-gradient-to-br from-[#0B1F4B] to-slate-800 rounded-2xl p-6 shadow-md text-white">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={20} className="text-[#FF6B00]" />
                <h3 className="font-bold">AI Analysis</h3>
              </div>
              <p className="text-sm text-blue-100/90 leading-relaxed mb-4">
                This {policy.planName} provides comprehensive base protection. Because we detected an upcoming child, you may want to review maternity riders before renewal. 
              </p>
              <button 
                onClick={() => navigate(`/chat?context=review_riders_${policy.id}`)}
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition"
              >
                Explore Riders <ChevronRightIcon />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
  )
}
