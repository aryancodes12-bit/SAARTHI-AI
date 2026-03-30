import { useNavigate } from 'react-router-dom'
import { Shield, Phone, ChevronRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="glass border-b border-white/40 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-3 transition-transform hover:scale-105 btn-press">
          <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" alt="SaarthiAI" className="w-10 h-10 object-contain drop-shadow-md" />
          <div className="text-left font-outfit">
            <span className="text-[#0B1F4B] text-xl font-bold tracking-tight">saarthi</span>
            <span className="text-[#FF6B00] text-xl font-bold tracking-tight">ai</span>
            <div className="text-gray-500 text-[11px] font-medium leading-none tracking-wide mt-0.5">HAR CUSTOMER HOGA INSURED</div>
          </div>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <button className="hover:text-brand-orange transition-colors flex items-center gap-1 group">
            Insurance Products <ChevronRight size={14} className="rotate-90 text-gray-400 group-hover:text-brand-orange transition-colors" />
          </button>
          {user && (
            <button onClick={() => navigate('/dashboard')} className="hover:text-brand-orange transition-colors">
              Dashboard
            </button>
          )}
          <button onClick={() => navigate('/support')} className="hover:text-brand-orange transition-colors">Support</button>
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center gap-4">
          <button className="flex items-center gap-2 border-2 border-navy text-navy px-4 py-2 rounded-lg text-sm font-bold hover:bg-navy/5 transition-all btn-press">
            <Phone size={16} /> Talk to Expert
          </button>
          {user ? (
            <button onClick={() => navigate('/dashboard')}
              className="btn-gradient btn-press px-6 py-2 rounded-lg text-sm font-bold">
              My Dashboard
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="text-gray-600 font-semibold text-sm hover:text-navy transition-colors">Sign in</button>
              <button onClick={() => navigate('/login')} className="btn-gradient btn-press px-6 py-2 rounded-lg text-sm font-bold">
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X size={24} className="text-navy" /> : <Menu size={24} className="text-navy" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white/90 backdrop-blur-xl border-t border-gray-100 px-6 py-5 space-y-4 shadow-xl">
          <button className="block w-full text-left text-gray-800 py-2 hover:text-brand-orange text-base font-semibold transition-colors">Insurance Products</button>
          {user && <button onClick={() => { navigate('/dashboard'); setMobileOpen(false) }} className="block w-full text-left text-gray-800 py-2 hover:text-brand-orange text-base font-semibold transition-colors">Dashboard</button>}
          <button onClick={() => { navigate('/support'); setMobileOpen(false) }} className="block w-full text-left text-gray-800 py-2 hover:text-brand-orange text-base font-semibold transition-colors">Support</button>
          <div className="pt-2 border-t border-gray-100">
            <button onClick={() => navigate('/login')} className="w-full btn-gradient btn-press py-3 rounded-xl text-sm font-bold shadow-lg">
              {user ? 'Go to Dashboard' : 'Get Started'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}