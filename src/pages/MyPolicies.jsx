import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Download, ShieldCheck, Heart, Car, AlertTriangle, FileText, Clock } from 'lucide-react'
import { getPurchasedPolicies, purchasePolicy } from '../firebase/firestore'
import { useAuth } from '../hooks/useAuth'

// Default Demo Policies to Auto-Seed the Vault for genuine data preview
const MY_POLICIES = [
  {
    id: 'POL-HDFC-9082',
    type: 'health',
    insurer: 'HDFC ERGO',
    logo: 'https://companieslogo.com/img/orig/HDFCLIFE.NS-2ac64f1d.png?t=1654011242',
    planName: 'Optima Restore Family',
    coverAmount: '₹10,000,000',
    premium: '₹8,450/yr',
    members: ['Self', 'Spouse'],
    status: 'ACTIVE',
    renewalDate: '2026-11-15',
    daysLeft: 233,
    documents: ['Policy_Schedule.pdf', 'Cashless_Card.pdf']
  },
  {
    id: 'POL-DIG-5541',
    type: 'motor',
    insurer: 'Go Digit',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Digit_Insurance_Logo.svg/1200px-Digit_Insurance_Logo.svg.png',
    planName: 'Comprehensive Car Protect',
    coverAmount: '₹4,50,000 (IDV)',
    premium: '₹8,500/yr',
    members: ['Hyundai i20 (MH02AB1234)'],
    status: 'ACTIVE',
    renewalDate: '2026-04-30',
    daysLeft: 34,
    documents: ['Motor_Policy.pdf']
  },
  {
    id: 'POL-MAX-1122',
    type: 'term',
    insurer: 'Max Life',
    logo: 'https://companieslogo.com/img/orig/MAXHEALTH.NS-6a84c311.png?t=1659345710',
    planName: 'Smart Secure Plus',
    coverAmount: '₹1,00,00,000',
    premium: '₹11,200/yr',
    members: ['Self'],
    status: 'LAPSED_SOON',
    renewalDate: '2026-04-05',
    daysLeft: 9,
    documents: ['Term_Schedule.pdf', 'Tax_Receipt_80C.pdf']
  }
]

export default function MyPolicies() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [downloading, setDownloading] = useState(null)
  const [activePolicies, setActivePolicies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadVault() {
      if (!user) return
      setLoading(true)
      try {
        let policies = await getPurchasedPolicies(user.uid)
        
        // Auto-seed real documents on first load so the Vault isn't empty
        if (policies.length === 0) {
          for (const plan of MY_POLICIES) {
            await purchasePolicy(user.uid, plan)
          }
          // Fetch again
          policies = await getPurchasedPolicies(user.uid)
        }
        
        setActivePolicies(policies)
      } catch (e) {
        console.error("Failed to load vault:", e)
      } finally {
        setLoading(false)
      }
    }
    loadVault()
  }, [user])

  const handleDownload = (docName) => {
    setDownloading(docName)
    // Simulate network delay
    setTimeout(() => {
      setDownloading(null)
      alert(`Downloaded: ${docName}`)
    }, 1500)
  }

  const getIcon = (type) => {
    if (type === 'health') return <Heart size={20} className="text-red-500" />
    if (type === 'motor') return <Car size={20} className="text-orange-500" />
    if (type === 'term') return <ShieldCheck size={20} className="text-blue-500" />
    return <FileText size={20} />
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* ── Header ── */}
      <nav className="sticky top-0 z-40 bg-[#0B1F4B] px-6 py-4 flex items-center gap-4 shadow-lg">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">My Policy Vault</h1>
          <p className="text-blue-200 text-xs">Manage your active protection</p>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">

        {/* Total Protection Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-1">Total Life & Health Cover</p>
              <h2 className="text-4xl font-extrabold tracking-tight">₹1.10 <span className="text-2xl font-bold opacity-80">Crore</span></h2>
              <p className="text-xs text-blue-200 mt-2">Across 3 active policies</p>
            </div>
            <div className="bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/10 w-full md:w-auto">
              <div className="flex items-center gap-3">
                <ShieldCheck size={28} className="text-green-400" />
                <div>
                  <p className="text-sm font-bold">fully Protected</p>
                  <p className="text-xs text-white/70">No major gaps detected</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Policy List */}
        <h3 className="font-bold text-gray-800 text-lg pt-4">Active Policies</h3>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {activePolicies.map(policy => (
              <div key={policy.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              
              {/* Card Header */}
              <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl p-2 border border-gray-100 flex items-center justify-center shrink-0">
                    <img 
                      src={policy.logo} 
                      alt={policy.insurer} 
                      className="max-w-full max-h-full object-contain mix-blend-multiply"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<span class="text-2xl">🛡️</span>';
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getIcon(policy.type)}
                      <h4 className="font-bold text-gray-900">{policy.planName}</h4>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">{policy.insurer} • {policy.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {policy.daysLeft < 30 ? (
                    <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle size={14} /> Renew in {policy.daysLeft} Days
                    </span>
                  ) : (
                    <span className="bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <CheckCircleIcon /> Active Tracker
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6 bg-gray-50/50">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Cover Amount</p>
                  <p className="font-bold text-[#0B1F4B]">{policy.coverAmount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Premium</p>
                  <p className="font-bold text-gray-800">{policy.premium}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Covered Members</p>
                  <p className="font-semibold text-gray-700 text-sm">{policy.members.join(', ')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Renewal Date</p>
                  <p className="font-semibold text-gray-700 flex items-center gap-1 text-sm"><Clock size={14} className="text-gray-400"/> {policy.renewalDate}</p>
                </div>
              </div>

              {/* Card Footer - Downloads */}
              <div className="p-4 bg-white border-t border-gray-50 flex flex-wrap gap-3">
                {policy.documents?.map(doc => (
                  <button
                    key={doc}
                    onClick={() => handleDownload(doc)}
                    disabled={downloading === doc}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-600 border border-gray-200 hover:border-blue-200 transition-colors rounded-lg text-xs font-semibold"
                  >
                    {downloading === doc ? <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Download size={14} />}
                    {doc}
                  </button>
                ))}
                
                <button 
                  onClick={() => navigate(`/policy/${policy.id}`)}
                  className="ml-auto flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-bold px-3 py-2"
                >
                  View Details & Inclusions &rarr;
                </button>
              </div>

            </div>
          ))}
        </div>
        )}

      </div>
    </div>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  )
}
