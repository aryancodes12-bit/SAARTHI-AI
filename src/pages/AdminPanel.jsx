import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Users, MessageCircle, Zap, LogOut, RefreshCw } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { logOut } from '../firebase/auth'
import { getAllCustomers, getChatHistory } from '../firebase/firestore'
import { db } from '../firebase/config'

export default function AdminPanel() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [chatLogs, setChatLogs] = useState([])
  const [lifeEvents, setLifeEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const allUsers = await getAllCustomers()
      setUsers(allUsers)

      const eventsData = allUsers
        .filter(u => u.lifeEvents?.length > 0)
        .flatMap(u => u.lifeEvents.map(e => ({
          ...e,
          userName: u.displayName || 'Unknown',
          userEmail: u.email || u.phone || '—',
          uid: u.id,
        })))
      setLifeEvents(eventsData)

      const logs = []
      for (const u of allUsers.slice(0, 10)) {
        try {
          const msgs = await getChatHistory(u.id, 5)
          msgs.forEach(m => logs.push({
            ...m,
            userName: u.displayName || 'Unknown',
            userEmail: u.email || u.phone || '—',
            uid: u.id,
          }))
        } catch (e) {}
      }
      logs.sort((a, b) => {
        const aTime = a.timestamp?.toDate?.() || new Date(0)
        const bTime = b.timestamp?.toDate?.() || new Date(0)
        return bTime - aTime
      })
      setChatLogs(logs)
    } catch (err) {
      console.error('Admin load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await logOut()
    navigate('/')
  }

  const TABS = [
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'chats', label: 'Chat Logs', icon: MessageCircle, count: chatLogs.length },
    { id: 'events', label: 'Life Events', icon: Zap, count: lifeEvents.length },
    { id: 'agent', label: 'AI Agent', icon: Shield, count: lifeEvents.length },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-[#0B1F4B] px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-2">
          <img src="https://i.ibb.co/DywMwv9/Saarthie-1-removebg-preview.png" alt="logo" className="w-8 h-8" />
          <span className="text-white font-bold text-lg">Saarthi<span className="text-[#FF6B00]">AI</span></span>
          <span className="ml-2 bg-[#FF6B00] text-white text-xs px-2 py-0.5 rounded-full font-semibold">ADMIN</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-blue-200 text-sm">{userProfile?.displayName}</span>
          <button onClick={handleSignOut} className="text-white/50 hover:text-white transition">
            <LogOut size={18} />
          </button>
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
        <div className="flex gap-2 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#0B1F4B] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-[#FF6B00] text-white' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Users Table */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold">Name</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold">Email / Phone</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold">Role</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold">Consent</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold">Life Events</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400">No users found</td></tr>
                    ) : users.map((u, i) => (
                      <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50 transition ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
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
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'admin' ? 'bg-red-100 text-red-600' :
                            u.role === 'agent' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                          }`}>{u.role || 'customer'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.consentGiven ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                            {u.consentGiven ? '✓ Given' : '✗ Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.lifeEvents?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {u.lifeEvents.slice(0, 2).map((e, j) => (
                                <span key={j} className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">{e.label}</span>
                              ))}
                              {u.lifeEvents.length > 2 && <span className="text-gray-400 text-xs">+{u.lifeEvents.length - 2}</span>}
                            </div>
                          ) : <span className="text-gray-300 text-xs">None</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {u.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Chat Logs Table */}
            {activeTab === 'chats' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold">User</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold">Role</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold">Message</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chatLogs.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-gray-400">No chat logs found</td></tr>
                    ) : chatLogs.map((msg, i) => (
                      <tr key={msg.id + i} className={`border-b border-gray-50 hover:bg-gray-50 transition ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 text-xs">{msg.userName}</p>
                          <p className="text-gray-400 text-xs">{msg.userEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {msg.role === 'user' ? '👤 User' : '🤖 AI'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-xs">
                          <p className="truncate">{msg.content?.replace(/<[^>]+>/g, '') || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {msg.timestamp?.toDate?.()?.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Life Events Table */}
            {activeTab === 'events' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold">User</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold">Life Event</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold">Detected At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lifeEvents.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-8 text-gray-400">No life events detected yet</td></tr>
                    ) : lifeEvents.map((e, i) => (
                      <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 transition ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 text-xs">{e.userName}</p>
                          <p className="text-gray-400 text-xs">{e.userEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-[#FF6B00] text-white text-xs px-3 py-1 rounded-full font-medium">{e.label}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {e.detectedAt ? new Date(e.detectedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* AI Agent Tab */}
            {activeTab === 'agent' && (
              <div className="space-y-4">
                {/* Header card */}
                <div className="bg-[#0B1F4B] rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FF6B00] rounded-xl flex items-center justify-center text-white text-lg">🤖</div>
                  <div>
                    <h2 className="text-white font-bold text-sm">AI Marketing Agent — Autonomous Campaign Execution</h2>
                    <p className="text-blue-300 text-xs">Agent automatically detects life events and triggers personalized campaigns across all channels</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Campaigns Run', value: lifeEvents.length, color: 'bg-orange-50 text-orange-600', icon: '🚀' },
                    { label: 'Emails Sent', value: lifeEvents.length, color: 'bg-green-50 text-green-600', icon: '📧' },
                    { label: 'SMS Sent', value: lifeEvents.length, color: 'bg-blue-50 text-blue-600', icon: '💬' },
                    { label: 'Ads Targeted', value: lifeEvents.length, color: 'bg-purple-50 text-purple-600', icon: '🎯' },
                  ].map((stat, i) => (
                    <div key={i} className={`${stat.color} rounded-xl p-3 text-center`}>
                      <p className="text-2xl mb-1">{stat.icon}</p>
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-xs font-medium opacity-80">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Campaign logs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>
                    Live Campaign Logs
                  </h3>
                  {lifeEvents.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No campaigns executed yet. Life events will trigger campaigns automatically.</p>
                  ) : lifeEvents.map((e, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4 mb-3 hover:shadow-sm transition">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-[#0B1F4B] rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {e.userName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-800 text-sm">{e.userName}</span>
                            <p className="text-gray-400 text-xs">{e.userEmail}</p>
                          </div>
                          <span className="ml-1 bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium">{e.label}</span>
                        </div>
                        <span className="text-gray-400 text-xs">
                          {e.detectedAt ? new Date(e.detectedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : 'Just now'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                          <span className="text-base">📧</span>
                          <div>
                            <p className="text-xs font-semibold text-gray-700">Email Sent</p>
                            <p className="text-xs text-gray-400 truncate max-w-[120px]">{e.userEmail}</p>
                          </div>
                          <span className="ml-auto text-green-500 text-xs font-bold">✓</span>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <span className="text-base">💬</span>
                          <div>
                            <p className="text-xs font-semibold text-gray-700">SMS Sent</p>
                            <p className="text-xs text-gray-400">Personalized alert</p>
                          </div>
                          <span className="ml-auto text-green-500 text-xs font-bold">✓</span>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                          <span className="text-base">🟢</span>
                          <div>
                            <p className="text-xs font-semibold text-gray-700">WhatsApp Sent</p>
                            <p className="text-xs text-gray-400">via AI Agent</p>
                          </div>
                          <span className="ml-auto text-green-500 text-xs font-bold">✓</span>
                        </div>
                        <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                          <span className="text-base">🎯</span>
                          <div>
                            <p className="text-xs font-semibold text-gray-700">Google Ads</p>
                            <p className="text-xs text-gray-400">Segment: {e.label}</p>
                          </div>
                          <span className="ml-auto text-green-500 text-xs font-bold">✓</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}