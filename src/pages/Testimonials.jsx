import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase/config'
import { 
  collection, addDoc, onSnapshot, query, 
  orderBy, where, serverTimestamp, getDocs 
} from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { 
  Star, MessageSquare, ArrowLeft, CheckCircle2, 
  Filter, PlusCircle, Send, X, User, HelpCircle, ExternalLink 
} from 'lucide-react'
import { 
  ContainerScroll, CardsContainer, CardTransformed, ReviewStars 
} from '@/components/blocks/AnimatedCardsStack'
import { 
  Avatar, AvatarFallback, AvatarImage 
} from '@/components/ui/Avatar'

const INSURANCE_TYPES = ['Health', 'Term Life', 'Motor', 'Home', 'Retirement']

const SEED_DATA = [
  { userName: "Priya Sharma", rating: 5, insuranceType: "Health", reviewText: "SaarthiAI helped me find the perfect family health plan after my baby was born. The AI understood my situation perfectly!", verified: true, createdAt: new Date() },
  { userName: "Rahul Mehta", rating: 5, insuranceType: "Term Life", reviewText: "Got married last year and SaarthiAI immediately suggested term life coverage. Super intuitive platform!", verified: true, createdAt: new Date() },
  { userName: "Anjali Singh", rating: 4, insuranceType: "Motor", reviewText: "Compared 6 motor insurance plans in minutes. Saved ₹3,200 on my annual premium. Highly recommend!", verified: true, createdAt: new Date() },
  { userName: "Vikram Patel", rating: 5, insuranceType: "Health", reviewText: "The AI chat advisor explained every policy clearly in Hindi. First time insurance felt simple!", verified: true, createdAt: new Date() },
  { userName: "Sneha Kapoor", rating: 4, insuranceType: "Retirement", reviewText: "Planning retirement was overwhelming until SaarthiAI broke it down for me. Great tool for first-timers.", verified: true, createdAt: new Date() }
]

