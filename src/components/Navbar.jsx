import { useNavigate } from 'react-router-dom'
import { Shield, Phone, ChevronRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#0B1F4B] rounded-lg flex items-center justify-center">
            <Shield className="text-[#FF6B00]" size={20} />
          </div>
          <div>
            <span className="text-[#0B1F4B] text-lg font-bold">saarthi</span>
            <span className="text-[#FF6B00] text-lg font-bold">ai</span>
            <div className="text-gray-400 text-xs leading-none">HAR CUSTOMER HOGA INSURED</div>
          </div>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <button className="hover:text-[#FF6B00] font-medium flex items-center gap-1">
            Insurance Products <ChevronRight size={14} className="rotate-90" />
          </button>
          {user && (
            <button onClick={() => navigate('/dashboard')} className="hover:text-[#FF6B00] font-medium">
              Dashboard
            </button>
          )}
          <button onClick={() => navigate('/support')} className="hover:text-[#FF6B00] font-medium">Support</button>
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center gap-3">
          <button className="flex items-center gap-1 border border-[#0B1F4B] text-[#0B1F4B] px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-50">
            <Phone size={14} /> Talk to Expert
          </button>
          {user ? (
            <button onClick={() => navigate('/dashboard')}
              className="bg-[#0B1F4B] text-white px-5 py-2 rounded text-sm font-bold hover:bg-navy-light">
              My Dashboard
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="text-gray-600 text-sm hover:text-[#0B1F4B]">Sign in</button>
              <button onClick={() => navigate('/login')} className="bg-[#FF6B00] text-white px-5 py-2 rounded text-sm font-bold hover:bg-orange-600">
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden" onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3">
          <button className="block w-full text-left text-gray-700 py-2 hover:text-[#FF6B00] text-sm font-medium">Insurance Products</button>
          {user && <button onClick={() => { navigate('/dashboard'); setMobileOpen(false) }} className="block w-full text-left text-gray-700 py-2 hover:text-[#FF6B00] text-sm font-medium">Dashboard</button>}
          <button onClick={() => { navigate('/support'); setMobileOpen(false) }} className="block w-full text-left text-gray-700 py-2 hover:text-[#FF6B00] text-sm font-medium">Support</button>
          <button onClick={() => navigate('/login')} className="w-full bg-[#FF6B00] text-white py-2.5 rounded-lg text-sm font-bold">
            {user ? 'Go to Dashboard' : 'Get Started'}
          </button>
        </div>
      )}
    </nav>
  )
}