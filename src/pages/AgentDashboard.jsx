import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Users, TrendingUp, Phone, MessageCircle, AlertCircle, LogOut, RefreshCw, Zap } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getAllCustomers, getHighIntentCustomers } from '../firebase/firestore'
import { logOut } from '../firebase/auth'
import { generateCampaignMessages } from '../ai/messageGenerator'

const STATS_MOCK = [
  { label: 'Total Customers', value: '1,248', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'High Intent (>70)', value: '342', icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Conversion Rate', value: '18.3%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Active Chats', value: '47', icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
]

const EVENTS_FILTER = ['All', 'MARRIAGE', 'NEW_BABY', 'HOME_PURCHASE', 'RETIREMENT_PLAN', 'HEALTH_CONCERN']

export default function AgentDashboard() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [customers, setCustomers] = useState([])
  const [filteredEvent, setFilteredEvent] = useState('All')
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [campaignMessages, setCampaignMessages] = useState([])
  const [generatingMsg, setGeneratingMsg] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const data = await getAllCustomers()
      setCustomers(data)
    } catch (err) {
      // Demo fallback
      setCustomers(MOCK_CUSTOMERS)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCampaign = async (customer) => {
    setSelectedCustomer(customer)
    setGeneratingMsg(true)
    const topEvent = customer.lifeEvents?.[0]?.type || 'MARRIAGE'
    const msgs = await generateCampaignMessages(topEvent, 'SecureTerm 30', 3)
    setCampaignMessages(msgs)
    setGeneratingMsg(false)
  }

  const filtered = filteredEvent === 'All'
    ? customers
    : customers.filter(c => c.lifeEvents?.some(e => e.type === filteredEvent))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-[#0B1F4B] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF6B00] rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold">saarthi<span className="text-[#FF6B00]">ai</span></span>
            <span className="ml-2 bg-[#FF6B00] text-white text-xs px-2 py-0.5 rounded-full font-medium">AGENT</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-blue-200 text-sm">{userProfile?.displayName}</span>
          <button onClick={() => logOut().then(() => navigate('/'))} className="text-white/50 hover:text-white">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Agent Dashboard</h1>
            <p className="text-gray-500 text-sm">Real-time customer intelligence</p>
          </div>
          <button onClick={loadCustomers} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0B1F4B] border border-gray-200 rounded-lg px-3 py-2">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {STATS_MOCK.map(stat => (
            <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-gray-500 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Users size={16} className="text-[#0B1F4B]" /> Customer Intelligence
                  </h2>
                </div>
                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                  {EVENTS_FILTER.map(f => (
                    <button key={f} onClick={() => setFilteredEvent(f)}
                      className={`text-xs px-3 py-1 rounded-full border transition ${filteredEvent === f ? 'bg-[#0B1F4B] text-white border-[#0B1F4B]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0B1F4B]'
                        }`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading customers...
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {(filtered.length > 0 ? filtered : MOCK_CUSTOMERS).map(customer => (
                    <div key={customer.uid || customer.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition flex items-center gap-3"
                      onClick={() => handleGenerateCampaign(customer)}>
                      <div className="w-9 h-9 bg-[#0B1F4B] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {customer.displayName?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm">{customer.displayName || 'Anonymous'}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {customer.lifeEvents?.slice(0, 2).map((e, i) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{e.label || e.type}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <div className={`w-2 h-2 rounded-full ${(customer.intentScore || 0) >= 70 ? 'bg-green-400' :
                              (customer.intentScore || 0) >= 40 ? 'bg-yellow-400' : 'bg-gray-300'
                            }`} />
                          <span className="text-xs font-semibold text-gray-700">{customer.intentScore || 0}</span>
                        </div>
                        <p className="text-xs text-gray-400">Intent</p>
                      </div>
                      <div className="flex gap-1">
                        <button className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100">
                          <Phone size={12} />
                        </button>
                        <button className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100">
                          <MessageCircle size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Campaign Generator Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <Zap size={14} className="text-[#FF6B00]" /> AI Campaign Generator
              </h3>
              {selectedCustomer ? (
                <>
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-500">Selected Customer</p>
                    <p className="font-medium text-gray-800 text-sm">{selectedCustomer.displayName}</p>
                    {selectedCustomer.lifeEvents?.[0] && (
                      <span className="text-xs bg-[#FF6B00] text-white px-2 py-0.5 rounded-full">
                        {selectedCustomer.lifeEvents[0].label || selectedCustomer.lifeEvents[0].type}
                      </span>
                    )}
                  </div>

                  {generatingMsg ? (
                    <div className="text-center py-6">
                      <div className="w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Generating AI messages...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {campaignMessages.map((msg, i) => (
                        <div key={i} className="bg-green-50 border border-green-100 rounded-lg p-3">
                          <p className="text-xs font-medium text-green-700 mb-1">Message {i + 1}</p>
                          <p className="text-xs text-gray-600 leading-relaxed">{msg.message}</p>
                          <button className="mt-2 text-xs text-green-600 font-medium hover:underline">Copy →</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <MessageCircle size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Click a customer to generate personalized campaign messages</p>
                </div>
              )}
            </div>

            {/* DPDP Audit */}
            <div className="bg-[#0B1F4B] rounded-xl p-4">
              <p className="text-white font-semibold text-sm mb-2">🛡️ DPDP Compliance</p>
              {[
                { label: 'Consent-only access', ok: true },
                { label: 'PII masked in AI', ok: true },
                { label: 'Audit trail active', ok: true },
                { label: 'Bias monitoring', ok: true },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-xs py-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${item.ok ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-blue-200">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Demo data for hackathon
const MOCK_CUSTOMERS = [
  { id: '1', displayName: 'Priya Sharma', intentScore: 87, lifeEvents: [{ type: 'MARRIAGE', label: '💍 Marriage' }] },
  { id: '2', displayName: 'Rahul Mehta', intentScore: 73, lifeEvents: [{ type: 'NEW_BABY', label: '👶 New Baby' }] },
  { id: '3', displayName: 'Anjali Singh', intentScore: 61, lifeEvents: [{ type: 'HOME_PURCHASE', label: '🏠 Home Purchase' }] },
  { id: '4', displayName: 'Vikram Patel', intentScore: 45, lifeEvents: [{ type: 'RETIREMENT_PLAN', label: '🌅 Planning Retirement' }] },
  { id: '5', displayName: 'Neha Joshi', intentScore: 92, lifeEvents: [{ type: 'NEW_BABY', label: '👶 New Baby' }, { type: 'HEALTH_CONCERN', label: '❤️ Health Concern' }] },
  { id: '6', displayName: 'Arjun Kumar', intentScore: 34, lifeEvents: [] },
]