import {
  doc, getDoc, setDoc, updateDoc, collection,
  addDoc, getDocs, query, where, orderBy,
  limit, serverTimestamp, arrayUnion,
} from 'firebase/firestore'
import { db } from './config'

// ─── USER PROFILE ──────────────────────────────────────────────────
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() })
}

// ─── CONSENT ──────────────────────────────────────────────────────
export const saveConsent = async (uid, consentData) => {
  await updateDoc(doc(db, 'users', uid), {
    consentGiven: true,
    consentTimestamp: serverTimestamp(),
    consentVersion: '1.0',
    consentDetails: consentData,       // { marketing, analytics, aiProcessing }
  })
  // Audit trail
  await addDoc(collection(db, 'consentAudit'), {
    uid,
    action: 'CONSENT_GIVEN',
    data: consentData,
    timestamp: serverTimestamp(),
    ipHash: 'hashed_ip',               // Hash in production
  })
}

export const revokeConsent = async (uid) => {
  await updateDoc(doc(db, 'users', uid), {
    consentGiven: false,
    consentRevoked: serverTimestamp(),
  })
  await addDoc(collection(db, 'consentAudit'), {
    uid,
    action: 'CONSENT_REVOKED',
    timestamp: serverTimestamp(),
  })
}

// ─── LIFE EVENTS ──────────────────────────────────────────────────
export const addLifeEvent = async (uid, event) => {
  await updateDoc(doc(db, 'users', uid), {
    lifeEvents: arrayUnion({ ...event, detectedAt: new Date().toISOString() }),
  })
}

export const getUserLifeEvents = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data().lifeEvents || []) : []
}

// ─── RECOMMENDATIONS ──────────────────────────────────────────────
export const saveRecommendations = async (uid, recommendations) => {
  await setDoc(doc(db, 'recommendations', uid), {
    uid,
    recommendations,
    generatedAt: serverTimestamp(),
  })
}

export const getRecommendations = async (uid) => {
  const snap = await getDoc(doc(db, 'recommendations', uid))
  return snap.exists() ? snap.data().recommendations : []
}

// ─── CHAT MESSAGES ────────────────────────────────────────────────
export const saveChatMessage = async (uid, message) => {
  await addDoc(collection(db, 'chats', uid, 'messages'), {
    ...message,
    timestamp: serverTimestamp(),
  })
}

export const getChatHistory = async (uid, msgLimit = 50) => {
  const q = query(
    collection(db, 'chats', uid, 'messages'),
    orderBy('timestamp', 'asc'),
    limit(msgLimit)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── BEHAVIOR TRACKING ────────────────────────────────────────────
export const trackBehavior = async (uid, event) => {
  await addDoc(collection(db, 'behaviorLogs'), {
    uid,
    event,
    timestamp: serverTimestamp(),
  })
}

// ─── AGENT DASHBOARD ──────────────────────────────────────────────
export const getAllCustomers = async () => {
  const q = query(collection(db, 'users'), where('role', '==', 'customer'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getHighIntentCustomers = async () => {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'customer'),
    where('intentScore', '>=', 70),
    orderBy('intentScore', 'desc'),
    limit(20)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── PRODUCTS ─────────────────────────────────────────────────────
export const getAllProducts = async () => {
  const snap = await getDocs(collection(db, 'products'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── AUDIT TRAIL (DPDP) ───────────────────────────────────────────
export const logAuditEvent = async (uid, action, details = {}) => {
  await addDoc(collection(db, 'auditLog'), {
    uid,
    action,
    details,
    timestamp: serverTimestamp(),
  })
}
