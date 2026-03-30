// src/pages/PolicyCompare.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, CheckCircle, XCircle, Shield, Star, Heart, FileText, Car } from 'lucide-react'
import { getPoliciesByCategory } from '../firebase/firestore'

const CATEGORIES = [
  { id: 'health', label: 'Health Insurance', icon: <Heart size={16} /> },
  { id: 'term', label: 'Term Life', icon: <FileText size={16} /> },
  { id: 'motor', label: 'Car Insurance', icon: <Car size={16} /> },
]

const FEATURE_LABELS = {
  health: [
    { key: 'coverAmount', title: 'Cover Amount', info: 'Maximum payout guaranteed by the policy' },
    { key: 'hospitals', title: 'Cashless Hospitals', info: "Network hospitals where you don't pay upfront" },
    { key: 'csr', title: 'Claim Settlement Ratio', info: 'Percentage of claims approved by the insurer' },
    { key: 'waitingPeriod', title: 'Pre-existing Wait', info: 'Waiting time before old illnesses are covered' },
    { key: 'roomRent', title: 'Room Rent Limit', info: 'Max cap on hospital room rent per day' },
    { key: 'copay', title: 'Co-Payment', info: 'Percentage of bill you must pay from pocket' },
    { key: 'restoration', title: 'Unlimited Refill', info: 'Cover refills completely if exhausted in a year' },
    { key: 'maternity', title: 'Maternity Cover', info: 'Coverage for pregnancy and delivery' },
  ],
  term: [
    { key: 'coverAmount', title: 'Cover Amount', info: 'Sum assured paid to nominee on death' },
    { key: 'term', title: 'Policy Duration', info: 'Age until which your life is covered' },
    { key: 'csr', title: 'Claim Settlement Ratio', info: 'Death claims settled by the insurer' },
    { key: 'rop', title: 'Return of Premium', info: 'Get all premiums back if you survive the term' },
    { key: 'accidental', title: 'Accidental Death Rider', info: 'Extra payout in case of accidental death' },
    { key: 'critical', title: 'Critical Illness Rider', info: 'Payout on diagnosis of severe diseases' },
    { key: 'waiver', title: 'Premium Waiver', info: 'Premiums waived on disability/illness' },
    { key: 'claimTime', title: 'Claim Process Time', info: 'Average time to disburse the death benefit' },
  ],
  motor: [
    { key: 'coverAmount', title: 'IDV (Car Value)', info: 'Maximum payout in case of total loss or theft' },
    { key: 'network', title: 'Network Garages', info: 'Garages offering cashless repairs' },
    { key: 'csr', title: 'Claim Settlement Ratio', info: 'Motor claims settled by the insurer' },
    { key: 'zeroDep', title: 'Zero Depreciation', info: 'Full parts cost covered without age deduction' },
    { key: 'rti', title: 'Return to Invoice', info: 'Get full car purchase value in total loss/theft' },
    { key: 'roadside', title: 'Roadside Assistance', info: 'Help for towing, flat tyre, jumpstart' },
    { key: 'consumables', title: 'Consumables Cover', info: 'Covers engine oil, nuts, bolts, etc.' },
    { key: 'inspection', title: 'Claim Inspection', info: 'How damages are assessed during a claim' },
  ],
}

function CellValue({ feat }) {
  if (!feat) return <span className="text-gray-300 text-sm">—</span>
  if (feat.type === 'boolean') {
    return feat.value
      ? <CheckCircle size={20} className="text-green-500 mx-auto" strokeWidth={2.5} />
      : <XCircle size={20} className="text-gray-300 mx-auto" />
  }
  return (
    <span className={`font-semibold text-sm ${feat.color === 'green' ? 'text-green-600' :
        feat.color === 'yellow' ? 'text-yellow-600' :
          'text-[#0B1F4B]'
      }`}>
      {feat.value}
    </span>
  )
}

