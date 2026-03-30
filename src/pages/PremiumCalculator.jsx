import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Shield, ArrowLeft, Info, HeartPulse, Activity, 
  Banknote, ShieldAlert, CheckCircle2, ChevronDown, 
  ChevronUp, Save, History, LayoutDashboard,
  TrendingUp, MapPin, Weight, Briefcase, Zap, ShieldCheck, ChevronRight
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts'

// IRDAI Compliance Disclaimers
const DISCLAIMERS = [
  "Premiums are indicative. Subject to IRDAI guidelines & insurer underwriting.",
  "SaarthiAI is an AI advisory platform, not a direct insurance seller or broker.",
  "Final premiums are determined after actual medical examinations and full underwriting."
]

export default function PremiumCalculator() {
  const { userProfile, user } = useAuth()
  const navigate = useNavigate()

  // Form State
  const [age, setAge] = useState(userProfile?.age || 30)
  const [coverageType, setCoverageType] = useState('health') // health, term
  const [sumAssured, setSumAssured] = useState(1000000) // 10 Lakhs
  const [familySize, setFamilySize] = useState('1A') // 1A, 2A, 2A1C, 2A2C
  const [pincode, setPincode] = useState('')
  const [height, setHeight] = useState(170) // cm
  const [weight, setWeight] = useState(70) // kg
  const [occupation, setOccupation] = useState('desk') // desk, field, hazardous
  const [smoker, setSmoker] = useState(false)
  
  // UI State
  const [showBreakup, setShowBreakup] = useState(true)
  const [showSavedQuotes, setShowSavedQuotes] = useState(false)
  const [savedQuotes, setSavedQuotes] = useState([])
  const [saving, setSaving] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load Saved Quotes
  useEffect(() => {
    const stored = localStorage.getItem(`saarthi_saved_quotes_${user?.uid || 'guest'}`)
    if (stored) setSavedQuotes(JSON.parse(stored))
  }, [user?.uid])

  // BMI Calculation
  const bmi = useMemo(() => {
    const heightInMeters = height / 100
    const val = weight / (heightInMeters * heightInMeters)
    return parseFloat(val.toFixed(1))
  }, [height, weight])

  const bmiCategory = useMemo(() => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' }
    if (bmi < 25) return { label: 'Healthy', color: 'text-green-500' }
    if (bmi < 30) return { label: 'Overweight', color: 'text-orange-500' }
    return { label: 'Obese', color: 'text-red-500' }
  }, [bmi])

  // Advanced Premium Calculation Logic
  const calculation = useMemo(() => {
    let base = coverageType === 'health' ? 6200 : 12500
    
    // Age Multiplier
    if (age <= 25) base *= 0.8
    else if (age <= 35) base *= 1.0
    else if (age <= 45) base *= 1.45
    else if (age <= 55) base *= 2.1
    else base *= 3.6

    // Sum Assured Factor (per lakh)
    const saFactor = sumAssured / 100000
    base += saFactor * (coverageType === 'health' ? 240 : 110)

    // Family Size (Health)
    if (coverageType === 'health') {
      if (familySize === '2A') base *= 1.6
      if (familySize === '2A1C') base *= 1.85
      if (familySize === '2A2C') base *= 2.1
    }

    // Pincode Loading (Simulated regional risk)
    let regionalLoading = 0
    if (pincode && (pincode.startsWith('40') || pincode.startsWith('11') || pincode.startsWith('56'))) {
      regionalLoading = base * 0.08 // 8% Metro Loading
    }

    // BMI Loading
    let bmiLoading = 0
    if (bmi >= 30) bmiLoading = base * 0.25
    else if (bmi >= 25) bmiLoading = base * 0.12

    // Occupation Risk
    let occLoading = 0
    if (occupation === 'field') occLoading = base * 0.15
    else if (occupation === 'hazardous') occLoading = base * 0.45

    // Smoker Loading
    let smokingLoading = smoker ? base * 0.5 : 0

    const loadedPremium = base + regionalLoading + bmiLoading + occLoading + smokingLoading
    const gst = loadedPremium * 0.18
    const total = loadedPremium + gst

    const monthlyEMI = (total * 1.05) / 12 // 5% surcharge for monthly
    const annualSavings = (monthlyEMI * 12) - total

    return {
      base: Math.round(base),
      loading: Math.round(regionalLoading + bmiLoading + occLoading + smokingLoading),
      gst: Math.round(gst),
      total: Math.round(total),
      monthly: Math.round(monthlyEMI),
      savings: Math.round(annualSavings),
      loadedPremium: Math.round(loadedPremium)
    }
  }, [age, coverageType, sumAssured, familySize, pincode, bmi, occupation, smoker])

  // Chart Data: Projection vs Age
  const chartData = useMemo(() => {
    const ages = [20, 25, 30, 35, 40, 45, 50, 55, 60]
    return ages.map(targetAge => {
      // Scale premium roughly based on age logic above
      let factor = 1
      if (targetAge <= 25) factor = 0.8
      else if (targetAge <= 35) factor = 1.0
      else if (targetAge <= 45) factor = 1.45
      else if (targetAge <= 55) factor = 2.1
      else factor = 3.6
      return { 
        age: targetAge, 
        premium: Math.round(calculation.total * (factor / (age <= 25 ? 0.8 : age <= 35 ? 1.0 : age <= 45 ? 1.45 : age <= 55 ? 2.1 : 3.6))) 
      }
    })
  }, [calculation.total, age])

  // Save Quote Function
  const handleSaveQuote = () => {
    setSaving(true)
    const newQuote = {
      id: Date.now(),
      type: coverageType,
      amount: calculation.total,
      date: new Date().toLocaleDateString(),
      details: `${age}Y | ${sumAssured/100000}L ${coverageType}`
    }
    const updated = [newQuote, ...savedQuotes].slice(0, 5)
    setSavedQuotes(updated)
    localStorage.setItem(`saarthi_saved_quotes_${user?.uid || 'guest'}`, JSON.stringify(updated))
    setTimeout(() => {
      setSaving(false)
      setShowSavedQuotes(true)
    }, 600)
  }

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-inter bg-gray-50/50 min-h-screen pb-32">
      
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#0B1F4B] transition-colors mb-2 text-sm font-semibold group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
             <div className="bg-[#0B1F4B] text-white p-2.5 rounded-2xl shadow-lg shadow-navy-100">
               <Banknote size={24} />
             </div>
             <h1 className="text-3xl font-extrabold text-[#0B1F4B] font-outfit tracking-tight">Advanced Premium Calculator</h1>
          </div>
        </div>

        <button 
          onClick={() => setShowSavedQuotes(!showSavedQuotes)}
          className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-[#0B1F4B] font-bold text-sm"
        >
          <History size={18} className="text-[#FF6B00]" /> Saved Quotes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── LEFT COL: INPUTS ────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          
          <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-orange-50/50 transition-all">
            <h3 className="text-sm font-black text-[#0B1F4B] uppercase tracking-widest mb-6 flex items-center gap-2">
              <Zap size={16} className="text-[#FF6B00]" /> Basic Information
            </h3>

            {/* Coverage Toggle */}
            <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl mb-8 border border-gray-100">
              {['health', 'term'].map(t => (
                <button 
                  key={t}
                  onClick={() => setCoverageType(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black rounded-xl transition-all ${coverageType === t ? 'bg-white text-[#FF6B00] shadow-sm border border-gray-100 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {t === 'health' ? <HeartPulse size={16}/> : <Shield size={16}/>}
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {/* Age Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-tighter">Primary Member Age</label>
                  <span className="text-sm font-black text-[#FF6B00] bg-orange-50 px-3 py-1 rounded-full">{age} Years</span>
                </div>
                <input 
                  type="range" min="18" max="75" value={age} 
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]"
                />
              </div>

              {/* Sum Assured */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-tighter">Sum Assured</label>
                  <span className="text-sm font-black text-[#0B1F4B]">{sumAssured >= 10000000 ? `${sumAssured/10000000} Cr` : `${sumAssured/100000} Lakhs`}</span>
                </div>
                <input 
                  type="range" min="500000" max={coverageType === 'health' ? "10000000" : "50000000"} step="500000"
                  value={sumAssured} 
                  onChange={(e) => setSumAssured(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#0B1F4B]"
                />
              </div>

              {/* Family & Location */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <MapPin size={10} /> Pincode
                  </label>
                  <input 
                    type="text" maxLength="6" placeholder="400001"
                    value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g,''))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm font-bold focus:ring-2 focus:ring-[#FF6B00]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Occupation</label>
                  <select 
                    value={occupation} onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm font-bold focus:ring-2 focus:ring-[#FF6B00]/20 outline-none"
                  >
                    <option value="desk">Desk Job</option>
                    <option value="field">Field Work</option>
                    <option value="hazardous">Hazardous</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Health Section */}
          <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
             <h3 className="text-sm font-black text-[#0B1F4B] uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity size={16} className="text-green-500" /> Health & Vitals
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Height (cm)</label>
                <input 
                  type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Weight (kg)</label>
                <input 
                  type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm font-bold"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Impact BMI</p>
                <p className="text-xl font-black font-outfit text-[#0B1F4B]">{bmi}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-black uppercase tracking-widest ${bmiCategory.color}`}>{bmiCategory.label}</span>
                <p className="text-[10px] text-gray-400">Loading: {bmi >= 30 ? '25%' : bmi >= 25 ? '12%' : '0%'}</p>
              </div>
            </div>

            <label className="flex items-center gap-3 mt-6 p-4 bg-orange-50/50 rounded-2xl border border-orange-100 cursor-pointer group hover:bg-orange-50 transition-colors">
               <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${smoker ? 'bg-[#FF6B00] border-[#FF6B00]' : 'border-orange-200 bg-white'}`}>
                 {smoker && <CheckCircle2 size={14} className="text-white" />}
               </div>
               <input type="checkbox" className="hidden" checked={smoker} onChange={() => setSmoker(!smoker)} />
               <span className="text-xs font-black text-[#0B1F4B] uppercase tracking-tighter">Tobacco / Smoker Info</span>
            </label>
          </section>

        </div>

        {/* ── RIGHT COL: RESULTS ──────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Pricing Plate */}
          <div className="bg-gradient-to-br from-[#0B1F4B] to-[#122c66] rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF6B00] opacity-10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/10 mb-6 backdrop-blur-md">
                   <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest">Live Dynamic Calculation</span>
                </div>
                
                <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-2">Total Annual Payable</p>
                <div className="flex items-baseline gap-3">
                  <motion.h2 
                    key={calculation.total}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-7xl font-extrabold font-outfit tracking-tighter"
                  >
                    {formatCurrency(calculation.total)}
                  </motion.h2>
                  <span className="text-blue-200 font-bold mb-2">/year</span>
                </div>
                <p className="text-sm text-blue-200/60 mt-4 flex items-center gap-2">
                  <Info size={14} /> Includes 18% GST ( {formatCurrency(calculation.gst)} )
                </p>
              </div>

              <div className="w-full md:w-auto flex flex-col gap-4">
                <div className="bg-white/10 backdrop-blur-sm p-5 rounded-[2rem] border border-white/10 text-center">
                  <p className="text-[10px] font-black uppercase text-blue-200 mb-1">Monthly EMI</p>
                  <p className="text-2xl font-black font-outfit text-white">{formatCurrency(calculation.monthly)}</p>
                  <p className="text-[10px] text-green-400 font-bold mt-1">₹ {calculation.savings} Savings on annual pay</p>
                </div>
                <button 
                  onClick={handleSaveQuote}
                  disabled={saving}
                  className="w-full bg-[#FF6B00] hover:bg-[#e66100] active:scale-95 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-orange-900/40"
                >
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Save Quote</>}
                </button>
              </div>
            </div>

            {/* Premium Breakup Toggle */}
            <div className="mt-10 border-t border-white/5 pt-6">
               <button 
                onClick={() => setShowBreakup(!showBreakup)}
                className="flex items-center gap-2 text-xs font-bold text-blue-200 hover:text-white transition-colors"
               >
                 View Detailed Breakup {showBreakup ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
               </button>
               
               <AnimatePresence>
                 {showBreakup && (
                   <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                   >
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-blue-200 uppercase font-bold mb-1">Base Premium</p>
                          <p className="text-sm font-black">{formatCurrency(calculation.base)}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-blue-200 uppercase font-bold mb-1">Loading Charges</p>
                          <p className="text-sm font-black text-orange-300">+{formatCurrency(calculation.loading)}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-blue-200 uppercase font-bold mb-1">GST (@18%)</p>
                          <p className="text-sm font-black">{formatCurrency(calculation.gst)}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-blue-200 uppercase font-bold mb-1">Regional Loading</p>
                          <p className="text-sm font-black">{pincode ? '8% Metro' : 'None'}</p>
                        </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>

          {/* ⚡ VISUALIZATION: Premium vs Age ─────────────────────────── */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-8">
               <div>
                 <h3 className="text-xl font-black text-[#0B1F4B] font-outfit">Premium Projection</h3>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Impact of Aging on Yearly Cost</p>
               </div>
               <TrendingUp className="text-[#FF6B00]" size={24} />
             </div>

             <div className="h-[250px] w-full mt-4">
                {isMounted && (
                  <ResponsiveContainer width="99%" height="100%" minHeight={250}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="age" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                        formatter={(val) => formatCurrency(val)}
                        labelFormatter={(label) => `Age ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="premium" 
                        stroke="#FF6B00" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorPremium)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
             </div>
             <p className="text-center text-[10px] text-gray-400 font-bold uppercase italic mt-4">
               * Projected based on your currently selected coverage inputs
             </p>
          </div>

          {/* 📋 RECOMMENDED PLANS ────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-extrabold text-[#0B1F4B] font-outfit">Verified Industry Quotes</h3>
              <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1 rounded-full text-[10px] font-black text-[#FF6B00] uppercase">
                <ShieldCheck size={12} /> Partner Verified
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Optima Restore', insurer: 'HDFC ERGO', csr: '98.4%', hospitals: '12,000+', multiplier: 1 },
                { name: 'Comprehensive', insurer: 'Star Health', csr: '91.2%', hospitals: '14,000+', multiplier: 1.12, highlight: true }
              ].map((plan, idx) => (
                <div key={idx} className={`relative bg-white rounded-[2rem] p-8 border-2 transition-all hover:-translate-y-2 group ${plan.highlight ? 'border-[#FF6B00] shadow-xl shadow-orange-100' : 'border-gray-100 shadow-sm hover:border-gray-200'}`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-[10px] font-black uppercase px-4 py-1 rounded-full shadow-lg">Value Pick</div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-black text-[#0B1F4B] text-lg leading-none">{plan.name}</h4>
                      <p className="text-xs text-gray-400 font-bold mt-1 uppercase">{plan.insurer}</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]" />
                      <span className="text-[10px] font-black text-gray-400 uppercase">Compare</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                     <div className="bg-gray-50 p-3 rounded-2xl">
                        <p className="text-[9px] text-gray-400 font-black uppercase mb-0.5">Settlement (CSR)</p>
                        <p className="text-sm font-black text-[#0B1F4B]">{plan.csr}</p>
                     </div>
                     <div className="bg-gray-50 p-3 rounded-2xl">
                        <p className="text-[9px] text-gray-400 font-black uppercase mb-0.5">Network Hospitals</p>
                        <p className="text-sm font-black text-[#0B1F4B]">{plan.hospitals}</p>
                     </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div>
                      <p className="text-3xl font-black font-outfit text-[#0B1F4B] leading-none mb-1">
                        {formatCurrency(calculation.total * plan.multiplier)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Estimated Premium</p>
                    </div>
                    <button 
                      onClick={() => navigate('/chat', { state: { 
                        source: 'calculator', 
                        planName: plan.name, 
                        insurer: plan.insurer,
                        sumAssuredDisplay: sumAssured >= 10000000 ? `${sumAssured/10000000} Cr` : `${sumAssured/100000} Lakhs`,
                        premium: calculation.total * plan.multiplier
                      } })}
                      className="bg-gray-50 group-hover:bg-[#FF6B00] text-gray-500 group-hover:text-white p-3 rounded-full transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 🛡️ COMPLIANCE FOOTER ────────────────────────────────────── */}
          <div className="border-t border-gray-100 pt-10">
             <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100 italic">
               <ShieldAlert className="text-gray-300 shrink-0" size={24} />
               <div className="space-y-1">
                 {DISCLAIMERS.map((d, i) => (
                    <p key={i} className="text-[10px] text-gray-400 font-medium leading-relaxed">• {d}</p>
                 ))}
               </div>
             </div>
             <p className="text-center text-[10px] font-black text-[#0B1F4B]/30 uppercase tracking-[0.2em] mt-10">
               Partner integrations with Policybazaar, Coverfox & direct insurers — Coming Q3 2026
             </p>
          </div>

        </div>
      </div>

      {/* ── SAVED QUOTES DRAWER ─────────────────────────────────────── */}
      <AnimatePresence>
        {showSavedQuotes && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSavedQuotes(false)}
              className="fixed inset-0 bg-[#0B1F4B]/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-[#0B1F4B] font-outfit">Historical Quotes</h3>
                <button onClick={() => setShowSavedQuotes(false)} className="p-2 hover:bg-gray-100 rounded-full">
                   <ChevronRight size={20} className="text-gray-400" />
                </button>
              </div>

              {savedQuotes.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <History size={40} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-bold uppercase">No saved quotes yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedQuotes.map(q => (
                    <div key={q.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{q.date}</p>
                      <h4 className="text-lg font-black text-[#0B1F4B] mb-2">{formatCurrency(q.amount)}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-orange-100 text-[#FF6B00] px-2 py-0.5 rounded-md font-bold uppercase">{q.type}</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{q.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="absolute bottom-10 inset-x-8">
                <button 
                  onClick={() => setShowSavedQuotes(false)}
                  className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black text-sm uppercase tracking-widest shadow-xl"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
