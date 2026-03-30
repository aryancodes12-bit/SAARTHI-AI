// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Layout
import CustomerLayout from './components/CustomerLayout'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Support from './pages/Support'

// Customer Pages
import CustomerDashboard from './pages/CustomerDashboard'
import ChatAgent from './pages/ChatAgent'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import PolicyCompare from './pages/PolicyCompare'
import MyPolicies from './pages/MyPolicies'
import PolicyDetail from './pages/PolicyDetail'
import FamilyManager from './pages/FamilyManager'
import RiskAssessment from './pages/RiskAssessment'
import Notifications from './pages/Notifications'
import PremiumCalculator from './pages/PremiumCalculator'
import ClaimsTracker from './pages/ClaimsTracker'
import HelpCenter from './pages/HelpCenter'
import Testimonials from './pages/Testimonials'

// Agent & Admin
import AgentDashboard from './pages/AgentDashboard'
import AdminPanel from './pages/AdminPanel'

// Components
import ConsentModal from './components/ConsentModal'

// ─── Protected Route ─────────────────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly, agentOnly, skipOnboardingCheck = false }) {
  const { user, userProfile, loading, isAdmin, isAgent } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-[#0B1F4B] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-sm">Loading SaarthiAI...</p>
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (!userProfile) return (
    <div className="min-h-screen bg-[#0B1F4B] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  if (!skipOnboardingCheck && !userProfile.onboardingComplete && userProfile.role === 'customer') {
    return <Navigate to="/onboarding" replace />
  }

  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  if (agentOnly && !isAgent) return <Navigate to="/dashboard" replace />

  return children
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { consentGiven } = useAuth()

  return (
    <BrowserRouter>
      {!consentGiven && <ConsentModal />}

      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/support" element={<Support />} />

        {/* ── Onboarding (protected, skip onboarding check) ── */}
        <Route path="/onboarding" element={
          <ProtectedRoute skipOnboardingCheck>
            <Onboarding />
          </ProtectedRoute>
        } />

        {/* ── Customer Routes — all share CustomerLayout (sidebar + topnav) ── */}
        <Route element={
          <ProtectedRoute>
            <CustomerLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/chat" element={<ChatAgent />} />
          <Route path="/my-policies" element={<MyPolicies />} />
          <Route path="/policy/:id" element={<PolicyDetail />} />
          <Route path="/compare" element={<PolicyCompare />} />
          <Route path="/risk-assessment" element={<RiskAssessment />} />
          <Route path="/family" element={<FamilyManager />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/calculator" element={<PremiumCalculator />} />
          <Route path="/claims" element={<ClaimsTracker />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/testimonials" element={<Testimonials />} />
        </Route>

        {/* ── Agent ── */}
        <Route path="/agent" element={
          <ProtectedRoute agentOnly>
            <AgentDashboard />
          </ProtectedRoute>
        } />

        {/* ── Admin ── */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminPanel />
          </ProtectedRoute>
        } />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}