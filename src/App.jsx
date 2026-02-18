import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import CustomerDashboard from './pages/CustomerDashboard'
import AgentDashboard from './pages/AgentDashboard'
import ChatAgent from './pages/ChatAgent'
import Settings from './pages/Settings'
import AdminPanel from './pages/AdminPanel'

// Components
import ConsentModal from './components/ConsentModal'

function ProtectedRoute({ children, adminOnly, agentOnly }) {
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

  // Wait for profile to load before checking roles
  if ((adminOnly || agentOnly) && !userProfile) return (
    <div className="min-h-screen bg-[#0B1F4B] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )

  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  if (agentOnly && !isAgent) return <Navigate to="/dashboard" replace />

  return children
}

export default function App() {
  const { consentGiven } = useAuth()

  return (
    <BrowserRouter>
      {!consentGiven && <ConsentModal />}

      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected — Customer */}
        <Route path="/onboarding" element={
          <ProtectedRoute><Onboarding /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><CustomerDashboard /></ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute><ChatAgent /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><Settings /></ProtectedRoute>
        } />

        {/* Protected — Agent */}
        <Route path="/agent" element={
          <ProtectedRoute agentOnly><AgentDashboard /></ProtectedRoute>
        } />

        {/* Protected — Admin */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}