import { useState, useEffect, useMemo, createContext, useContext } from 'react'
import { useAuth } from './useAuth'
import { Bell, ShieldCheck, Sparkles, Heart, Baby, Home, Car, Calendar } from 'lucide-react'

const NotificationsContext = createContext(null)

const EVENT_ICONS = {
  marriage: <Heart className="text-pink-500" size={20} />,
  baby: <Baby className="text-blue-500" size={20} />,
  home: <Home className="text-orange-500" size={20} />,
  car: <Car className="text-indigo-500" size={20} />,
  retirement: <Calendar className="text-teal-500" size={20} />,
  default: <Sparkles className="text-[#FF6B00]" size={20} />
}

export function NotificationsProvider({ children }) {
  const { user, userProfile } = useAuth()
  
  const [readIds, setReadIds] = useState(() => {
    if (typeof window === 'undefined' || !user?.uid) return []
    const stored = localStorage.getItem(`read_notifications_${user.uid}`)
    return stored ? JSON.parse(stored) : []
  })
  
  const [deletedIds, setDeletedIds] = useState(() => {
    if (typeof window === 'undefined' || !user?.uid) return []
    const stored = localStorage.getItem(`deleted_notifications_${user.uid}`)
    return stored ? JSON.parse(stored) : []
  })

  // Sync state with localStorage
  useEffect(() => {
    if (user?.uid) {
      localStorage.setItem(`read_notifications_${user.uid}`, JSON.stringify(readIds))
      localStorage.setItem(`deleted_notifications_${user.uid}`, JSON.stringify(deletedIds))
    }
  }, [readIds, deletedIds, user?.uid])

  // Clear states when user changes
  useEffect(() => {
    if (user?.uid) {
      const r = localStorage.getItem(`read_notifications_${user.uid}`)
      const d = localStorage.getItem(`deleted_notifications_${user.uid}`)
      setReadIds(r ? JSON.parse(r) : [])
      setDeletedIds(d ? JSON.parse(d) : [])
    }
  }, [user?.uid])

  const notifications = useMemo(() => {
    if (!userProfile) return []
    const list = []

    // 1. Life Events (The "Real" Data)
    const lifeEvents = userProfile.lifeEvents || []
    lifeEvents.forEach((ev) => {
      const id = `event_${ev.type}_${ev.detectedAt}`
      if (deletedIds.includes(id)) return

      list.push({
        id,
        type: 'important',
        title: `New Event Detected: ${ev.label || ev.type}`,
        message: `Your profile suggests a recent ${ev.type}. Let our AI tailor new coverage for your growing family.`,
        date: ev.detectedAt,
        icon: EVENT_ICONS[ev.type.toLowerCase()] || EVENT_ICONS.default,
        bg: 'bg-orange-50',
        isRead: readIds.includes(id),
        cta: 'Chat with AI Advisor →',
        ctaUrl: '/chat',
        eventRawType: ev.type,
        eventLabel: ev.label
      })
    })

    // 2. System Messages
    const consentId = `system_consent_${userProfile.uid || user?.uid}`
    if (!deletedIds.includes(consentId)) {
      list.push({
        id: consentId,
        type: 'system',
        title: 'Privacy & Data Protection',
        message: 'Your account is now DPDP 2023 compliant. Manage consents in Settings.',
        date: userProfile.consentTimestamp || userProfile.createdAt || new Date().toISOString(),
        icon: <ShieldCheck className="text-green-500" size={20} />,
        bg: 'bg-green-50',
        isRead: readIds.includes(consentId),
        cta: 'Manage Consent →',
        ctaUrl: '/settings'
      })
    }

    return list.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [userProfile, readIds, deletedIds, user?.uid])

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead).length
  , [notifications])

  const markAsRead = (id) => {
    setReadIds(prev => prev.includes(id) ? prev : [...prev, id])
  }

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id)
    setReadIds(prev => [...new Set([...prev, ...allIds])])
  }

  const deleteNotification = (id) => {
    setDeletedIds(prev => [...prev, id])
  }

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error('useNotifications must be used within NotificationsProvider')
  return context
}
