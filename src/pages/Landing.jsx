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

  const products = [
    { name: '30 Year Term Insurance Plan', type: 'Term Life', desc: '30 year term life cover for young families.', tag: 'Marriage', category: 'Life', icon: '🛡️', url: 'https://www.canarahsbclife.com/term-insurance/30-year-term-insurance-plan' },
    { name: 'iProtect Smart Term Plan', type: 'Term Life', desc: '20 year term with critical illness rider.', tag: 'Marriage', category: 'Life', icon: '👨‍👩‍👧', url: 'https://www.bajajallianzlife.com/term-insurance/iprotect-smart-term-plan.jsp' },
    { name: 'YoungStar Unit Linked Plan', type: 'Child Plan', desc: 'Unit linked plan for higher education goals.', tag: 'New Baby', category: 'Life', icon: '🎓', url: 'https://lifeinsurance.pnbmetlife.com/child-insurance-plans/youngstar-unit-linked-plan' },
    { name: 'Future Child Insurance Plan', type: 'Child Plan', desc: 'Milestone payouts for education needs.', tag: 'New Baby', category: 'Life', icon: '📚', url: 'https://www.tataaia.com/life-insurance-plans/child-plans/future-child-plan.html' },
    { name: 'IncomeSecure', type: 'Term Life', desc: 'Replace your income for 40 years with high coverage.', tag: 'Income Protection', category: 'Life', icon: '💰', url: 'https://www.posb.com.sg/personal/insurance/endowment/income-stream-plans/manulife-incomesecure' },
    { name: 'Mortgage Protection Plan', type: 'Term Life', desc: 'Ensure your home loan never becomes a burden.', tag: 'Home Loan', category: 'Life', icon: '🏠', url: 'https://www.hsbc.com.hk/insurance/products/life/mortgage-protection/' },
    { name: 'Wealth Assure App', type: 'ULIP', desc: 'Market-linked growth with life cover.', tag: 'Wealth Creation', category: 'Life', icon: '📈', url: 'https://play.google.com/store/apps/details?id=com.wealthassure.wealthassureapp' },
    { name: 'Immediate & Deferred Annuity Plan', type: 'Annuity', desc: 'Start building your retirement corpus today.', tag: 'Retirement', category: 'Life', icon: '🌴', url: 'https://www.iciciprulife.com/retirement-plans/immediate-deferred-annuity-plan.html' },
    { name: 'Health AdvantEdge', type: 'Health', desc: 'Comprehensive hospitalisation coverage.', tag: 'Health Change', category: 'Health', icon: '❤️', url: 'https://www.religarehealthinsurance.com/health-insurance-plans/health-advantedge' },
    { name: 'Wealth Assure App', type: 'Health', desc: 'Health plan with wellness rewards.', tag: 'New Baby', category: 'Health', icon: '💊', url: 'https://play.google.com/store/apps/details?id=com.wealthassure.wealthassureapp' },
    { name: 'Critical Illness Insurance', type: 'Health', desc: 'Lump sum payout on 30 critical illnesses.', tag: 'Critical Care', category: 'Health', icon: '⚠️', url: 'https://www.axismaxlife.com/term-insurance-plans/critical-illness' },
    { name: 'Health Insurance for Senior Citizens', type: 'Health', desc: 'Tailored health cover for ages 60+.', tag: 'Senior Care', category: 'Health', icon: '👴', url: 'https://www.hdfclife.com/health-insurance-plans/health-insurance-for-senior-citizens' },
    { name: 'Maternity Cover', type: 'Health', desc: 'Complete maternity and newborn coverage.', tag: 'Pregnancy', category: 'Health', icon: '👶', url: 'https://www.nivaanlife.com/health-insurance/maternity-cover' },
    { name: 'Super Health Plus Top Up', type: 'Health', desc: 'Extra cover over your base policy.', tag: 'Top Up', category: 'Health', icon: '➕', url: 'https://www.adityabirlahealth.com/healthinsurance/super-health-topup' },
    { name: 'Home Insurance Policy', type: 'Home Insurance', desc: 'Standard home structure protection.', tag: 'Home Purchase', category: 'Property', icon: '🏠', url: 'https://www.hdfcergo.com/home-insurance/home-insurance-policy' },
    { name: 'HomeShield Pro', type: 'Home Insurance', desc: 'Premium cover for high value homes.', tag: 'Home Purchase', category: 'Property', icon: '🏡', url: 'https://www.tp-link.com/us/homeshield/' },
    { name: 'Group Tenant Insurance', type: 'Renters', desc: 'Protect your belongings as a tenant.', tag: 'Rental', category: 'Property', icon: '🔑', url: 'https://www.thepersonal.com/insurance/home-insurance/coverage/tenant.html' },
    { name: 'Landlord Insurance', type: 'Landlord', desc: 'Coverage for rental income and property damage.', tag: 'Landlord', category: 'Property', icon: '🏢', url: 'https://www.sbi-general.in/landlord-insurance' },
    { name: 'Shopkeeper Insurance Policy', type: 'Shop Insurance', desc: 'Cover your shop inventory and premises.', tag: 'Business', category: 'Property', icon: '🏪', url: 'https://www.bajajallianz.com/shopkeeper-insurance-policy.html' },
    { name: 'Office Package Policy', type: 'Office', desc: 'All-risk cover for office equipment.', tag: 'Office', category: 'Property', icon: '💼', url: 'https://www.icicilombard.com/business-insurance/sme/office-package-policy' },
    { name: 'Golden Years Pension Plan', type: 'Retirement', desc: 'Long term corpus builder with annuity.', tag: 'Retirement', category: 'Retirement', icon: '🌅', url: 'https://www.sbilife.co.in/en/pension-plans/golden-years-pension-plan' },
    { name: 'Future Income Plan', type: 'Retirement', desc: 'Guaranteed income streams post retirement.', tag: 'Retirement', category: 'Retirement', icon: '💰', url: 'https://www.exideinsurance.com/exide-life-future-income-plan' },
    { name: 'Pension Plus Plan', type: 'Retirement', desc: 'Flexible contribution pension plan.', tag: 'Pension', category: 'Retirement', icon: '📉', url: 'https://www.maxlifeinsurance.com/pension-plans/pension-plus-plan' },
    { name: 'Guaranteed Annuity Plan', type: 'Retirement', desc: 'Lifetime guaranteed income.', tag: 'Annuity', category: 'Retirement', icon: '🔄', url: 'https://www.canarahsbclife.com/retirement-plans/guaranteed-annuity-plan' },
    { name: 'NPS Pension Plan', type: 'Retirement', desc: 'Equity-oriented NPS plan for higher returns.', tag: 'NPS', category: 'Retirement', icon: '⚡', url: 'https://www.hdfclife.com/retirement-plans/nps-pension-plan' },
    { name: 'Motor Insurance Policy', type: 'Motor', desc: 'Basic motor insurance with third party cover.', tag: 'New Car', category: 'Property', icon: '🚗', url: 'https://www.bharti-axagi.co.in/motor-insurance' },
    { name: 'Comprehensive Car Insurance', type: 'Motor', desc: 'Comprehensive motor with zero depreciation.', tag: 'Motor Upgrade', category: 'Property', icon: '🚙', url: 'https://www.tataaig.com/motor-insurance/car-insurance' },
    { name: 'Two Wheeler Insurance', type: 'Motor', desc: 'Cover for bikes and scooters.', tag: 'Bike', category: 'Property', icon: '🏍️', url: 'https://www.bajajallianz.com/two-wheeler-insurance.html' },
    { name: 'Fleet Insurance Policy', type: 'Motor', desc: 'Cover for commercial vehicle fleets.', tag: 'Commercial', category: 'Property', icon: '🚛', url: 'https://www.icicilombard.com/business-insurance/fleet' },
  ]

  const filteredProducts = activeTab === 'All' ? products : products.filter(p => p.category === activeTab)

  const scrollToProducts = () => {
    document.getElementById('insurance-products')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Top bar */}
      <div className="bg-[#0B1F4B] text-white py-1.5 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex gap-6">
            <span className="flex items-center gap-1"><Phone size={10} />8169150113</span>
            <span className="flex items-center gap-1"><Mail size={10} /> support@saarthiai.in</span>
          </div>
          <div className="flex gap-4">
            <span className="text-green-300">🛡️ DPDP Act 2023 Compliant</span>
            <span>| IRDAI Registered</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" alt="SaarthiAI Logo" className="w-9 h-9 object-contain" />
            <div>
              <span className="text-[#0B1F4B] text-lg font-bold">Saarthi</span>
              <span className="text-[#FF6B00] text-lg font-bold">AI</span>
              <div className="text-gray-400 text-xs leading-none">Smart Insurance for Every Family</div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#about-us" className="hover:text-[#FF6B00] font-medium">About Us</a>
            <button onClick={scrollToProducts} className="hover:text-[#FF6B00] font-medium">Insurance Products</button>
            <button onClick={() => navigate('/login')} className="hover:text-[#FF6B00] font-medium">Dashboard</button>
            <a href="#phone-support" className="hover:text-[#FF6B00] font-medium">Support</a>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 border border-[#0B1F4B] text-[#0B1F4B] px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-50">
              <Phone size={14} /> <a href="#phone-support">Talk to Expert</a>
            </button>

            {/* ✅ Sign In Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowLoginDropdown(v => !v)}
                className="flex items-center gap-1.5 text-gray-600 text-sm hover:text-[#0B1F4B] font-medium"
              >
                Sign in
                <ChevronDown size={14} className={`transition-transform duration-200 ${showLoginDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showLoginDropdown && (
                <div className="absolute right-0 top-10 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="bg-[#0B1F4B] px-4 py-2">
                    <p className="text-white text-xs font-semibold">Login As</p>
                  </div>
                  <button
                    onClick={() => { navigate('/login'); setShowLoginDropdown(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition text-left border-b border-gray-100"
                  >
                    <div className="w-8 h-8 bg-[#FF6B00]/10 rounded-full flex items-center justify-center">
                      <User size={16} className="text-[#FF6B00]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Customer Login</p>
                      <p className="text-xs text-gray-400">Access your dashboard</p>
                    </div>
                  </button>
                  <button
                   onClick={async () => {
  const { logOut } = await import('../firebase/auth')
  await logOut()
  setShowLoginDropdown(false)
  navigate('/login?redirect=admin')
}}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left"
                  >
                    <div className="w-8 h-8 bg-[#0B1F4B]/10 rounded-full flex items-center justify-center">
                      <Settings size={16} className="text-[#0B1F4B]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Admin Login</p>
                      <p className="text-xs text-gray-400">Manage platform</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => navigate('/login')} className="bg-[#FF6B00] text-white px-5 py-2 rounded text-sm font-bold hover:bg-orange-600">
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-gray-500 text-sm mb-2">AI-Powered Insurance Marketing</p>
            <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
              Let's find you<br />
              the <span className="text-[#0B1F4B]">Right Insurance</span>
            </h1>
            <p className="text-gray-600 mb-2 flex items-center gap-2 text-sm"><CheckCircle size={16} className="text-green-500" /> AI detects your life events automatically</p>
            <p className="text-gray-600 mb-2 flex items-center gap-2 text-sm"><CheckCircle size={16} className="text-green-500" /> Personalized recommendations, no spam</p>
            <p className="text-gray-600 mb-6 flex items-center gap-2 text-sm"><CheckCircle size={16} className="text-green-500" /> DPDP 2023 compliant & Responsible AI</p>
            <div className="flex gap-3">
              <button onClick={() => window.open('https://youtu.be/25rVpXAQM1M?si=_GSiwUuJcb0Kmi5r', '_blank')}
               className="bg-[#FF6B00] text-white px-8 py-3 rounded font-bold hover:bg-orange-600 flex items-center gap-2">
                See Demo <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate('/login')} className="border-2 border-[#0B1F4B] text-[#0B1F4B] px-8 py-3 rounded font-bold hover:bg-gray-50">
                Get Started
              </button>
            </div>
          </div>

          {/* WhatsApp mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="group relative bg-white rounded-2xl shadow-xl border border-gray-200 w-80 overflow-hidden">
              <div className="transition-all duration-300 group-hover:blur-sm">
                <div className="bg-[#0B1F4B] px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#FF6B00] rounded-full flex items-center justify-center text-white font-bold text-sm">S</div>
                  <div>
                    <p className="text-white font-semibold text-sm">SaarthiAI Assistant</p>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      <p className="text-green-300 text-xs">Live — AI Agent</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 space-y-3 min-h-48">
                  <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-sm border border-gray-100">
                    <p className="text-gray-800 text-sm font-medium">Hi Priya! 🌟 Congratulations on your marriage!</p>
                    <p className="text-gray-500 text-xs mt-1">Family Health Coverage from ₹500/month would be perfect for your new journey together.</p>
                    <p className="text-gray-400 text-xs mt-2 text-right">8:00 PM ✓✓</p>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-[#0B1F4B] text-white rounded-xl rounded-tr-none p-2.5 text-sm">Yes, tell me more!</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-[#FF6B00] text-white text-xs px-4 py-2 rounded-full font-medium">Yes, please!</button>
                    <button className="border border-gray-300 text-gray-500 text-xs px-4 py-2 rounded-full">Not now</button>
                  </div>
                </div>
                <div className="bg-blue-50 px-4 py-2 border-t border-blue-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full"></div>
                  <p className="text-blue-700 text-xs">Auto-triggered | Marriage Detected | 8:00 PM</p>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#0B1F4B]/80 backdrop-blur-sm rounded-2xl">
                <div className="text-center p-4">
                  <Lock size={40} className="mx-auto text-[#FF6B00] mb-3" />
                  <p className="text-white font-semibold mb-3">Sign in to unlock personalized conversations</p>
                  <button onClick={() => navigate('/login')} className="bg-[#FF6B00] text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-orange-600 transition shadow-lg">
                    Sign In / Sign Up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI-Matched Insurance Plans */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="group relative bg-gradient-to-br from-[#0B1F4B] to-[#1a2f5a] rounded-2xl p-8 text-white shadow-lg overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF6B00] opacity-10 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
            <div className="relative transition-all duration-300 group-hover:blur-sm">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm"><Lock size={32} className="text-[#FF6B00]" /></div>
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    AI-Matched Insurance Plans
                    <span className="bg-[#FF6B00] text-xs px-2 py-1 rounded-full font-normal">Locked</span>
                  </h2>
                  <p className="text-blue-100 mt-1 max-w-xl">Personalized recommendations based on your life events.</p>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#0B1F4B]/80 backdrop-blur-sm rounded-2xl">
              <div className="text-center">
                <Lock size={40} className="mx-auto text-[#FF6B00] mb-3" />
                <p className="text-white font-semibold mb-3">Sign in to unlock personalized plans</p>
                <button onClick={() => navigate('/login')} className="bg-[#FF6B00] text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-orange-600 transition shadow-lg">
                  Sign In / Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </section> 

      {/* About Us */}
      <section className="py-16 bg-gray-50" id="about-us">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">About <span className="text-[#FF6B00]">SaarthiAI</span></h2>
            <div className="w-20 h-1 bg-[#FF6B00] mx-auto rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { Icon: Target, title: 'Our Mission', desc: 'To democratize insurance in India through AI, making the right coverage accessible to every life stage.' },
              { Icon: Users, title: 'Our Team', desc: 'A blend of insurance experts, AI researchers, and customer advocates working towards a common goal.' },
              { Icon: HeartHandshake, title: 'Our Promise', desc: 'Responsible AI, complete transparency, and always putting your consent first – DPDP 2023 compliant.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition text-center">
                <div className="w-16 h-16 bg-[#0B1F4B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-[#FF6B00]" size={32} />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">How SaarthiAI Works</h2>
            <div className="w-20 h-1 bg-[#FF6B00] mx-auto rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              { step: '1', label: 'SENSE', desc: 'Life event detected', color: 'from-blue-500 to-blue-600', icon: '🔍' },
              { step: '2', label: 'ANALYZE', desc: 'Profile analyzed', color: 'from-teal-500 to-teal-600', icon: '📊' },
              { step: '3', label: 'RECOMMEND', desc: 'Product matched', color: 'from-purple-500 to-purple-600', icon: '✨' },
              { step: '4', label: 'GENERATE', desc: 'Message crafted', color: 'from-orange-500 to-orange-600', icon: '✉️' },
              { step: '5', label: 'DELIVER', desc: 'Right channel', color: 'from-red-500 to-red-600', icon: '📱' },
            ].map((s, i) => (
              <div key={s.label} className="relative group">
                <div className={`bg-gradient-to-br ${s.color} rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
                  <div className="text-4xl mb-3">{s.icon}</div>
                  <div className="text-2xl font-bold mb-1">{s.step}</div>
                  <div className="font-bold text-lg mb-1">{s.label}</div>
                  <div className="text-sm opacity-90">{s.desc}</div>
                </div>
                {i < 4 && <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10"><ArrowRight size={24} className="text-gray-300" /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insurance Products */}
      <section id="insurance-products" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Insurance Products</h2>
            <div className="flex gap-2 flex-wrap">
              {tabs.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition border ${activeTab === t ? 'bg-[#0B1F4B] text-white border-[#0B1F4B]' : 'bg-white text-gray-600 border-gray-300 hover:border-[#0B1F4B]'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p, idx) => (
              <div key={p.name + idx} onClick={() => window.open(p.url, '_blank')}
                className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-xl hover:border-orange-200 transition-all duration-300 cursor-pointer group">
                <div className="text-3xl mb-3">{p.icon}</div>
                <p className="text-gray-400 text-xs mb-1">{p.type}</p>
                <h3 className="font-semibold text-gray-800 text-base mb-2 group-hover:text-[#FF6B00] transition">{p.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{p.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[#FF6B00] text-xs flex items-center gap-1"><Star size={12} fill="#FF6B00" /> {p.tag}</span>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-[#FF6B00] transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SaarthiAI Advantage */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">SaarthiAI <span className="text-[#FF6B00]">Advantage</span></h2>
            <div className="w-20 h-1 bg-[#FF6B00] mx-auto rounded mb-4"></div>
            <p className="text-gray-500 max-w-2xl mx-auto">When you use SaarthiAI, you get more than recommendations. You get an intelligent agent that learns from your life and protects you proactively.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { icon: '💰', title: 'Best Matched Plans', sub: 'AI-selected for you', color: 'from-green-400 to-green-500' },
              { icon: '🤝', title: 'Unbiased Advice', sub: 'Responsible AI always', color: 'from-blue-400 to-blue-500' },
              { icon: '✅', title: '100% Consent Based', sub: 'DPDP 2023 compliant', color: 'from-purple-400 to-purple-500' },
              { icon: '📞', title: 'Claims Support', sub: 'Made stress-free', color: 'from-orange-400 to-orange-500' },
              { icon: '😊', title: 'Happy to Help', sub: 'AI + Human agents', color: 'from-red-400 to-red-500' },
            ].map((a, idx) => (
              <div key={idx} className="group relative bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className={`absolute inset-0 bg-gradient-to-br ${a.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity`}></div>
                <div className="text-4xl mb-3">{a.icon}</div>
                <h3 className="font-bold text-gray-800 text-base mb-1">{a.title}</h3>
                <p className="text-gray-500 text-sm">{a.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Get in Touch</h2>
            <div className="w-20 h-1 bg-[#FF6B00] mx-auto rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <section id="phone-support">
              <div onClick={() => navigate('/support#phone-support')} className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group text-center">
                <div className="w-16 h-16 bg-[#0B1F4B]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <HeadphonesIcon className="text-[#FF6B00]" size={32} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">24/7 Support</h3>
                <p className="text-gray-500 text-sm mb-4">CALL : +91 81691 50113</p>
                <a href="tel:8169150113" onClick={(e) => e.stopPropagation()} className="text-[#FF6B00] font-medium text-sm inline-flex items-center justify-center gap-1 hover:underline">
                  Call Now <Phone size={14} />
                </a>
              </div>
            </section>
            <section id="chat-support">
              <div onClick={() => navigate('/support#chat-support')} className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group text-center">
                <div className="w-16 h-16 bg-[#0B1F4B]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <MessageCircle className="text-[#FF6B00]" size={32} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">Live Chat</h3>
                <p className="text-gray-500 text-sm mb-4">Chat with our AI</p>
                <button onClick={(e) => { e.stopPropagation(); navigate('/login') }} className="text-[#FF6B00] font-medium text-sm inline-flex items-center justify-center gap-1 hover:underline">
                  Start Chat <ArrowRight size={14} />
                </button>
              </div>
            </section>
            <section id="email-support">
              <div onClick={() => navigate('/support#email-support')} className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group text-center">
                <div className="w-16 h-16 bg-[#0B1F4B]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Mail className="text-[#FF6B00]" size={32} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">Email Us</h3>
                <p className="text-gray-500 text-sm mb-4">Write to us at support@saarthiai.in</p>
                <a href="mailto:support@saarthiai.in" onClick={(e) => e.stopPropagation()} className="text-[#FF6B00] font-medium text-sm inline-flex items-center justify-center gap-1 hover:underline">
                  Send Email <ArrowRight size={14} />
                </a>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" alt="SaarthiAI Logo" className="w-8 h-8 object-contain" />
              <span className="text-[#0B1F4B] font-bold text-lg">Saarthi<span className="text-[#FF6B00]">AI</span></span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">India's first AI-powered insurance marketing platform. Responsible, transparent, user-centric.</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-600 text-xs">All Systems Operational</span>
            </div>
          </div>
          {[
            { title: 'Quick Links', links: ['Home', 'Features', 'Products', 'Dashboard'] },
            { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Consent Management', 'Opt-Out'] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-gray-700 font-semibold mb-3 text-sm">{col.title}</h4>
              {col.links.map(l => <a key={l} href="#" className="block text-gray-400 text-xs hover:text-[#FF6B00] mb-2 transition">{l}</a>)}
            </div>
          ))}
          <div>
            <h4 className="text-gray-700 font-semibold mb-3 text-sm">Contact</h4>
            <div className="space-y-2">
              <p className="text-gray-400 text-xs flex items-center gap-2"><Phone size={12} className="text-[#FF6B00]" />8169150113</p>
              <p className="text-gray-400 text-xs flex items-center gap-2"><Mail size={12} className="text-[#FF6B00]" />support@saarthiai.in</p>
            </div>
            <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-xs font-semibold">🛡️ Responsible AI Certified</p>
              <p className="text-green-500 text-xs">DPDP 2023 | Audited | Bias-Free</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-8 pt-4">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between text-xs text-gray-400 gap-2">
            <span>© 2026 SaarthiAI | All Rights Reserved | IRDAI Registered</span>
            <span>Responsible AI Certified | DPDP Act 2023 Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  )
}