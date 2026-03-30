import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, Plus, Search, ChevronRight, 
  Clock, CheckCircle2, AlertCircle, XCircle, 
  ArrowLeft, Upload, Send, Link as LinkIcon,
  X, Download, Paperclip, Phone
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { db } from '../firebase/config'
import { 
  collection, addDoc, getDocs, query, 
  where, orderBy, serverTimestamp 
} from 'firebase/firestore'

// ─── Constants ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  submitted:    { label: 'Submitted',    color: 'text-blue-600',   bg: 'bg-blue-50',   icon: <Send size={14} /> },
  under_review: { label: 'Under Review', color: 'text-orange-600', bg: 'bg-orange-50', icon: <Clock size={14} /> },
  approved:     { label: 'Approved',     color: 'text-green-600',  bg: 'bg-green-50',  icon: <CheckCircle2 size={14} /> },
  rejected:     { label: 'Rejected',     color: 'text-red-600',    bg: 'bg-red-50',    icon: <XCircle size={14} /> },
}

const MAX_FILES     = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const ALLOWED_EXT   = ['.pdf', '.jpg', '.jpeg', '.png']

// ─── Helpers ──────────────────────────────────────────────────────
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const generateClaimId = () => `C-${Math.floor(100000 + Math.random() * 900000)}`

