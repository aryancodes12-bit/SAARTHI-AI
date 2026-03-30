import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Star, ArrowRight, Phone, Mail, ChevronRight,
  CheckCircle, Lock, HelpCircle, Users, Target, HeartHandshake,
  HeadphonesIcon, MessageCircle, Clock, Award, ChevronDown,
  User, Settings
} from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('All')
  const [showLoginDropdown, setShowLoginDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const tabs = ['All', 'Life', 'Health', 'Property', 'Retirement']

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLoginDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────
  // REPLACE the existing `const products = [...]` in Landing.jsx with this
  // All URLs verified — point to official Indian insurer websites
  // ─────────────────────────────────────────────────────────────────────────────

  const products = [
    // ── TERM LIFE ────────────────────────────────────────────────────────────
    {
      name: 'iProtect Smart Term Plan',
      type: 'Term Life',
      desc: 'Comprehensive term plan with critical illness & disability cover.',
      tag: 'Marriage',
      category: 'Life',
      icon: '🛡️',
      url: 'https://www.iciciprulife.com/term-insurance-plans/iprotect-smart-term-plan.html',
    },
    {
      name: 'HDFC Click 2 Protect Super',
      type: 'Term Life',
      desc: 'Best-in-class term plan with spouse cover & return of premium.',
      tag: 'Marriage',
      category: 'Life',
      icon: '👨‍👩‍👧',
      url: 'https://www.hdfclife.com/term-insurance-plans/click-2-protect-super',
    },
    {
      name: 'SBI Life eShield Next',
      type: 'Term Life',
      desc: 'Pure term plan from SBI Life with increasing cover option.',
      tag: 'Income Protection',
      category: 'Life',
      icon: '💰',
      url: 'https://www.sbilife.co.in/en/individual-life-insurance/term-insurance/eshield-next',
    },
    {
      name: 'Tata AIA Sampoorna Raksha',
      type: 'Term Life',
      desc: 'Whole life cover up to age 100 with waiver of premium.',
      tag: 'Home Loan',
      category: 'Life',
      icon: '🏠',
      url: 'https://www.tataaia.com/life-insurance-plans/term-insurance-plans/sampoorna-raksha-promise.html',
    },
    {
      name: 'Max Life Smart Secure Plus',
      type: 'Term Life',
      desc: 'Flexible term plan with joint cover and special exit value.',
      tag: 'New Job',
      category: 'Life',
      icon: '💼',
      url: 'https://www.maxlifeinsurance.com/term-insurance-plans/smart-secure-plus-plan',
    },
    {
      name: 'Bajaj Life Smart Protect Goal',
      type: 'Term Life',
      desc: 'Affordable term plan covering 55 critical illnesses.',
      tag: 'Wealth Creation',
      category: 'Life',
      icon: '📈',
      url: 'https://www.bajajlifeinsurance.com/term-insurance-plans/smart-protect-goal-term-plan.html',
    },

    // ── CHILD PLANS ──────────────────────────────────────────────────────────
    {
      name: 'HDFC Life YoungStar Udaan',
      type: 'Child Plan',
      desc: 'Unit linked child plan for higher education goals.',
      tag: 'New Baby',
      category: 'Life',
      icon: '🎓',
      url: 'https://www.hdfclife.com/child-insurance-plans/youngstar-udaan-plan',
    },
    {
      name: 'Tata AIA Future Child Plan',
      type: 'Child Plan',
      desc: 'Milestone payouts aligned to education milestones.',
      tag: 'New Baby',
      category: 'Life',
      icon: '📚',
      url: 'https://www.tataaia.com/life-insurance-plans/child-plans/future-child-plan.html',
    },
    {
      name: 'SBI Life Smart Champ Insurance',
      type: 'Child Plan',
      desc: 'Child plan with guaranteed payouts for education.',
      tag: 'Child Education',
      category: 'Life',
      icon: '🏫',
      url: 'https://www.sbilife.co.in/en/individual-life-insurance/children-plan/smart-champ-insurance',
    },

    // ── RETIREMENT / ANNUITY ─────────────────────────────────────────────────
    {
      name: 'ICICI Pru Immediate Annuity',
      type: 'Annuity',
      desc: 'Immediate or deferred annuity for lifetime pension.',
      tag: 'Retirement',
      category: 'Retirement',
      icon: '🌴',
      url: 'https://www.iciciprulife.com/retirement-plans/immediate-deferred-annuity-plan.html',
    },
    {
      name: 'SBI Life Golden Years Pension',
      type: 'Retirement',
      desc: 'Long-term corpus builder with guaranteed annuity.',
      tag: 'Retirement',
      category: 'Retirement',
      icon: '🌅',
      url: 'https://www.sbilife.co.in/en/pension-plans/golden-years-pension-plan',
    },
    {
      name: 'HDFC Life Pension Guaranteed Plan',
      type: 'Retirement',
      desc: 'Guaranteed income for life post retirement.',
      tag: 'Retirement',
      category: 'Retirement',
      icon: '💰',
      url: 'https://www.hdfclife.com/retirement-plans/pension-guaranteed-plan',
    },
    {
      name: 'Max Life Forever Young Pension',
      type: 'Retirement',
      desc: 'Flexible pension plan with lump sum & income options.',
      tag: 'Pension',
      category: 'Retirement',
      icon: '📉',
      url: 'https://www.maxlifeinsurance.com/pension-plans/forever-young-pension-plan',
    },
    {
      name: 'Canara HSBC Guaranteed Annuity',
      type: 'Retirement',
      desc: 'Lifetime guaranteed annuity income.',
      tag: 'Annuity',
      category: 'Retirement',
      icon: '🔄',
      url: 'https://www.canarahsbclife.com/retirement-plans/guaranteed-annuity-plan',
    },
    {
      name: 'HDFC Life NPS Pension Plan',
      type: 'Retirement',
      desc: 'National Pension Scheme with tax benefits under 80CCD.',
      tag: 'NPS',
      category: 'Retirement',
      icon: '⚡',
      url: 'https://www.hdfclife.com/retirement-plans/nps-pension-plan',
    },

    // ── HEALTH ───────────────────────────────────────────────────────────────
    {
      name: 'Niva Bupa ReAssure 2.0',
      type: 'Health',
      desc: 'Comprehensive health plan with no claim bonus & restore.',
      tag: 'Health Change',
      category: 'Health',
      icon: '❤️',
      url: 'https://www.nivabupa.com/health-insurance-plans/reassure-2-health-insurance-plan.html',
    },
    {
      name: 'Star Health Comprehensive',
      type: 'Health',
      desc: 'Individual & family floater with OPD cover.',
      tag: 'New Baby',
      category: 'Health',
      icon: '💊',
      url: 'https://www.starhealth.in/health-insurance/comprehensive-health-insurance',
    },
    {
      name: 'ICICI Lombard Complete Health',
      type: 'Health',
      desc: 'Cashless treatment at 6500+ hospitals across India.',
      tag: 'Critical Care',
      category: 'Health',
      icon: '⚠️',
      url: 'https://www.icicilombard.com/health-insurance/complete-health-insurance',
    },
    {
      name: 'HDFC Ergo Senior Citizen Red Carpet',
      type: 'Health',
      desc: 'Tailored health cover for senior citizens aged 60+.',
      tag: 'Senior Care',
      category: 'Health',
      icon: '👴',
      url: 'https://www.hdfcergo.com/health-insurance/senior-citizen-health-insurance',
    },
    {
      name: 'Niva Bupa Maternity Cover',
      type: 'Health',
      desc: 'Complete maternity and newborn health coverage.',
      tag: 'Pregnancy',
      category: 'Health',
      icon: '👶',
      url: 'https://www.nivabupa.com/health-insurance-plans/health-companion-plan.html',
    },
    {
      name: 'Aditya Birla Super Health Top Up',
      type: 'Health',
      desc: 'Super top-up plan to cover high medical bills affordably.',
      tag: 'Top Up',
      category: 'Health',
      icon: '➕',
      url: 'https://www.adityabirlahealth.com/healthinsurance/super-health-topup',
    },
    {
      name: 'Axis Max Critical Illness Plan',
      type: 'Health',
      desc: 'Lump sum payout on diagnosis of 64 critical illnesses.',
      tag: 'Critical Care',
      category: 'Health',
      icon: '🏥',
      url: 'https://www.axismaxlife.com/health-insurance/critical-illness-insurance',
    },

    // ── HOME / PROPERTY ──────────────────────────────────────────────────────
    {
      name: 'HDFC Ergo Home Insurance',
      type: 'Home Insurance',
      desc: 'Standard home structure and contents protection.',
      tag: 'Home Purchase',
      category: 'Property',
      icon: '🏠',
      url: 'https://www.hdfcergo.com/home-insurance/home-insurance-policy',
    },
    {
      name: 'Tata AIG Home Insurance',
      type: 'Home Insurance',
      desc: 'Premium cover for home, valuables and gadgets.',
      tag: 'Home Purchase',
      category: 'Property',
      icon: '🏡',
      url: 'https://www.tataaig.com/home-insurance',
    },
    {
      name: 'Bajaj Allianz Home Insurance',
      type: 'Renters',
      desc: 'Tenant and owner cover for belongings and liability.',
      tag: 'Rental',
      category: 'Property',
      icon: '🔑',
      url: 'https://www.bajajallianz.com/home-insurance.html',
    },
    {
      name: 'SBI General Landlord Insurance',
      type: 'Landlord',
      desc: 'Coverage for rental income loss and property damage.',
      tag: 'Landlord',
      category: 'Property',
      icon: '🏢',
      url: 'https://www.sbigeneral.in/portal/home-insurance',
    },
    {
      name: 'Bajaj Allianz Shopkeeper Insurance',
      type: 'Shop Insurance',
      desc: 'Cover for shop inventory, premises and liability.',
      tag: 'Business',
      category: 'Property',
      icon: '🏪',
      url: 'https://www.bajajallianz.com/shopkeeper-insurance-policy.html',
    },
    {
      name: 'ICICI Lombard Office Package',
      type: 'Office',
      desc: 'All-risk cover for office equipment and SME businesses.',
      tag: 'Office',
      category: 'Property',
      icon: '💼',
      url: 'https://www.icicilombard.com/business-insurance/sme/office-package-policy',
    },

    // ── MOTOR ────────────────────────────────────────────────────────────────
    {
      name: 'Tata AIG Comprehensive Car Insurance',
      type: 'Motor',
      desc: 'Zero depreciation car insurance with roadside assist.',
      tag: 'New Car',
      category: 'Property',
      icon: '🚗',
      url: 'https://www.tataaig.com/motor-insurance/car-insurance',
    },
    {
      name: 'HDFC Ergo Car Insurance',
      type: 'Motor',
      desc: 'Comprehensive motor with instant cashless claims.',
      tag: 'Motor Upgrade',
      category: 'Property',
      icon: '🚙',
      url: 'https://www.hdfcergo.com/car-insurance',
    },
    {
      name: 'Bajaj Allianz Two Wheeler Insurance',
      type: 'Motor',
      desc: 'Comprehensive cover for bikes and scooters.',
      tag: 'Bike',
      category: 'Property',
      icon: '🏍️',
      url: 'https://www.bajajallianz.com/two-wheeler-insurance.html',
    },
    {
      name: 'ICICI Lombard Fleet Insurance',
      type: 'Motor',
      desc: 'Commercial vehicle fleet insurance for businesses.',
      tag: 'Commercial',
      category: 'Property',
      icon: '🚛',
      url: 'https://www.icicilombard.com/business-insurance/fleet',
    },
  ]

  const filteredProducts = activeTab === 'All' ? products : products.filter(p => p.category === activeTab)

  const scrollToProducts = () => {
    document.getElementById('insurance-products')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Top bar */}
      <div className="bg-navy-dark text-white/90 py-1.5 text-xs font-medium">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5"><Phone size={10} className="text-brand-orange" />8169150113</span>
            <span className="flex items-center gap-1.5"><Mail size={10} className="text-brand-orange" /> support@saarthiai.in</span>
          </div>
          <div className="flex gap-4">
            <span className="text-green-400 flex items-center gap-1">🛡️ DPDP Act 2023 Compliant</span>
            <span className="text-white/40">|</span>
            <span>IRDAI Registered</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-white/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" alt="SaarthiAI" className="w-10 h-10 object-contain drop-shadow-md animate-pulse-slow" />
            <div className="hidden sm:block text-left font-outfit">
              <span className="text-navy text-xl font-extrabold tracking-tight">Saarthi</span>
              <span className="text-brand-orange text-xl font-extrabold tracking-tight">AI</span>
              <div className="text-gray-500 text-[11px] font-medium leading-none tracking-wide mt-0.5">SMART INSURANCE FOR EVERY FAMILY</div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#about-us" className="hover:text-brand-orange transition-colors">About Us</a>
            <button onClick={scrollToProducts} className="hover:text-brand-orange transition-colors">Insurance Products</button>
            <button onClick={() => navigate('/login')} className="hover:text-brand-orange transition-colors">Dashboard</button>
            <a href="#phone-support" className="hover:text-brand-orange transition-colors">Support</a>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 border-2 border-navy text-navy px-4 py-2 rounded-lg text-sm font-bold hover:bg-navy/5 transition-all btn-press">
              <Phone size={16} /> <a href="#phone-support">Talk to Expert</a>
            </button>

            {/* Sign In Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowLoginDropdown(v => !v)}
                className="flex items-center gap-1.5 text-gray-700 text-sm hover:text-navy font-bold btn-press px-2"
              >
                Sign in
                <ChevronDown size={14} className={`transition-transform duration-200 ${showLoginDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showLoginDropdown && (
                <div className="absolute right-0 top-12 w-56 glass rounded-2xl shadow-glass-strong border border-white/50 z-50 overflow-hidden animate-slideDown backdrop-blur-2xl">
                  <div className="bg-gradient-to-r from-navy to-navy-light px-4 py-3 border-b border-navy-light">
                    <p className="text-white text-xs font-bold font-outfit tracking-wider uppercase">Login As</p>
                  </div>
                  <button
                    onClick={() => { navigate('/login'); setShowLoginDropdown(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50/50 transition border-b border-gray-100/50 text-left"
                  >
                    <div className="w-9 h-9 bg-brand-orange/10 rounded-xl flex items-center justify-center">
                      <User size={18} className="text-brand-orange" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 font-outfit">Customer Login</p>
                      <p className="text-xs text-gray-500 font-medium">Access your dashboard</p>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      const { logOut } = await import('../firebase/auth')
                      await logOut()
                      setShowLoginDropdown(false)
                      navigate('/login?redirect=admin')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/50 transition text-left"
                  >
                    <div className="w-9 h-9 bg-navy/10 rounded-xl flex items-center justify-center">
                      <Settings size={18} className="text-navy" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 font-outfit">Admin Login</p>
                      <p className="text-xs text-gray-500 font-medium">Manage platform</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => navigate('/login')} className="btn-gradient btn-press px-6 py-2.5 rounded-xl text-sm font-bold shadow-neon-orange ml-2">
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-16 lg:py-24 border-b border-gray-100">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-orange-50 to-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-70"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-50 to-purple-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 opacity-70"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange font-semibold text-xs uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange"></span>
              </span>
              AI-Powered Insurance
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-navy font-outfit leading-[1.1] mb-6 tracking-tight">
              Let's find you<br />
              the <span className="gradient-text">Right Plan.</span>
            </h1>

            {/* ✅ FIXED: p → div to avoid div-in-p hydration error */}
            <div className="space-y-4 mb-10">
              <div className="text-gray-600 flex items-center gap-3 text-base font-medium">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-green-600" />
                </div>
                AI detects your life events automatically
              </div>
              <div className="text-gray-600 flex items-center gap-3 text-base font-medium">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-green-600" />
                </div>
                Personalized recommendations, zero spam
              </div>
              <div className="text-gray-600 flex items-center gap-3 text-base font-medium">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-green-600" />
                </div>
                DPDP 2023 compliant & Responsible AI
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button onClick={() => window.open('https://youtu.be/25rVpXAQM1M?si=_GSiwUuJcb0Kmi5r', '_blank')}
                className="btn-gradient btn-press text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-neon-orange text-base">
                See Demo <ArrowRight size={18} />
              </button>
              <button onClick={() => navigate('/login')} className="glass border-2 border-navy text-navy px-8 py-4 rounded-xl font-bold hover:bg-navy hover:text-white transition-all duration-300 btn-press text-base flex items-center gap-2">
                Get Started
              </button>
            </div>
          </div>

          {/* WhatsApp mockup */}
          <div className="flex justify-center lg:justify-end animate-fade-in-up delay-200">
            <div className="group relative glass rounded-[2rem] shadow-glass-strong border border-white p-2 w-full max-w-sm overflow-hidden transform transition-transform hover:-translate-y-2 duration-500">
              <div className="bg-white rounded-[1.5rem] overflow-hidden border border-gray-100">
                <div className="transition-all duration-500 group-hover:blur-md">
                  <div className="bg-gradient-to-r from-navy to-navy-light px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-orange rounded-full flex items-center justify-center text-white font-bold font-outfit text-lg shadow-inner">S</div>
                    <div>
                      <p className="text-white font-bold font-outfit text-base">SaarthiAI Assistant</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                        <p className="text-green-300 text-xs font-medium tracking-wide">Live — AI Agent</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#efeae2] p-5 min-h-[250px] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.4] bg-[radial-gradient(#d1c9c0_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="relative z-10 space-y-4 w-full">
                      <div className="bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-sm border border-gray-100/50 max-w-[85%]">
                        <p className="text-gray-800 text-[13px] font-medium leading-relaxed">Hi Priya! 🌟 Congratulations on your marriage!</p>
                        <p className="text-gray-600 text-[13px] mt-1.5 leading-relaxed">Family Health Coverage from ₹500/month would be perfect for your new journey together.</p>
                        <p className="text-gray-400 text-[10px] mt-2 text-right font-medium">8:00 PM <span className="text-blue-500">✓✓</span></p>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-[#dcf8c6] text-gray-800 rounded-2xl rounded-tr-sm p-3 shadow-sm text-[13px] max-w-[80%] font-medium">Yes, tell me more!
                          <div className="text-[10px] text-gray-500 text-right mt-1 w-full block">8:02 PM <span className="text-blue-500">✓✓</span></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="bg-white text-[#00a884] border border-gray-200 text-xs px-4 py-2 rounded-full font-bold shadow-sm flex items-center gap-1"><CheckCircle size={14} /> Yes, please!</button>
                        <button className="bg-white text-gray-500 border border-gray-200 text-xs px-4 py-2 rounded-full shadow-sm">Not now</button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50/80 px-4 py-2.5 border-t border-blue-100/50 flex items-center gap-2 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-brand-orange rounded-full animate-pulse"></div>
                    <p className="text-blue-700 text-[11px] font-semibold tracking-wide uppercase">Auto-triggered • Marriage Detected</p>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-navy-dark/70 backdrop-blur-md rounded-[1.5rem] m-2">
                  <div className="text-center p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="w-16 h-16 bg-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-orange/30">
                      <Lock size={32} className="text-brand-orange shadow-lg" />
                    </div>
                    <p className="text-white font-bold font-outfit text-lg mb-4">Unlock Personalized AI</p>
                    <button onClick={() => navigate('/login')} className="btn-gradient btn-press px-8 py-3 rounded-xl font-bold text-sm shadow-neon-orange w-full">
                      Sign In to Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI-Matched Insurance Plans */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="group relative bg-gradient-to-br from-navy to-navy-light rounded-[2rem] p-10 text-white shadow-glass-strong overflow-hidden transition-all duration-500 border border-white/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3"></div>
            <div className="relative z-10 transition-all duration-500 group-hover:blur-md">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner"><Lock size={36} className="text-brand-orange" /></div>
                <div>
                  <h2 className="text-3xl font-extrabold font-outfit tracking-tight flex items-center gap-3 mb-2">
                    AI-Matched Insurance Plans
                    <span className="bg-brand-orange/20 border border-brand-orange/30 text-brand-orange text-[10px] uppercase px-3 py-1 rounded-full font-bold tracking-wider">Locked</span>
                  </h2>
                  <p className="text-blue-100/80 text-base max-w-2xl font-medium">Unlock hyper-personalized coverage recommendations mapped perfectly to your life stage and financial goals.</p>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-navy-dark/80 backdrop-blur-md rounded-[2rem] m-1">
              <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="w-16 h-16 bg-brand-orange/20 mx-auto rounded-full flex items-center justify-center border border-brand-orange/30 mb-4">
                  <Lock size={32} className="text-brand-orange shadow-lg" />
                </div>
                <p className="text-white font-bold font-outfit text-xl mb-4 tracking-tight">Sign in to unlock your personalized plans</p>
                <button onClick={() => navigate('/login')} className="btn-gradient btn-press text-white px-8 py-3 rounded-xl font-bold shadow-neon-orange transition-all">
                  Sign In / Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="py-24 bg-gray-50 relative overflow-hidden" id="about-us">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/50 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold font-outfit text-navy mb-4 tracking-tight">About <span className="gradient-text">SaarthiAI</span></h2>
            <div className="w-24 h-1.5 bg-brand-orange mx-auto rounded-full opacity-80"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { Icon: Target, title: 'Our Mission', desc: 'To democratize insurance in India through AI, making the right coverage accessible to every life stage.' },
              { Icon: Users, title: 'Our Team', desc: 'A blend of insurance experts, AI researchers, and customer advocates working towards a common goal.' },
              { Icon: HeartHandshake, title: 'Our Promise', desc: 'Responsible AI, complete transparency, and always putting your consent first – DPDP 2023 compliant.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="glass card-lift rounded-[2rem] p-8 text-center border-t border-white">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-orange/10 to-brand-orange/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner transform rotate-3">
                  <Icon className="text-brand-orange transform -rotate-3" size={36} />
                </div>
                <h3 className="text-xl font-bold font-outfit text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 text-base leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold font-outfit text-navy mb-4 tracking-tight">How SaarthiAI Works</h2>
            <div className="w-24 h-1.5 bg-brand-orange mx-auto rounded-full opacity-80"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-blue-100 via-orange-100 to-red-100 transform -translate-y-1/2 -z-10 rounded-full"></div>
            {[
              { step: '1', label: 'SENSE', desc: 'Life event detected', color: 'from-blue-600 to-blue-800', shadow: 'shadow-blue-500/30', icon: '🔍' },
              { step: '2', label: 'ANALYZE', desc: 'Profile analyzed', color: 'from-teal-500 to-teal-700', shadow: 'shadow-teal-500/30', icon: '📊' },
              { step: '3', label: 'RECOMMEND', desc: 'Product matched', color: 'from-indigo-500 to-indigo-700', shadow: 'shadow-indigo-500/30', icon: '✨' },
              { step: '4', label: 'GENERATE', desc: 'Message crafted', color: 'from-orange-500 to-orange-700', shadow: 'shadow-orange-500/30', icon: '✏️' },
              { step: '5', label: 'DELIVER', desc: 'Right channel', color: 'from-red-500 to-red-700', shadow: 'shadow-red-500/30', icon: '📱' },
            ].map((s) => (
              <div key={s.label} className="relative group perspective-1000">
                <div className={`bg-gradient-to-br ${s.color} rounded-[1.5rem] p-8 text-white shadow-xl ${s.shadow} hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/20 relative z-10 flex flex-col items-center text-center`}>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center text-2xl mb-5 shadow-inner border border-white/30 transform group-hover:rotate-6 transition-transform">
                    {s.icon}
                  </div>
                  <div className="text-xs font-bold tracking-widest uppercase text-white/70 mb-1">Step {s.step}</div>
                  <div className="font-extrabold font-outfit text-xl mb-2 tracking-wide">{s.label}</div>
                  <div className="text-sm text-white/90 font-medium leading-tight">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insurance Products */}
      <section id="insurance-products" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-extrabold font-outfit text-navy mb-2 tracking-tight">Insurance Products</h2>
              <div className="w-16 h-1.5 bg-brand-orange rounded-full opacity-80 mb-6 md:mb-0"></div>
            </div>
            <div className="flex gap-2.5 flex-wrap justify-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
              {tabs.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === t ? 'bg-navy text-white shadow-md transform scale-105' : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-navy'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p, idx) => (
              <div key={p.name + idx} onClick={() => window.open(p.url, '_blank')}
                className="glass rounded-[1.5rem] p-6 border border-white hover:shadow-glass-strong transition-all duration-500 cursor-pointer group card-lift bg-white/70">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-sm border border-gray-200/50 group-hover:scale-110 transition-transform duration-500">{p.icon}</div>
                <div className="inline-block px-2.5 py-1 bg-gray-100 text-gray-500 rounded-md text-[10px] font-bold uppercase tracking-wider mb-3">{p.type}</div>
                <h3 className="font-extrabold font-outfit text-gray-900 text-lg mb-2 group-hover:text-brand-orange transition-colors duration-300 leading-tight">{p.name}</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed line-clamp-2">{p.desc}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100/50">
                  <span className="text-brand-orange font-bold text-xs flex items-center gap-1.5 bg-brand-orange/10 px-2 py-1 rounded-md"><Star size={12} fill="currentColor" /> {p.tag}</span>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-orange transition-colors duration-300">
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SaarthiAI Advantage */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold font-outfit text-navy mb-4 tracking-tight">The SaarthiAI <span className="gradient-text">Advantage</span></h2>
            <div className="w-24 h-1.5 bg-brand-orange mx-auto rounded-full opacity-80 mb-6"></div>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">When you use SaarthiAI, you get more than recommendations. You get an intelligent agent that learns from your life and protects you proactively.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { icon: '💰', title: 'Best Matched Plans', sub: 'AI-selected for you', color: 'from-green-400 to-green-600' },
              { icon: '🤝', title: 'Unbiased Advice', sub: 'Responsible AI always', color: 'from-blue-400 to-blue-600' },
              { icon: '✅', title: '100% Consent Based', sub: 'DPDP 2023 compliant', color: 'from-purple-400 to-purple-600' },
              { icon: '📞', title: 'Claims Support', sub: 'Made stress-free', color: 'from-orange-400 to-brand-orange' },
              { icon: '😊', title: 'Happy to Help', sub: 'AI + Human agents', color: 'from-red-400 to-red-600' },
            ].map((a, idx) => (
              <div key={idx} className="group relative glass card-lift bg-white rounded-[1.5rem] p-6 border border-gray-100 overflow-hidden text-center z-10">
                <div className={`absolute inset-0 bg-gradient-to-br ${a.color} opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500 -z-10`}></div>
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-gray-100">{a.icon}</div>
                <h3 className="font-bold font-outfit text-gray-900 text-lg mb-1 leading-tight">{a.title}</h3>
                <p className="text-gray-500 text-sm font-medium">{a.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold font-outfit text-navy mb-4 tracking-tight">Get in Touch</h2>
            <div className="w-24 h-1.5 bg-brand-orange mx-auto rounded-full opacity-80"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <section id="phone-support">
              <div onClick={() => navigate('/support#phone-support')} className="glass card-lift bg-white rounded-[2rem] p-10 text-center border-t border-white cursor-pointer group">
                <div className="w-20 h-20 bg-gradient-to-br from-navy/5 to-navy/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <HeadphonesIcon className="text-navy" size={36} />
                </div>
                <h3 className="text-2xl font-bold font-outfit text-gray-900 mb-2">24/7 Support</h3>
                <p className="text-gray-500 mb-6 font-medium">CALL : +91 81691 50113</p>
                <a href="tel:8169150113" onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center gap-2 bg-navy text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-navy-light transition-colors w-full">
                  Call Now <Phone size={16} />
                </a>
              </div>
            </section>
            <section id="chat-support">
              <div onClick={() => navigate('/support#chat-support')} className="glass card-lift bg-white rounded-[2rem] p-10 text-center border-t border-white cursor-pointer group relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-orange to-red-500"></div>
                <div className="w-20 h-20 bg-gradient-to-br from-brand-orange/10 to-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <MessageCircle className="text-brand-orange" size={36} />
                </div>
                <h3 className="text-2xl font-bold font-outfit text-gray-900 mb-2">Live Chat</h3>
                <p className="text-gray-500 mb-6 font-medium">Chat with our AI Assistant</p>
                <button onClick={(e) => { e.stopPropagation(); navigate('/login') }} className="btn-gradient btn-press w-full text-white px-6 py-3 rounded-xl font-bold text-sm shadow-neon-orange transition-all flex items-center justify-center gap-2">
                  Start Chat <ArrowRight size={16} />
                </button>
              </div>
            </section>
            <section id="email-support">
              <div onClick={() => navigate('/support#email-support')} className="glass card-lift bg-white rounded-[2rem] p-10 text-center border-t border-white cursor-pointer group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <Mail className="text-blue-500" size={36} />
                </div>
                <h3 className="text-2xl font-bold font-outfit text-gray-900 mb-2">Email Us</h3>
                <p className="text-gray-500 mb-6 font-medium">support@saarthiai.in</p>
                <a href="mailto:support@saarthiai.in" onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 hover:text-navy hover:border-navy px-6 py-3 rounded-xl font-bold text-sm transition-colors w-full">
                  Send Email <ArrowRight size={16} />
                </a>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-dark text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8 mb-12">
          <div className="md:col-span-1 pr-4">
            <div className="flex items-center gap-3 mb-6">
              <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" alt="SaarthiAI" className="w-10 h-10 object-contain drop-shadow-md" />
              <div className="font-outfit">
                <span className="text-white text-2xl font-extrabold tracking-tight">Saarthi</span>
                <span className="text-brand-orange text-2xl font-extrabold tracking-tight">AI</span>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6 font-medium">India's first AI-powered insurance marketing platform. Responsible, transparent, strictly user-centric.</p>
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
              <span className="text-green-300 text-xs font-bold tracking-wide uppercase">All Systems Operational</span>
            </div>
          </div>
          {[
            { title: 'Quick Links', links: ['Home', 'Features', 'Products', 'Dashboard'] },
            { title: 'Legal & Trust', links: ['Privacy Policy', 'Terms of Service', 'Consent Management', 'Opt-Out Preferences'] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-white font-bold font-outfit text-lg mb-6">{col.title}</h4>
              <div className="space-y-4">
                {col.links.map(l => <a key={l} href="#" className="block text-white/60 text-sm hover:text-brand-orange font-medium transition-colors w-max">{l}</a>)}
              </div>
            </div>
          ))}
          <div>
            <h4 className="text-white font-bold font-outfit text-lg mb-6">Contact Us</h4>
            <div className="space-y-4 mb-6">
              <a href="tel:8169150113" className="flex items-center gap-3 text-white/60 text-sm hover:text-white transition-colors"><div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-brand-orange"><Phone size={14} /></div>8169150113</a>
              <a href="mailto:support@saarthiai.in" className="flex items-center gap-3 text-white/60 text-sm hover:text-white transition-colors"><div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-brand-orange"><Mail size={14} /></div>support@saarthiai.in</a>
            </div>
            <div className="bg-gradient-to-r from-green-500/10 to-green-400/5 border border-green-500/20 p-4 rounded-[1rem]">
              <p className="text-green-400 text-sm font-bold flex items-center gap-2 mb-1">🛡️ Responsible AI Certified</p>
              <p className="text-green-300/70 text-xs font-medium">DPDP 2023 | Audited | Bias-Free</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between items-center text-xs text-white/40 gap-4 font-medium">
            <span>© 2026 SaarthiAI. All Rights Reserved. IRDAI Registered.</span>
            <div className="flex gap-4">
              <span>Responsible AI Certified</span>
              <span>•</span>
              <span>DPDP Act 2023 Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}