function FeatureRow({ title, info, plans, featureKey }) {
  return (
    <div className={`flex border-b border-gray-100 hover:bg-blue-50/20 transition-colors`}>
      {/* Label */}
      <div className="w-[220px] shrink-0 px-5 py-4 bg-gray-50/60 flex items-center gap-2 border-r border-gray-100 sticky left-0 z-10">
        <span className="text-sm font-semibold text-gray-700 leading-tight">{title}</span>
        <div className="group relative cursor-help flex-shrink-0">
          <Info size={13} className="text-gray-400 hover:text-blue-500" />
          <div className="absolute left-0 bottom-full mb-2 w-52 p-2 bg-gray-900/90 text-white text-xs rounded-lg
                          opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
            {info}
            <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900/90" />
          </div>
        </div>
      </div>

      {/* Data cells */}
      {plans.map(plan => {
        const feat = plan.features?.find(f => f.key === featureKey)
        return (
          <div key={plan.id} className="min-w-[200px] flex-1 px-4 py-4 flex items-center justify-center border-r border-gray-100 last:border-0">
            <CellValue feat={feat} />
          </div>
        )
      })}
    </div>
  )
}

export default function PolicyCompare() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('health')
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPolicies() {
      setLoading(true)
      try {
        const data = await getPoliciesByCategory(activeCategory)
        setPlans(data)
      } catch (e) {
        console.error('Failed to load policies', e)
        setPlans([])
      } finally {
        setLoading(false)
      }
    }
    fetchPolicies()
  }, [activeCategory])

  const features = FEATURE_LABELS[activeCategory] || []

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0B1F4B] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between shadow-lg gap-4">
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">Compare Policies</h1>
          <p className="text-blue-200 text-xs">Side-by-side analysis tailored for you</p>
        </div>
        <div className="flex bg-white/10 p-1 rounded-xl overflow-x-auto gap-1">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${activeCategory === cat.id
                  ? 'bg-white text-[#0B1F4B] shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-gray-500">
              <div className="w-8 h-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              Loading policies...
            </div>
          ) : plans.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <Shield size={40} className="mx-auto mb-4 text-gray-300" />
              <p className="font-semibold mb-1">No plans found</p>
              <p className="text-xs text-gray-400">Go to <a href="/admin" className="text-blue-500 hover:underline">/admin</a> → Policies Database → Seed Policies</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                {/* Plan Header Row */}
                <div className="flex border-b-2 border-gray-200 bg-gray-50">
                  <div className="w-[220px] shrink-0 px-5 py-6 border-r border-gray-200 flex flex-col justify-end sticky left-0 bg-gray-50 z-10">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Compare Metrics</span>
                    <p className="text-[11px] text-gray-400 mt-1 leading-tight">Premiums incl. taxes. Values are estimates.</p>
                  </div>

                  {plans.map(plan => (
                    <div key={plan.id} className="min-w-[200px] flex-1 px-4 py-6 border-r border-gray-200 last:border-0 flex flex-col items-center text-center relative bg-gray-50">
                      {plan.popular && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Star size={9} fill="currentColor" /> AI Top Pick
                        </div>
                      )}
                      <div className="mt-4 h-12 w-28 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-center mb-3">
                        <img src={plan.logo} alt={plan.insurer} className="max-h-10 max-w-full object-contain mix-blend-multiply" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 h-10">{plan.name}</h3>
                      <p className="text-xs text-gray-500 mb-4">{plan.insurer}</p>
                      <div className="mt-auto w-full">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Premium</p>
                        <p className="text-xl font-bold text-[#0B1F4B]">₹{Number(plan.premium).toLocaleString('en-IN')}<span className="text-[10px] text-gray-400 font-normal">/yr</span></p>
                        <button onClick={() => window.open(plan.url, '_blank')}
                          className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all ${plan.popular ? 'bg-[#0B1F4B] text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
                          View Plan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feature Rows */}
                <div>
                  {features.map(f => (
                    <FeatureRow key={f.key} title={f.title} info={f.info} featureKey={f.key} plans={plans} />
                  ))}
                </div>

                {/* Footer */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-t border-gray-200 flex items-center justify-center gap-3 min-w-full">
                  <Shield size={20} className="text-blue-600 flex-shrink-0" />
                  <p className="text-xs text-gray-600 font-medium">100% genuine data sourced from IRDAI and official insurer brochures.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}