// ─── Main Component ───────────────────────────────────────────────
export default function ClaimsTracker() {
  const { user, userProfile } = useAuth()
  const navigate = useNavigate()
  const dropRef  = useRef(null)
  
  const [claims,    setClaims]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [error,     setError]     = useState(null)
  const [successId, setSuccessId] = useState(null)
  const [dragOver,  setDragOver]  = useState(false)

  const [formData, setFormData] = useState({
    policyType:   'health',
    incidentDate: '',
    claimAmount:  '',
    description:  '',
    providerName: '',
    contactNumber: '',
  })
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [fileErrors,    setFileErrors]    = useState([])
  const [submitting,    setSubmitting]    = useState(false)

  // Pre-fill contact from profile
  useEffect(() => {
    if (userProfile) {
      const mobile = userProfile.mobileNumber || userProfile.phoneNumber || userProfile.mobile || ''
      setFormData(prev => ({ ...prev, contactNumber: mobile }))
    }
  }, [userProfile])

  useEffect(() => {
    if (user) fetchClaims()
  }, [user])

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchClaims = async (useOrderBy = true) => {
    setError(null)
    try {
      let q
      if (useOrderBy) {
        q = query(
          collection(db, 'claims'),
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
      } else {
        q = query(
          collection(db, 'claims'),
          where('uid', '==', user.uid)
        )
      }
      const snap = await getDocs(q)
      let fetchedClaims = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Manual sort if index is missing
      if (!useOrderBy) {
        fetchedClaims.sort((a, b) => {
          const t1 = a.createdAt?.toMillis?.() || 0
          const t2 = b.createdAt?.toMillis?.() || 0
          return t2 - t1
        })
      }
      
      setClaims(fetchedClaims)
    } catch (err) {
      console.error('Error fetching claims:', err)
      
      // If index is missing, try once without orderBy
      if (useOrderBy && (err.code === 'failed-precondition' || err.message?.toLowerCase().includes('index'))) {
        console.warn('Index building... falling back to manual sort.')
        return fetchClaims(false)
      }

      if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission')) {
        setError('permission')
      } else {
        setError('generic')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── File Handling ──────────────────────────────────────────────
  const processFiles = (rawFiles) => {
    const newErrors = []
    const accepted  = [...uploadedFiles]

    Array.from(rawFiles).forEach(file => {
      if (accepted.length >= MAX_FILES) {
        newErrors.push(`Max ${MAX_FILES} files allowed.`)
        return
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        newErrors.push(`"${file.name}" — only PDF, JPG, PNG allowed.`)
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        newErrors.push(`"${file.name}" — exceeds 5 MB limit.`)
        return
      }
      if (accepted.find(f => f.name === file.name && f.size === file.size)) {
        newErrors.push(`"${file.name}" is already added.`)
        return
      }
      accepted.push(file)
    })

    setUploadedFiles(accepted)
    setFileErrors(newErrors)
  }

  const handleFileSelect = (e) => processFiles(e.target.files)
  const removeFile       = (idx) => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))

  // Drag & Drop
  const handleDragOver  = (e) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = ()  => setDragOver(false)
  const handleDrop      = (e) => { 
    e.preventDefault()
    setDragOver(false)
    processFiles(e.dataTransfer.files)
  }

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Convert all files to base64
      const attachments = await Promise.all(
        uploadedFiles.map(async (file) => ({
          name:     file.name,
          size:     file.size,
          type:     file.type,
          base64:   await fileToBase64(file),
        }))
      )

      const claimId = generateClaimId()
      const newClaim = {
        uid:           user.uid,
        userName:      userProfile?.displayName || user.email || 'Unknown',
        userEmail:     userProfile?.email || user.email || '',
        claimId,
        ...formData,
        status:        'submitted',
        attachments,
        timeline: [
          { status: 'submitted', date: new Date().toISOString(), note: 'Claim submitted by customer.' }
        ],
        createdAt: serverTimestamp()
      }

      await addDoc(collection(db, 'claims'), newClaim)

      // Success
      setSuccessId(claimId)
      setShowForm(false)
      setFormData({ policyType: 'health', incidentDate: '', claimAmount: '', description: '', providerName: '', contactNumber: userProfile?.mobileNumber || '' })
      setUploadedFiles([])
      setFileErrors([])
      fetchClaims()

      // Auto-hide success after 10s
      setTimeout(() => setSuccessId(null), 10000)
    } catch (err) {
      console.error('Claim submit error:', err)
      if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission')) {
        setError('permission')
      } else {
        setError('submit')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto font-inter min-h-screen pb-32 bg-gray-50/50">
      
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-gray-400 hover:text-[#0B1F4B] transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0B1F4B] font-outfit">Claims Tracker</h1>
            <p className="text-gray-400 text-sm mt-1 font-medium">Manage and track your insurance claim requests.</p>
          </div>
          <button 
            onClick={() => { setShowForm(!showForm); setError(null); setSuccessId(null) }}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow-lg bg-gradient-to-br from-[#FF6B00] to-orange-600 hover:scale-105 transition-all active:scale-95"
          >
            {showForm ? <><X size={18} /> Cancel</> : <><Plus size={20} /> File New Claim</>}
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successId && (
        <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-4 animate-in fade-in">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="text-green-600" size={28} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-green-800 text-lg">Claim Submitted Successfully!</h3>
            <p className="text-green-700 text-sm mt-1">
              Your team will review this in <strong>3–5 business days</strong>. 
              Track using Claim ID: <span className="font-black text-green-900 bg-green-100 px-2 py-0.5 rounded-lg">#{successId}</span>
            </p>
          </div>
          <button onClick={() => setSuccessId(null)} className="text-green-400 hover:text-green-700 transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={22} />
          <div>
            {error === 'permission' ? (
              <>
                <p className="font-bold text-red-700">Firebase Permission Denied</p>
                <p className="text-red-600 text-sm mt-1">
                  The security rules for the claims collection have not been configured. 
                  Please add the required Firestore rules in the Firebase Console.<br />
                  <span className="text-xs text-red-500 mt-1 block">If this error persists, contact support at support@saarthi-ai.com</span>
                </p>
              </>
            ) : error === 'submit' ? (
              <>
                <p className="font-bold text-red-700">Failed to submit claim.</p>
                <p className="text-red-600 text-sm mt-1">Please try again. If the error persists, contact support at support@saarthi-ai.com</p>
              </>
            ) : (
              <>
                <p className="font-bold text-red-700">Could not load claims.</p>
                <p className="text-red-600 text-sm mt-1">Check your internet connection or contact support at support@saarthi-ai.com</p>
              </>
            )}
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 transition-colors ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {/* ── Claim Form ── */}
      {showForm && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-[#0B1F4B] font-outfit mb-6 flex items-center gap-2">
            <FileText className="text-[#FF6B00]" /> Submit New Claim
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT COL */}
            <div className="space-y-4">
              {/* Policy Type */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Policy Type *</label>
                <select 
                  name="policyType" value={formData.policyType} onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all font-medium text-gray-700"
                  required
                >
                  <option value="health">Health Insurance</option>
                  <option value="term">Term Life Insurance</option>
                  <option value="motor">Motor Insurance</option>
                  <option value="home">Home Insurance</option>
                </select>
              </div>

              {/* Incident Date */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Incident Date *</label>
                <input 
                  type="date" name="incidentDate" value={formData.incidentDate} onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all font-medium text-gray-700"
                  required
                />
              </div>

              {/* Claim Amount */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Estimated Claim Amount (₹) *</label>
                <input 
                  type="number" name="claimAmount" placeholder="e.g. 50000" value={formData.claimAmount} onChange={handleInputChange}
                  min="1"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all font-medium text-gray-700"
                  required
                />
              </div>

              {/* Hospital / Provider */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Hospital / Provider Name</label>
                <input 
                  type="text" name="providerName" placeholder="e.g. Apollo Hospitals, Delhi" value={formData.providerName} onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all font-medium text-gray-700"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
                  <Phone size={10} /> Contact Number
                </label>
                <input 
                  type="tel" name="contactNumber" placeholder="+91 9XXXXXXXXX" value={formData.contactNumber} onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all font-medium text-gray-700"
                />
              </div>
            </div>

            {/* RIGHT COL */}
            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Brief Description *</label>
                <textarea 
                  name="description" rows="4" placeholder="Tell us what happened..."
                  value={formData.description} onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all font-medium text-gray-700 resize-none"
                  required
                />
              </div>

              {/* File Upload — Drag & Drop */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                  Supporting Documents ({uploadedFiles.length}/{MAX_FILES})
                </label>
                <div
                  ref={dropRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative p-5 border-2 border-dashed rounded-xl text-center transition-all ${
                    dragOver 
                      ? 'border-[#FF6B00] bg-orange-50/80 scale-[1.02]' 
                      : 'border-orange-200 bg-orange-50/30 hover:border-[#FF6B00] hover:bg-orange-50/60'
                  }`}
                >
                  <Upload className={`mx-auto mb-2 ${dragOver ? 'text-[#FF6B00]' : 'text-orange-400'}`} size={28} />
                  <p className="text-xs font-bold text-orange-700">Drag & drop files here</p>
                  <p className="text-[10px] text-orange-500/80 mt-1">PDF, JPG, PNG only • Max 5MB per file • Max 5 files</p>
                  
                  <label className="mt-3 inline-block text-[10px] bg-white border border-orange-200 text-orange-700 font-black px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors uppercase tracking-widest cursor-pointer">
                    Browse Files
                    <input
                      type="file"
                      multiple
                      accept={ALLOWED_EXT.join(',')}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* File errors */}
                {fileErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {fileErrors.map((err, i) => (
                      <p key={i} className="text-[10px] text-red-500 font-medium flex items-center gap-1">
                        <X size={10} /> {err}
                      </p>
                    ))}
                  </div>
                )}

                {/* File list */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                        <Paperclip size={14} className="text-[#FF6B00] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-700 truncate">{file.name}</p>
                          <p className="text-[10px] text-gray-400">{formatBytes(file.size)}</p>
                        </div>
                        <button type="button" onClick={() => removeFile(idx)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="md:col-span-2 pt-4 border-t border-gray-50 flex justify-end">
              <button 
                type="submit" 
                disabled={submitting}
                className="flex items-center gap-2 px-12 py-3 rounded-xl text-white font-bold shadow-lg bg-gradient-to-br from-[#FF6B00] to-orange-600 hover:scale-105 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting 
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                  : <><Send size={18} /> Submit Claim</>
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Claims List ── */}
      {!showForm && (
        <div className="space-y-6">
          {loading ? (
            <div className="grid gap-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-white h-44 rounded-3xl animate-pulse border border-gray-50" />
              ))}
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <FileText className="text-gray-200" size={40} />
              </div>
              <h3 className="text-xl font-bold text-[#0B1F4B] font-outfit">No claims found</h3>
              <p className="text-gray-400 text-sm mt-1">You haven't filed any insurance claims yet.</p>
              <button 
                onClick={() => setShowForm(true)}
                className="mt-6 px-8 py-3 rounded-xl text-white font-bold bg-gradient-to-br from-[#FF6B00] to-orange-600 shadow-lg hover:scale-105 transition-all"
              >
                File Your First Claim
              </button>
            </div>
          ) : (
            claims.map(claim => (
              <ClaimCard key={claim.id} claim={claim} />
            ))
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 p-6 bg-orange-50/30 rounded-2xl border border-dashed border-orange-100">
        <p className="text-xs text-orange-800 leading-relaxed font-medium">
          Note: This is a claim tracking simulation for advisory purposes. SaarthiAI assists in processing but final claim approval rests with the respective insurance provider.
        </p>
      </div>
    </div>
  )
}

// ─── Claim Card ───────────────────────────────────────────────────
function ClaimCard({ claim }) {
  const navigate = useNavigate()
  const cfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.submitted
  const STEPS = ['submitted', 'under_review', 'approved']

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:border-[#FF6B00]/30 hover:shadow-md transition-all">
      <div className="p-6 md:p-8">

        {/* Top row */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-[#0B1F4B]/5 rounded-2xl flex items-center justify-center text-[#0B1F4B] flex-shrink-0">
              <FileText size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-[#0B1F4B] font-outfit capitalize">{claim.policyType} Claim</h3>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold font-mono tracking-tighter">#{claim.claimId}</span>
              </div>
              <p className="text-sm font-medium text-gray-400">
                Filed {claim.createdAt?.toDate ? new Date(claim.createdAt.toDate()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </p>
              {claim.providerName && (
                <p className="text-xs text-gray-400 mt-0.5">🏥 {claim.providerName}</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:items-end gap-2">
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
            <p className="text-2xl font-black text-[#0B1F4B] font-outfit">₹{Number(claim.claimAmount).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative pt-2 overflow-x-auto">
          <div className="flex items-center min-w-[400px] mb-10 px-2">
            {STEPS.map((step, idx) => {
              const isDone       = claim.timeline?.some(t => t.status === step)
              const isRejected   = claim.status === 'rejected' && idx === 2
              const dateEntry    = claim.timeline?.find(t => t.status === step)
              
              return (
                <div key={step} className="flex-1 flex items-center relative">
                  <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                    isDone      ? 'bg-[#FF6B00] border-[#FF6B00] text-white shadow-lg shadow-orange-100' 
                    : isRejected ? 'bg-red-500 border-red-500 text-white' 
                    : 'bg-white border-gray-200 text-gray-300'
                  }`}>
                    {isDone ? <CheckCircle2 size={16} /> : isRejected ? <XCircle size={16} /> : idx + 1}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 ${
                      isDone && claim.timeline?.some(t => t.status === STEPS[idx + 1]) 
                        ? 'bg-[#FF6B00]' 
                        : 'bg-gray-100'
                    }`} />
                  )}
                  <div className="absolute top-10 left-0 w-24">
                    <p className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${isDone ? 'text-[#0B1F4B]' : 'text-gray-300'}`}>
                      {step.replace('_', ' ')}
                    </p>
                    {isDone && dateEntry && (
                      <p className="text-[9px] text-gray-400 font-medium">
                        {new Date(dateEntry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Attachments */}
        {claim.attachments?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
              <Paperclip size={10} /> Documents ({claim.attachments.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {claim.attachments.map((att, i) => (
                <a
                  key={i}
                  href={att.base64}
                  download={att.name}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 rounded-xl px-3 py-2 transition-all group/doc"
                  title={`Download ${att.name}`}
                >
                  <Paperclip size={12} className="text-[#FF6B00]" />
                  <span className="text-xs font-bold text-gray-700 group-hover/doc:text-[#FF6B00] transition-colors max-w-[120px] truncate">{att.name}</span>
                  <Download size={12} className="text-gray-300 group-hover/doc:text-[#FF6B00] transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="bg-gray-50/50 px-6 py-4 flex justify-between items-center border-t border-gray-100/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/my-policies')}
            className="text-xs font-bold text-[#0B1F4B] hover:text-[#FF6B00] flex items-center gap-1.5 transition-colors"
          >
            <LinkIcon size={14} /> View Policy
          </button>
          <button 
            onClick={() => navigate('/support')}
            className="text-xs font-bold text-[#0B1F4B] hover:text-[#FF6B00] flex items-center gap-1.5 transition-colors"
          >
            <AlertCircle size={14} /> Contact Support
          </button>
        </div>
        <ChevronRight size={18} className="text-gray-300 group-hover:text-[#FF6B00] transition-colors" />
      </div>
    </div>
  )
}
