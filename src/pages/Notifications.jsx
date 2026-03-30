import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bell, Heart, Car, Home, Baby, Calendar, 
  ShieldCheck, Trash2, ArrowLeft, Info, 
  ChevronRight, Sparkles 
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'

// Custom Relative Time Function (No External Library)
const getRelativeTime = (dateStr) => {
  if (!dateStr) return 'Just now'
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)
  
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'Minute' : 'Minutes'} Ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'Hour' : 'Hours'} Ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ${days === 1 ? 'Day' : 'Days'} Ago`
  
  // Return formatted date for older events
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const EVENT_ICONS = {
  marriage: <Heart className="text-pink-500" size={20} />,
  baby: <Baby className="text-blue-500" size={20} />,
  home: <Home className="text-orange-500" size={20} />,
  car: <Car className="text-indigo-500" size={20} />,
  retirement: <Calendar className="text-teal-500" size={20} />,
  default: <Sparkles className="text-[#FF6B00]" size={20} />
}

export default function Notifications() {
  const { loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications()

  const [filter, setFilter] = useState('all')

  const filteredList = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.isRead)
    if (filter === 'important') return notifications.filter(n => n.type === 'important')
    return notifications
  }, [notifications, filter])

  if (authLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto h-[80vh] flex flex-col items-center justify-center animate-pulse">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#FF6B00] rounded-full animate-spin"></div>
        <p className="text-gray-400 mt-4 text-sm font-medium">Fetching alerts...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto font-inter min-h-screen pb-32">
      
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-[#0B1F4B] transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-[#0B1F4B] font-outfit">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-[#FF6B00] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-orange-100 animate-bounce">
                {unreadCount} New
              </span>
            )}
          </div>
          <button 
            onClick={markAllAsRead}
            className="text-sm font-bold text-[#FF6B00] hover:underline underline-offset-4 transition-all"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 max-w-fit">
        {['all', 'unread', 'important'].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
              filter === t 
              ? 'bg-[#0B1F4B] text-white shadow-xl' 
              : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Bell className="text-gray-200" size={40} />
            </div>
            <h3 className="text-xl font-bold text-[#0B1F4B] font-outfit">No notifications here</h3>
            <p className="text-gray-400 text-sm mt-1">We'll alert you when there's an update about your life events.</p>
          </div>
        ) : (
          filteredList.map((notif) => (
            <div 
              key={notif.id}
              className={`bg-white rounded-2xl p-5 border transition-all relative group shadow-sm ${
                !notif.isRead 
                  ? 'border-l-4 border-l-[#FF6B00] border-orange-50' 
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${notif.bg} border border-white shadow-inner`}>
                  {notif.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-bold font-outfit text-[#0B1F4B] truncate pr-2 ${!notif.isRead ? 'text-[1.05rem]' : 'text-base'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] md:text-xs font-bold text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-lg">
                      {getRelativeTime(notif.date)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">
                    {notif.message}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <button 
                      onClick={() => {
                        markAsRead(notif.id)
                        navigate('/chat', { state: { 
                          source: 'notification', 
                          eventType: notif.eventRawType, 
                          eventLabel: notif.eventLabel 
                        }})
                      }}
                      className="text-xs font-black text-[#FF6B00] hover:text-[#0B1F4B] transition-all flex items-center gap-1 uppercase tracking-wider"
                    >
                      {notif.cta}
                    </button>

                    <div className="flex items-center gap-3 text-gray-400">
                      {!notif.isRead && (
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="text-[10px] uppercase tracking-widest font-black hover:text-[#FF6B00] transition-colors"
                        >
                          Mark as Read
                        </button>
                      )}
                      <button 
                        onClick={() => deleteNotification(notif.id)}
                        className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                        title="Delete Alert"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unread DOT */}
              {!notif.isRead && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-[#FF6B00] rounded-full shadow-[0_0_8px_#FF6B00]"></div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-12 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-gray-400 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed italic">
            Policy & Claims notifications coming soon. SaarthiAI is currently an advisory platform helping you detect life events and find the right coverage.
          </p>
        </div>
      </div>

    </div>
  )
}
