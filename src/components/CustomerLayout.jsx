// src/layouts/CustomerLayout.jsx
import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MessageCircle, Shield, GitCompare,
  TrendingUp, Users, User, Settings, HelpCircle,
  LogOut, ChevronLeft, ChevronRight, Bell, FileText, Calculator, ShieldAlert, Star,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { logOut } from '../firebase/auth'

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/chat', icon: MessageCircle, label: 'AI Chat' },
  { path: '/my-policies', icon: Shield, label: 'My Policies' },
  { path: '/calculator', icon: Calculator, label: 'Premium Calculator' },
  { path: '/claims', icon: FileText, label: 'Claims' },
  { path: '/compare', icon: GitCompare, label: 'Compare Plans' },
  { path: '/risk-assessment', icon: TrendingUp, label: 'Risk Assessment' },
  { path: '/family', icon: Users, label: 'Family Manager' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/testimonials', icon: Star, label: 'Testimonials' },
  { path: '/help', icon: HelpCircle, label: 'Help Center' },
]

export default function CustomerLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { userProfile, user } = useAuth()
  const { unreadCount } = useNotifications()

  const firstName = userProfile?.displayName?.split(' ')[0] || 'User'

  const handleSignOut = async () => {
    await logOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── TOP NAV ─────────────────────────────────────────────────── */}
      <nav className="bg-[#0B1F4B] px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" alt="logo" className="w-8 h-8" />
          <span className="text-white font-bold text-lg">
            Saarthi<span className="text-[#FF6B00]">AI</span>
          </span>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-3">
          <button className="relative text-white/70 hover:text-white transition" onClick={() => navigate('/notifications')}>
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6B00] rounded-full text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
          <button onClick={handleSignOut} className="text-white/60 hover:text-white transition">
            <LogOut size={20} />
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="w-9 h-9 bg-[#FF6B00] rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden hover:ring-2 hover:ring-[#FF6B00]/30 transition-all btn-press shadow-md"
            title="View Profile"
          >
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              firstName[0]?.toUpperCase()
            )}
          </button>
        </div>
      </nav>

      {/* ── BODY: SIDEBAR + CONTENT ──────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ── */}
        <aside className={`
          bg-white border-r border-gray-100 shadow-sm
          flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-56'}
          sticky top-[56px] h-[calc(100vh-56px)] z-40
        `}>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition z-50"
          >
            {collapsed
              ? <ChevronRight size={12} className="text-gray-500" />
              : <ChevronLeft size={12} className="text-gray-500" />
            }
          </button>

          {/* Nav items */}
          <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={collapsed ? item.label : ''}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-sm font-medium
                    transition-all duration-200 relative group
                    ${active
                      ? 'bg-orange-50 text-[#FF6B00] border-r-2 border-[#FF6B00]'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-[#0B1F4B]'
                    }
                  `}
                >
                  <item.icon size={20} className={`flex-shrink-0 ${active ? 'text-[#FF6B00]' : ''}`} />

                  {/* Label — hidden when collapsed */}
                  <span className={`transition-all duration-200 whitespace-nowrap overflow-hidden ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                    {item.label}
                  </span>

                  {/* Tooltip when collapsed */}
                  {collapsed && (
                    <div className="absolute left-14 bg-[#0B1F4B] text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              )
            })}

            {/* Admin Panel Link (Visible only to admins) */}
            {userProfile?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                title={collapsed ? 'Admin Panel' : ''}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-sm font-bold
                  transition-all duration-200 relative group mt-4 border-t border-gray-50 pt-6
                  text-red-600 hover:bg-red-50 hover:text-red-700
                `}
              >
                <ShieldAlert size={20} className="flex-shrink-0" />
                {!collapsed && <span>Admin Panel</span>}
                {collapsed && (
                  <div className="absolute left-14 bg-red-600 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    Admin Panel
                  </div>
                )}
              </button>
            )}
          </nav>

          {/* Bottom user info */}
          {!collapsed && (
            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-xs font-semibold text-gray-800 truncate">{userProfile?.displayName || 'Customer'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || user?.phoneNumber || ''}</p>
              <span className="inline-block mt-1 text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
                ● Active
              </span>
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-56px)]">
          <Outlet />
        </main>

      </div>
    </div>
  )
}