export default function Testimonials() {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [showForm, setShowForm] = useState(false)
  
  // Form State
  const [newRating, setNewRating] = useState(5)
  const [newType, setNewType] = useState('Health')
  const [newText, setNewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [hasReviewed, setHasReviewed] = useState(false)

  // ── FIREBASE SYNC ──────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      if (data.length === 0 && !loading) {
        seedInitialReviews()
      } else {
        setReviews(data)
        if (user) {
          setHasReviewed(data.some(r => r.uid === user.uid))
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, loading])

  const seedInitialReviews = async () => {
    try {
      for (const item of SEED_DATA) {
        await addDoc(collection(db, 'reviews'), {
          ...item,
          uid: 'seed-' + Math.random(),
          userAvatar: item.userName.charAt(0),
          approved: true,
          createdAt: serverTimestamp()
        })
      }
    } catch (err) {
      console.error("Seed error:", err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    if (newText.length < 20) {
      setToast({ type: 'error', msg: 'Review must be at least 20 characters.' })
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'reviews'), {
        uid: user.uid,
        userName: userProfile?.name || user.email.split('@')[0],
        userAvatar: (userProfile?.name || user.email).charAt(0).toUpperCase(),
        rating: newRating,
        insuranceType: newType,
        reviewText: newText,
        verified: true,
        approved: true,
        createdAt: serverTimestamp()
      })
      
      setToast({ type: 'success', msg: 'Review posted successfully!' })
      setShowForm(false)
      setNewText('')
    } catch (err) {
      setToast({ type: 'error', msg: 'Failed to post review. Try again.' })
    } finally {
      setSubmitting(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  const filteredReviews = useMemo(() => {
    if (activeTab === 'All') return reviews
    return reviews.filter(r => r.insuranceType === activeTab)
  }, [reviews, activeTab])

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 4.8
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }, [reviews])

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] animate-in slide-in-from-right-10 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
          toast.type === 'success' ? 'bg-[#0B1F4B] border-white/10 text-white' : 'bg-red-50 border-red-100 text-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="text-[#FF6B00]" /> : <X />}
          <span className="font-bold">{toast.msg}</span>
        </div>
      )}

      {/* ── STICKY NAVIGATION ── */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-[#0B1F4B] transition-colors text-sm font-bold tracking-tight"
          >
            <ArrowLeft size={18} /> BACK
          </button>
          <span className="text-[#0B1F4B] font-black tracking-tighter text-xl">
            Saarthi<span className="text-[#FF6B00]">AI</span> Support
          </span>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* ── HERO ── */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-[#0B1F4B] font-outfit mb-4 tracking-tighter">What Our Members Say</h1>
          <p className="text-gray-400 text-lg mb-8">Real stories of protection and clarity from our community.</p>
          
          <div className="inline-flex items-center gap-6 bg-gray-50 border border-gray-100 px-8 py-4 rounded-[2rem] shadow-sm">
            <div className="text-3xl font-black text-[#0B1F4B] font-outfit leading-none">{averageRating}</div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex flex-col items-start gap-0.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={16} className={star <= Math.round(averageRating) ? "fill-[#FF6B00] text-[#FF6B00]" : "text-gray-200"} />
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verified ({reviews.length} Reviews)</span>
            </div>
          </div>
        </div>

        {/* ── FILTERS & ACTION ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
            {['All', ...INSURANCE_TYPES].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                  ${activeTab === tab ? 'bg-[#0B1F4B] text-white shadow-xl shadow-blue-900/10' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          {!hasReviewed && !showForm && (
            <button 
              onClick={() => setShowForm(true)}
              className="bg-[#FF6B00] text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#e55f00] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <PlusCircle size={16} /> Write Review
            </button>
          )}
        </div>

        {/* ── WRITE FORM ── */}
        {showForm && (
          <div className="mb-20 animate-in slide-in-from-top-10 duration-500">
            <div className="bg-gray-50 rounded-[2.5rem] p-10 border border-gray-100 relative overflow-hidden ring-4 ring-gray-100/50">
              <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500"><X /></button>
              <h2 className="text-2xl font-black text-[#0B1F4B] font-outfit mb-2">Share your journey</h2>
              <form onSubmit={handleSubmit} className="mt-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">How was your experience?</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} type="button" onClick={() => setNewRating(star)}
                          className={`p-3 rounded-2xl transition-all ${newRating >= star ? 'bg-[#FF6B00] text-white' : 'bg-white text-gray-200 border border-gray-100'}`}
                        >
                          <Star size={24} className={newRating >= star ? "fill-white" : ""} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Insurance Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {INSURANCE_TYPES.map(type => (
                        <button 
                          key={type} type="button" onClick={() => setNewType(type)}
                          className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${newType === type ? 'border-[#FF6B00] bg-orange-50 text-[#FF6B00]' : 'border-white bg-white text-gray-400'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Your Story</label>
                  <textarea 
                    value={newText} onChange={(e) => setNewText(e.target.value)}
                    placeholder="Tell us how SaarthiAI helped you..."
                    className="w-full bg-white border border-gray-100 rounded-[2rem] p-6 min-h-[160px] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 transition-all font-medium text-[#0B1F4B]"
                  />
                </div>
                <button 
                  disabled={submitting}
                  className="w-full bg-[#0B1F4B] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1a2d5e] transition-all disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Story'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── REVIEWS GRID ── */}
        {loading ? (
          <div className="flex flex-col items-center py-20 grayscale opacity-20">
            <div className="w-12 h-12 border-4 border-[#0B1F4B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="mt-12">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                <HelpCircle className="mx-auto text-gray-200 mb-4" size={48} />
                <p className="text-gray-400 font-bold">No stories here yet.</p>
              </div>
            ) : (
              <ContainerScroll className="h-[140vh]">
                <div className="sticky left-0 top-0 h-svh w-full py-12 flex items-center justify-center">
                  <CardsContainer className="mx-auto size-full h-[400px] w-[350px]">
                    {filteredReviews.map((review, index) => (
                      <CardTransformed
                        key={review.id}
                        arrayLength={filteredReviews.length}
                        index={index}
                        variant="light"
                        className="bg-white border border-gray-100 shadow-xl"
                      >
                        <div className="flex flex-col items-center space-y-6 text-center">
                          <ReviewStars
                            rating={review.rating}
                            className="text-[#FF6B00]"
                          />
                          <div className="mx-auto w-full px-4 text-sm font-medium text-gray-500 italic leading-relaxed">
                            <blockquote>"{review.reviewText}"</blockquote>
                          </div>
                          
                          <div className="flex items-center gap-4 border-t border-gray-50 pt-6 w-full justify-center">
                            <Avatar className="size-12 border border-gray-100 shadow-sm">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userName}`}
                                alt={review.userName}
                              />
                              <AvatarFallback className="bg-[#0B1F4B] text-white">
                                {review.userName?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <span className="block text-sm font-bold text-[#0B1F4B] tracking-tight">
                                {review.userName || 'Member'}
                              </span>
                              <span className="block text-[10px] text-[#34D399] font-black uppercase tracking-widest">
                                {review.insuranceType} Policyholder
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardTransformed>
                    ))}
                  </CardsContainer>
                </div>
              </ContainerScroll>
            )}
          </div>
        )}

        {/* ── FOOTER CTA ── */}
        <div className="mt-20 text-center py-16 border-t border-gray-50">
          <h3 className="text-2xl font-black text-[#0B1F4B] font-outfit mb-4 tracking-tighter">Ready to join our protected community?</h3>
          <button 
            onClick={() => navigate('/chat')}
            className="text-[#FF6B00] font-black flex items-center gap-2 hover:gap-4 transition-all mx-auto"
          >
            Start your AI consultation <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
