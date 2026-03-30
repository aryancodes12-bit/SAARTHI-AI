// src/pages/AdminPanel.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Users, MessageCircle, Zap, LogOut, RefreshCw, Send, Database, FileText, Download, Paperclip } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { logOut } from '../firebase/auth'
import { getAllUsers, getChatHistory, getAllPolicies, deletePolicy, deletePolicies, seedPolicies, deleteAllPolicies } from '../firebase/firestore'
import { getSMSLogs, sendRecommendationSMS } from '../utils/smsSender'
import { doc, setDoc, updateDoc, serverTimestamp, collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import { sendWhatsApp, sendSMS, logNotification } from '../utils/notificationService'

// SEED_PLANS moved to firestore.js

// ─── Intent Score ─────────────────────────────────────────────────────────────
function calcIntentScore(user) {
  const uid = user.id || user.uid || 'x'
  let seed = 0
  for (let i = 0; i < uid.length; i++) seed = (seed * 31 + uid.charCodeAt(i)) >>> 0
  const pseudoRand = (seed % 1000) / 1000
  const lifeEventBonus = Math.min((user.lifeEvents?.length || 0) * 9, 27)
  const consentBonus = user.consentGiven ? 8 : 0
  const savedBonus = Math.min((user.savedPlans?.length || 0) * 5, 10)
  const createdAt = user.createdAt?.toDate?.() || new Date()
  const daysSince = Math.floor((Date.now() - createdAt) / 86400000)
  const activityBonus = Math.min(Math.floor(daysSince / 3), 12)
  const base = 38 + Math.floor(pseudoRand * 34)
  return Math.min(base + lifeEventBonus + consentBonus + savedBonus + activityBonus, 97)
}

function IntentBadge({ score }) {
  const { bg, text, bar, label } =
    score >= 80 ? { bg: 'bg-red-50', text: 'text-red-600', bar: 'bg-red-500', label: '🔥 High' } :
      score >= 60 ? { bg: 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-400', label: '⚡ Medium' } :
        { bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-400', label: '📈 Growing' }
  return (
    <div className={`inline-flex flex-col gap-0.5 px-2.5 py-1.5 rounded-lg ${bg} min-w-[80px]`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-semibold ${text}`}>{label}</span>
        <span className={`text-xs font-bold ${text}`}>{score}</span>
      </div>
      <div className="w-full h-1 bg-white/60 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()

  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [chatLogs, setChatLogs] = useState([])
  const [lifeEvents, setLifeEvents] = useState([])
  const [smsLogs, setSmsLogs] = useState([])
  const [policies, setPolicies] = useState([])
  const [claims, setClaims] = useState([])
  const [selectedPolicyIds, setSelectedPolicyIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [deletingBulk, setDeletingBulk] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [sendingTestSMS, setSendingTestSMS] = useState(false)
  const [updatingClaimId, setUpdatingClaimId] = useState(null)
  const [notifyingClaimId, setNotifyingClaimId] = useState(null)
  const [seedAmount, setSeedAmount] = useState(10)

  useEffect(() => {
    loadData()
    const interval = setInterval(() => setSmsLogs(getSMSLogs()), 5000)
    return () => clearInterval(interval)
  }, [])

  // ── Seed: upsert with fixed doc ID — never duplicates ─────────────────────
  const handleSeedPolicies = async () => {
    setSeeding(true)
    try {
      const count = await seedPolicies(seedAmount)
      await loadData()
      alert(`✅ ${count} policies added to database!`)
    } catch (e) {
      console.error('Seed error:', e)
      alert('❌ Seed failed: ' + e.message)
    } finally {
      setSeeding(false)
    }
  }

  const handleClearAllPolicies = async () => {
    if (!window.confirm('WARNING: This will delete ALL policies in the database. Continue?')) return
    setClearing(true)
    try {
      await deleteAllPolicies()
      await loadData()
      alert('✅ Database cleared. You can now Seed 6 Real Policies.')
    } catch (e) {
      alert('Clear failed: ' + e.message)
    } finally {
      setClearing(false)
    }
  }

  const handleDeletePolicy = async (id) => {
    if (!window.confirm('Delete this policy?')) return
    try {
      await deletePolicy(id)
      await loadData()
    } catch (e) {
      alert('Delete failed: ' + e.message)
    }
  }

  const handleDeleteSelected = async () => {
    if (!selectedPolicyIds.length) return
    if (!window.confirm(`Delete ${selectedPolicyIds.length} selected policies?`)) return
    
    setDeletingBulk(true)
    try {
      await deletePolicies(selectedPolicyIds)
      setSelectedPolicyIds([])
      await loadData()
      alert('✅ Selected policies deleted.')
    } catch (e) {
      alert('Bulk delete failed: ' + e.message)
    } finally {
      setDeletingBulk(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedPolicyIds.length === policies.length) {
      setSelectedPolicyIds([])
    } else {
      setSelectedPolicyIds(policies.map(p => p.id))
    }
  }

  const toggleSelectPolicy = (id) => {
    setSelectedPolicyIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleClaimStatusUpdate = async (claimId, newStatus) => {
    setUpdatingClaimId(claimId)
    try {
      const claimRef = doc(db, 'claims', claimId)
      const claim = claims.find(c => c.id === claimId)
      
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        timeline: [
          ...(claim.timeline || []),
          { 
            status: newStatus, 
            date: new Date().toISOString(), 
            note: `Status updated to ${newStatus?.replace('_', ' ')} by admin.` 
          }
        ]
      }
      
      await updateDoc(claimRef, updateData)
      await loadData()
      alert(`✅ Claim status updated to ${newStatus}`)
    } catch (err) {
      console.error('Status update error:', err)
      alert('❌ Failed to update status')
    } finally {
      setUpdatingClaimId(null)
    }
  }

  const handleNotifyCustomer = async (claim, type) => {
    setNotifyingClaimId(`${claim.id}_${type}`)
    const phone = claim.contactNumber || ''
    if (!phone) {
      alert('❌ No contact number found for this claim.')
      setNotifyingClaimId(null)
      return
    }

    const message = `Hi ${claim.userName}, your claim #${claim.claimId} structure has been updated to ${claim.status?.toUpperCase()}. Please log in to SaarthiAI to view details.`
    
    let res
    if (type === 'whatsapp') {
      res = await sendWhatsApp(phone, message)
    } else {
      res = await sendSMS(phone, message)
    }

    if (res.success) {
      logNotification(type, phone, message, 'sent')
      alert(`✅ ${type.toUpperCase()} notification sent!`)
      setSmsLogs(getSMSLogs()) // Refresh logs
    } else {
      alert(`❌ Failed to send ${type}: ${res.error}`)
    }
    setNotifyingClaimId(null)
  }


  const loadData = async () => {
    setLoading(true)
    try {
      const allUsers = await getAllUsers()
      setUsers(allUsers)

      setLifeEvents(
        allUsers
          .filter(u => u.lifeEvents?.length > 0)
          .flatMap(u => u.lifeEvents.map(e => ({
            ...e,
            userName: u.displayName || 'Unknown',
            userEmail: u.email || u.phone || '—',
            uid: u.id,
          })))
      )

      setPolicies(await getAllPolicies())

      // Fetch ALL claims (admin view) — Sync with latest user profiles
      try {
        const claimsSnap = await getDocs(query(collection(db, 'claims'), orderBy('createdAt', 'desc')))
        const rawClaims = claimsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        
        // Dynamic Join: Use latest data from 'allUsers' instead of stale snapshots in 'claims'
        const syncedClaims = rawClaims.map(c => {
          const u = allUsers.find(user => user.id === c.uid)
          return u ? { 
            ...c, 
            userName: u.displayName || c.userName, 
            userEmail: u.email || c.userEmail 
          } : c
        })
        
        setClaims(syncedClaims)
      } catch (err) { 
        console.error('Claims load error:', err)
        setClaims([]) 
      }

      const logs = []
      for (const u of allUsers.slice(0, 10)) {
        try {
          const msgs = await getChatHistory(u.id, 5)
          msgs.forEach(m => logs.push({ ...m, userName: u.displayName || 'Unknown', userEmail: u.email || u.phone || '—', uid: u.id }))
        } catch (_) { }
      }
      logs.sort((a, b) => (b.timestamp?.toDate?.() || 0) - (a.timestamp?.toDate?.() || 0))
      setChatLogs(logs)
      setSmsLogs(getSMSLogs())
    } catch (err) {
      console.error('Admin load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => { await logOut(); navigate('/') }
  const handleTestSMS = async () => {
    setSendingTestSMS(true)
    await sendRecommendationSMS(
      { phoneNumber: '+918169150113', displayName: 'Test', uid: 'test123' },
      { name: 'Family Health Coverage', price: 500 }
    )
    setSmsLogs(getSMSLogs())
    setSendingTestSMS(false)
  }

  const TABS = [
    { id: 'users',    label: 'Users',            icon: Users,       count: users.length },
    { id: 'claims',   label: 'Claims',           icon: FileText,    count: claims.length },
    { id: 'chats',    label: 'Chat Logs',        icon: MessageCircle, count: chatLogs.length },
    { id: 'events',   label: 'Life Events',      icon: Zap,         count: lifeEvents.length },
    { id: 'policies', label: 'Policies Database',icon: Database,    count: policies.length },
    { id: 'sms',      label: 'SMS Campaigns',    icon: Send,        count: smsLogs.length },
    { id: 'agent',    label: 'AI Agent',         icon: Shield,      count: lifeEvents.length },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-[#0B1F4B] px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-2">
          <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" alt="logo" className="w-8 h-8" />
          <span className="text-white font-bold text-lg">Saarthi<span className="text-[#FF6B00]">AI</span></span>
          <span className="ml-2 bg-[#FF6B00] text-white text-xs px-2 py-0.5 rounded-full font-semibold">ADMIN</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-blue-200 text-sm">{userProfile?.displayName}</span>
          <button onClick={handleSignOut} className="text-white/50 hover:text-white transition"><LogOut size={18} /></button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
            <p className="text-gray-500 text-sm">Realtime data from Firebase</p>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 bg-[#0B1F4B] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-opacity-90 transition">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-[#0B1F4B] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}>
              <tab.icon size={15} />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-[#FF6B00] text-white' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading data...</p>
          </div>
        ) : (
          <>
            {/* ── CLAIMS ── */}
            {activeTab === 'claims' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <FileText size={16} className="text-[#FF6B00]" /> All Customer Claims
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">Showing all claims across all users. Click document links to download.</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-auto">
                  <table className="w-full text-sm min-w-[900px]">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['User', 'Claim ID', 'Policy Type', 'Amount', 'Provider', 'Status', 'Date', 'Documents', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {claims.length === 0
                        ? <tr><td colSpan={8} className="text-center py-10 text-gray-400">No claims found.</td></tr>
                        : claims.map((c, i) => {
                          const statusCfg = {
                            submitted:    { bg: 'bg-blue-50',   text: 'text-blue-600' },
                            under_review: { bg: 'bg-orange-50', text: 'text-orange-600' },
                            approved:     { bg: 'bg-green-50',  text: 'text-green-600' },
                            rejected:     { bg: 'bg-red-50',    text: 'text-red-600' },
                          }[c.status] || { bg: 'bg-gray-50', text: 'text-gray-600' }

                          return (
                            <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 transition ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-800 text-xs">{c.userName || '—'}</p>
                                <p className="text-gray-400 text-[10px]">{c.userEmail || '—'}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">#{c.claimId}</span>
                              </td>
                              <td className="px-4 py-3 capitalize text-gray-700 text-xs font-medium">{c.policyType || '—'}</td>
                              <td className="px-4 py-3 font-bold text-[#0B1F4B] text-xs">
                                ₹{Number(c.claimAmount || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{c.providerName || '—'}</td>
                              <td className="px-4 py-3">
                                <select 
                                  value={c.status}
                                  disabled={updatingClaimId === c.id}
                                  onChange={(e) => handleClaimStatusUpdate(c.id, e.target.value)}
                                  className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider outline-none border-none cursor-pointer ${statusCfg.bg} ${statusCfg.text}`}
                                >
                                  <option value="submitted">Submitted</option>
                                  <option value="under_review">Under Review</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                                {updatingClaimId === c.id && <div className="inline-block ml-1 w-2 h-2 border border-blue-600 border-t-transparent rounded-full animate-spin" />}
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                                {c.createdAt?.toDate?.()?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) || '—'}
                              </td>
                              <td className="px-4 py-3">
                                {c.attachments?.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {c.attachments.map((att, j) => (
                                      <a
                                        key={j}
                                        href={att.base64}
                                        download={att.name}
                                        title={att.name}
                                        className="flex items-center gap-1 bg-orange-50 border border-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-orange-100 transition"
                                      >
                                        <Download size={10} />
                                        <span className="max-w-[80px] truncate">{att.name}</span>
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-300 text-xs">None</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleNotifyCustomer(c, 'whatsapp')}
                                    disabled={notifyingClaimId === `${c.id}_whatsapp`}
                                    title="Send WhatsApp Update"
                                    className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50"
                                  >
                                    {notifyingClaimId === `${c.id}_whatsapp` ? <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> : <MessageCircle size={14} />}
                                  </button>
                                  <button
                                    onClick={() => handleNotifyCustomer(c, 'sms')}
                                    disabled={notifyingClaimId === `${c.id}_sms`}
                                    title="Send SMS Update"
                                    className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
                                  >
                                    {notifyingClaimId === `${c.id}_sms` ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Name', 'Email / Phone', 'Role', 'Consent', 'Intent Score', 'Life Events', 'Joined'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0
                      ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">No users found</td></tr>
                      : users.map((u, i) => (
                        <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50 transition ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-[#0B1F4B] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {u.displayName?.[0]?.toUpperCase() || '?'}
                              </div>
                              <span className="font-medium text-gray-800">{u.displayName || '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{u.email || u.phone || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-red-100 text-red-600' : u.role === 'agent' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                              {u.role || 'customer'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.consentGiven ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                              {u.consentGiven ? '✓ Given' : '✗ Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3"><IntentBadge score={calcIntentScore(u)} /></td>
                          <td className="px-4 py-3">
                            {u.lifeEvents?.length > 0
                              ? <div className="flex flex-wrap gap-1">
                                {u.lifeEvents.slice(0, 2).map((e, j) => <span key={j} className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">{e.label}</span>)}
                                {u.lifeEvents.length > 2 && <span className="text-gray-400 text-xs">+{u.lifeEvents.length - 2}</span>}
                              </div>
                              : <span className="text-gray-300 text-xs">None</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{u.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}

            {/* ── CHATS ── */}
            {activeTab === 'chats' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['User', 'Role', 'Message', 'Time'].map(h => <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {chatLogs.length === 0
                      ? <tr><td colSpan={4} className="text-center py-8 text-gray-400">No chat logs found</td></tr>
                      : chatLogs.map((msg, i) => (
                        <tr key={msg.id + i} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                          <td className="px-4 py-3"><p className="font-medium text-gray-800 text-xs">{msg.userName}</p><p className="text-gray-400 text-xs">{msg.userEmail}</p></td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                              {msg.role === 'user' ? '👤 User' : '🤖 AI'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 max-w-xs"><p className="truncate">{msg.content?.replace(/<[^>]+>/g, '') || '—'}</p></td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{msg.timestamp?.toDate?.()?.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) || '—'}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}

            {/* ── LIFE EVENTS ── */}
            {activeTab === 'events' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['User', 'Life Event', 'Detected At'].map(h => <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {lifeEvents.length === 0
                      ? <tr><td colSpan={3} className="text-center py-8 text-gray-400">No life events detected yet</td></tr>
                      : lifeEvents.map((e, i) => (
                        <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                          <td className="px-4 py-3"><p className="font-medium text-gray-800 text-xs">{e.userName}</p><p className="text-gray-400 text-xs">{e.userEmail}</p></td>
                          <td className="px-4 py-3"><span className="bg-[#FF6B00] text-white text-xs px-3 py-1 rounded-full font-medium">{e.label}</span></td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{e.detectedAt ? new Date(e.detectedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '—'}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}

            {/* ── POLICIES ── */}
            {activeTab === 'policies' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                      <Database size={16} className="text-[#FF6B00]" /> Policy Catalog
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">Manage policies available in the Comparison tool and recommendations.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedPolicyIds.length > 0 && (
                      <button onClick={handleDeleteSelected} disabled={deletingBulk}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60 flex items-center gap-2">
                        {deletingBulk ? 'Deleting...' : `Delete Selected (${selectedPolicyIds.length})`}
                      </button>
                    )}
                    <button onClick={handleClearAllPolicies} disabled={clearing || seeding}
                      className="text-red-500 hover:text-red-700 text-xs font-bold px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50">
                      {clearing ? 'Clearing...' : 'Clear All'}
                    </button>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Amount:</span>
                      <input 
                        type="number" 
                        value={seedAmount} 
                        onChange={(e) => setSeedAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 bg-transparent text-sm font-bold text-[#0B1F4B] focus:outline-none"
                      />
                    </div>
                    <button onClick={handleSeedPolicies} disabled={seeding || clearing}
                      className="bg-[#0B1F4B] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition disabled:opacity-60 flex items-center gap-2">
                      {seeding ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Seeding...</> : `Seed ${seedAmount} Policies`}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left w-10">
                          <input type="checkbox" checked={policies.length > 0 && selectedPolicyIds.length === policies.length} onChange={toggleSelectAll} className="rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]" />
                        </th>
                        {['Insurer', 'Plan Name', 'Category', 'Premium / Cover', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {policies.length === 0
                        ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">No policies yet. Click "Seed 6 Real Policies" above.</td></tr>
                        : policies.map((p, i) => (
                          <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 transition ${selectedPolicyIds.includes(p.id) ? 'bg-orange-50/50' : ''}`}>
                            <td className="px-4 py-3">
                              <input type="checkbox" checked={selectedPolicyIds.includes(p.id)} onChange={() => toggleSelectPolicy(p.id)} className="rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00]" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <img src={p.logo} alt={p.insurer} className="h-6 w-auto object-contain bg-white rounded border border-gray-100"
                                  onError={e => { e.target.style.display = 'none' }} />
                                <span className="font-bold text-gray-800">{p.insurer}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700 font-medium">
                              {p.name}
                              {p.popular && <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Top Pick</span>}
                            </td>
                            <td className="px-4 py-3">
                              <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded font-bold uppercase">{p.category}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-[#0B1F4B]">₹{Number(p.premium).toLocaleString('en-IN')}</span>/yr
                              <span className="text-gray-400 text-xs ml-2">Cover: {p.cover}</span>
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => handleDeletePolicy(p.id)}
                                className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 border border-red-200 rounded hover:bg-red-50 transition">
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── SMS CAMPAIGNS ── */}
            {activeTab === 'sms' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">📱 SMS Campaign Engine</h3>
                    <p className="text-gray-500 text-xs">TextBee gateway • Real SMS delivery</p>
                  </div>
                  <button onClick={handleTestSMS} disabled={sendingTestSMS}
                    className="bg-[#FF6B00] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2">
                    {sendingTestSMS
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                      : <><Send size={14} /> Send Test SMS</>
                    }
                  </button>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      📱 SMS Campaign Logs
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{smsLogs.length} sent</span>
                    </h3>
                    <span className="text-xs text-gray-400">Auto-refreshes every 5s</span>
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {smsLogs.length === 0
                      ? <div className="text-center py-12 text-gray-400"><Send size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No SMS sent yet</p></div>
                      : smsLogs.map(sms => (
                        <div key={sms.id} className="border-l-4 border-green-500 bg-green-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-gray-800">To: {sms.to}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sms.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{sms.status}</span>
                          </div>
                          <p className="text-xs text-gray-700 bg-white p-2 rounded border border-green-100 mb-2 font-mono">{sms.message}</p>
                          <p className="text-xs text-gray-400">{new Date(sms.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })} • {sms.metadata?.templateType || 'custom'}</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            )}

            {/* ── AI AGENT ── */}
            {activeTab === 'agent' && (
              <div className="space-y-4">
                <div className="bg-[#0B1F4B] rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FF6B00] rounded-xl flex items-center justify-center text-white text-lg">🤖</div>
                  <div>
                    <h2 className="text-white font-bold text-sm">AI Marketing Agent — Autonomous Campaign Execution</h2>
                    <p className="text-blue-300 text-xs">Detects life events and triggers personalized campaigns automatically</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Campaigns Run', value: lifeEvents.length, color: 'bg-orange-50 text-orange-600', icon: '🚀' },
                    { label: 'Emails Sent', value: lifeEvents.length, color: 'bg-green-50 text-green-600', icon: '📧' },
                    { label: 'SMS Sent', value: smsLogs.length, color: 'bg-blue-50 text-blue-600', icon: '💬' },
                    { label: 'Ads Targeted', value: lifeEvents.length, color: 'bg-purple-50 text-purple-600', icon: '🎯' },
                  ].map((s, i) => (
                    <div key={i} className={`${s.color} rounded-xl p-3 text-center`}>
                      <p className="text-2xl mb-1">{s.icon}</p>
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-xs font-medium opacity-80">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />Live Campaign Logs
                  </h3>
                  {lifeEvents.length === 0
                    ? <p className="text-gray-400 text-sm text-center py-8">No campaigns yet. Life events trigger campaigns automatically.</p>
                    : lifeEvents.map((e, i) => (
                      <div key={i} className="border border-gray-100 rounded-xl p-4 mb-3 hover:shadow-sm transition">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-[#0B1F4B] rounded-full flex items-center justify-center text-white text-xs font-bold">{e.userName?.[0]?.toUpperCase() || '?'}</div>
                            <div><span className="font-semibold text-gray-800 text-sm">{e.userName}</span><p className="text-gray-400 text-xs">{e.userEmail}</p></div>
                            <span className="ml-1 bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium">{e.label}</span>
                          </div>
                          <span className="text-gray-400 text-xs">{e.detectedAt ? new Date(e.detectedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : 'Just now'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { icon: '📧', label: 'Email Sent', sub: e.userEmail, bg: 'bg-green-50  border-green-100' },
                            { icon: '💬', label: 'SMS Sent', sub: 'Personalized alert', bg: 'bg-blue-50   border-blue-100' },
                            { icon: '🟢', label: 'WhatsApp Sent', sub: 'via AI Agent', bg: 'bg-emerald-50 border-emerald-100' },
                            { icon: '🎯', label: 'Google Ads', sub: `Segment: ${e.label}`, bg: 'bg-purple-50 border-purple-100' },
                          ].map((c, j) => (
                            <div key={j} className={`flex items-center gap-2 ${c.bg} border rounded-lg px-3 py-2`}>
                              <span className="text-base">{c.icon}</span>
                              <div><p className="text-xs font-semibold text-gray-700">{c.label}</p><p className="text-xs text-gray-400 truncate max-w-[120px]">{c.sub}</p></div>
                              <span className="ml-auto text-green-500 text-xs font-bold">✓</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}