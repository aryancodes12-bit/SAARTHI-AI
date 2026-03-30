// src/firebase/firestore.js
import {
  doc, getDoc, setDoc, updateDoc, collection,
  addDoc, getDocs, query, where, orderBy,
  limit, serverTimestamp, arrayUnion, deleteDoc
} from 'firebase/firestore'
import { db } from './config'

// ── Clean display name (removes underscores, numbers, capitalizes) ────
function sanitizeDisplayName(rawName) {
  if (!rawName) return 'SaarthiAI User'
  const cleaned = rawName
    .replace(/[_\d]/g, ' ')   // underscores & digits → space
    .replace(/\s+/g, ' ')      // collapse spaces
    .trim()
  if (!cleaned) return 'SaarthiAI User'
  return cleaned
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

// ─── USER PROFILE ──────────────────────────────────────────────────
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() })
}

// ─── CREATE OR UPDATE USER PROFILE (called after login) ───────────
export const createOrUpdateUserProfile = async (user, provider) => {
  const userRef = doc(db, 'users', user.uid)
  const snap = await getDoc(userRef)

  const cleanName = sanitizeDisplayName(user.displayName)

  if (!snap.exists()) {
    // New user — create profile with sanitized name
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || null,
      phone: user.phoneNumber || null,
      displayName: cleanName,
      photoURL: user.photoURL || null,
      provider,
      role: 'customer',
      consentGiven: false,
      consentTimestamp: null,
      onboardingComplete: false,
      lifeEvents: [],
      behaviorData: {},
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    })
  } else {
    // Existing user — update last login & fix name if it was previously dirty
    await setDoc(userRef, {
      lastLogin: serverTimestamp(),
      displayName: cleanName,   // retroactively fix ugly names
    }, { merge: true })
  }
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
  // Check for duplicates before adding — same event type should not be added twice
  const snap = await getDoc(doc(db, 'users', uid))
  const existing = snap.exists() ? (snap.data().lifeEvents || []) : []
  const alreadyExists = existing.some(e => e.type === event.type)
  if (alreadyExists) return // Skip duplicate
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
  return snap.docs.map(d => ({ ...d.data(), id: d.id }))
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
export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}

export const getAllCustomers = async () => {
  const q = query(collection(db, 'users'), where('role', '==', 'customer'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ ...d.data(), id: d.id }))
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
  return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}

// ─── PRODUCTS ─────────────────────────────────────────────────────
export const getAllProducts = async () => {
  const snap = await getDocs(collection(db, 'products'))
  return snap.docs.map(d => ({ ...d.data(), id: d.id }))
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

// ─── POLICIES ─────────────────────────────────────────────────────
export const getPoliciesByCategory = async (category) => {
  const q = query(
    collection(db, 'policies'),
    where('category', '==', category)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}

export const getAllPolicies = async () => {
  const snap = await getDocs(collection(db, 'policies'))
  return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}

export const addPolicy = async (policyData) => {
  const docRef = await addDoc(collection(db, 'policies'), {
    ...policyData,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

export const deletePolicy = async (policyId) => {
  await deleteDoc(doc(db, 'policies', policyId))
}

export const deletePolicies = async (policyIds) => {
  const { writeBatch, doc } = await import('firebase/firestore')
  const batch = writeBatch(db)
  policyIds.forEach(id => {
    batch.delete(doc(db, 'policies', id))
  })
  await batch.commit()
}

export const deleteAllPolicies = async () => {
  const { writeBatch, getDocs, collection } = await import('firebase/firestore')
  const snap = await getDocs(collection(db, 'policies'))
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach(doc => batch.delete(doc.ref))
  await batch.commit()
}

// ─── USER PURCHASED POLICIES ──────────────────────────────────────
export const getPurchasedPolicies = async (uid) => {
  const userDoc = await getDoc(doc(db, 'users', uid))
  if (userDoc.exists()) {
    return userDoc.data().purchasedPolicies || []
  }
  return []
}

export const purchasePolicy = async (uid, policyData) => {
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, {
    purchasedPolicies: arrayUnion({
      ...policyData,
      purchasedAt: new Date().toISOString()
    })
  })
}

// ─── SEED POLICIES (Dynamic and accumulative) ──────────────────────────────
// ─── SEED POLICIES (Balanced Distribution) ──────────────────────────────
export const seedPolicies = async (count = 10) => {
  const UNIFIED_LOGO = "https://img.icons8.com/fluency/96/bank.png";

  const SEED_PLANS = [
    // --- HEALTH (4) ---
    {
      category: 'health',
      insurer: 'HDFC ERGO',
      name: 'Optima Restore',
      logo: UNIFIED_LOGO,
      premium: 8450,
      cover: '₹10 Lakhs',
      popular: true,
      url: 'https://www.hdfcergo.com/health-insurance/optima-restore-health-insurance',
      features: [
        { key: 'coverAmount', type: 'text', value: '₹10 Lakhs' },
        { key: 'hospitals', type: 'text', value: '13,000+', color: 'green' },
        { key: 'csr', type: 'text', value: '98.4%', color: 'green' },
        { key: 'waitingPeriod', type: 'text', value: '3 Years' },
        { key: 'roomRent', type: 'text', value: 'No Cap', color: 'green' },
        { key: 'copay', type: 'text', value: 'Nil', color: 'green' },
        { key: 'restoration', type: 'boolean', value: true },
        { key: 'maternity', type: 'boolean', value: false },
      ],
    },
    {
      category: 'health',
      insurer: 'Star Health',
      name: 'Comprehensive',
      logo: UNIFIED_LOGO,
      premium: 9100,
      cover: '₹15 Lakhs',
      popular: false,
      url: 'https://www.starhealth.in/health-insurance/star-comprehensive-insurance-policy',
      features: [
        { key: 'coverAmount', type: 'text', value: '₹15 Lakhs' },
        { key: 'hospitals', type: 'text', value: '14,000+', color: 'green' },
        { key: 'csr', type: 'text', value: '89.9%', color: 'yellow' },
        { key: 'waitingPeriod', type: 'text', value: '3 Years' },
        { key: 'roomRent', type: 'text', value: 'Single Private' },
        { key: 'copay', type: 'text', value: 'Nil', color: 'green' },
        { key: 'restoration', type: 'boolean', value: true },
        { key: 'maternity', type: 'boolean', value: true },
      ],
    },
    {
      category: 'health',
      insurer: 'Care Health',
      name: 'Care Supreme',
      logo: UNIFIED_LOGO,
      premium: 7800,
      cover: '₹7 Lakhs',
      popular: true,
      url: 'https://www.careinsurance.com/health-insurance/care-supreme',
      features: [
        { key: 'coverAmount', type: 'text', value: '₹7 Lakhs' },
        { key: 'hospitals', type: 'text', value: '11,000+', color: 'green' },
        { key: 'csr', type: 'text', value: '95.2%', color: 'green' },
        { key: 'waitingPeriod', type: 'text', value: '4 Years' },
        { key: 'roomRent', type: 'text', value: 'No Cap' },
        { key: 'copay', type: 'text', value: 'Nil' },
      ],
    },
    {
      category: 'health',
      insurer: 'Niva Bupa',
      name: 'ReAssure',
      logo: UNIFIED_LOGO,
      premium: 8900,
      cover: '₹10 Lakhs',
      popular: false,
      url: 'https://www.nivabupa.com/health-insurance-plans/reassure.html',
      features: [
        { key: 'coverAmount', type: 'text', value: '₹10 Lakhs' },
        { key: 'hospitals', type: 'text', value: '9,000+', color: 'green' },
        { key: 'csr', type: 'text', value: '91.0%', color: 'green' },
        { key: 'restoration', type: 'boolean', value: true },
      ],
    },
    // --- TERM (4) ---
    {
      category: 'term',
      insurer: 'ICICI Prudential',
      name: 'iProtect Smart',
      logo: UNIFIED_LOGO,
      premium: 10400,
      cover: '₹1 Crore',
      popular: true,
      url: 'https://www.iciciprulife.com/term-insurance-plans/iprotect-smart-term-plan.html',
      features: [
        { key: 'coverAmount', type: 'text', value: '₹1 Crore' },
        { key: 'term', type: 'text', value: 'Up to 85 yrs' },
        { key: 'csr', type: 'text', value: '97.9%', color: 'green' },
        { key: 'rop', type: 'boolean', value: true },
        { key: 'accidental', type: 'boolean', value: true },
        { key: 'critical', type: 'boolean', value: true },
        { key: 'waiver', type: 'boolean', value: true },
        { key: 'claimTime', type: 'text', value: '< 3 Days', color: 'green' },
      ],
    },
    {
      category: 'term',
      insurer: 'Max Life',
      name: 'Smart Secure Plus',
      logo: UNIFIED_LOGO,
      premium: 11200,
      cover: '₹1 Crore',
      popular: false,
      url: 'https://www.maxlifeinsurance.com/term-insurance-plans/smart-secure-plus-plan',
      features: [
        { key: 'coverAmount', type: 'text', value: '₹1 Crore' },
        { key: 'term', type: 'text', value: 'Up to 85 yrs' },
        { key: 'csr', type: 'text', value: '99.5%', color: 'green' },
        { key: 'rop', type: 'boolean', value: true },
        { key: 'accidental', type: 'boolean', value: true },
        { key: 'critical', type: 'boolean', value: false },
        { key: 'waiver', type: 'boolean', value: true },
        { key: 'claimTime', type: 'text', value: '< 5 Days', color: 'green' },
      ],
    },
    {
      category: 'term',
      insurer: 'LIC of India',
      name: 'Tech Term',
      logo: UNIFIED_LOGO,
      premium: 12000,
      cover: '₹1 Crore',
      popular: false,
      url: 'https://www.licindia.in/tech-term',
      features: [
        { key: 'coverAmount', type: 'text', value: '₹1 Crore' },
        { key: 'term', type: 'text', value: 'Up to 80 yrs' },
        { key: 'csr', type: 'text', value: '98.5%', color: 'green' },
      ],
    },
    {
      category: 'term',
      insurer: 'HDFC Life',
      name: 'Click 2 Protect Super',
      logo: UNIFIED_LOGO,
      premium: 10800,
      cover: '₹1.5 Crore',
      popular: true,
      url: 'https://www.hdfclife.com/term-insurance-plans/click-2-protect-super',
      features: [
        { key: 'coverAmount', type: 'text', value: '₹1.5 Crore' },
        { key: 'term', type: 'text', value: 'Up to 85 yrs' },
        { key: 'csr', type: 'text', value: '99.3%', color: 'green' },
      ],
    },
    // --- MOTOR (4) ---
    {
      category: 'motor',
      insurer: 'Tata AIG',
      name: 'Car Protect',
      logo: UNIFIED_LOGO,
      premium: 9800,
      cover: '₹5L IDV',
      popular: true,
      url: 'https://www.tataaig.com/motor-insurance/car-insurance',
      features: [
        { key: 'coverAmount', type: 'text', value: '₹5L IDV' },
        { key: 'network', type: 'text', value: '7,500+', color: 'green' },
        { key: 'csr', type: 'text', value: '98.0%', color: 'green' },
        { key: 'zeroDep', type: 'boolean', value: true },
        { key: 'rti', type: 'boolean', value: true },
        { key: 'roadside', type: 'boolean', value: true },
        { key: 'consumables', type: 'boolean', value: true },
        { key: 'inspection', type: 'text', value: 'Self / Video' },
      ],
    },
    {
      category: 'motor',
      insurer: 'Go Digit',
      name: 'Car Protect',
      logo: UNIFIED_LOGO,
      premium: 8500,
      cover: '₹4.5L IDV',
      popular: false,
      url: 'https://www.godigit.com/motor-insurance/car-insurance',
      features: [
        { key: 'coverAmount', type: 'text', value: '₹4.5L IDV' },
        { key: 'network', type: 'text', value: '6,900+', color: 'green' },
        { key: 'csr', type: 'text', value: '96.0%', color: 'green' },
        { key: 'zeroDep', type: 'boolean', value: true },
        { key: 'rti', type: 'boolean', value: false },
        { key: 'roadside', type: 'boolean', value: true },
        { key: 'consumables', type: 'boolean', value: false },
        { key: 'inspection', type: 'text', value: 'Self Photo' },
      ],
    },
    {
      category: 'motor',
      insurer: 'Bajaj Allianz',
      name: 'DriveAssure',
      logo: UNIFIED_LOGO,
      premium: 9200,
      cover: '₹6L IDV',
      popular: true,
      url: 'https://www.bajajallianz.com/motor-insurance/car-insurance.html',
      features: [
        { key: 'coverAmount', type: 'text', value: '₹6L IDV' },
        { key: 'network', type: 'text', value: '4,000+', color: 'green' },
        { key: 'zeroDep', type: 'boolean', value: true },
      ],
    },
    {
      category: 'motor',
      insurer: 'SBI General',
      name: 'Private Car Insurance',
      logo: UNIFIED_LOGO,
      premium: 8900,
      cover: '₹5.5L IDV',
      popular: false,
      url: 'https://www.sbigeneral.in/motor-insurance/car-insurance',
      features: [
        { key: 'coverAmount', type: 'text', value: '₹5.5L IDV' },
        { key: 'network', type: 'text', value: '5,500+', color: 'green' },
        { key: 'csr', type: 'text', value: '95.0%', color: 'green' },
      ],
    },
  ];

  const categories = ['health', 'term', 'motor'];
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

  for (let i = 0; i < count; i++) {
    // Round-robin category selection
    const cat = categories[i % 3];
    const categoryOptions = SEED_PLANS.filter(p => p.category === cat);
    
    // Pick template within that category
    const templateIdx = Math.floor(i / 3) % categoryOptions.length;
    const template = categoryOptions[templateIdx];
    
    // Add small random variation to premium (+/- 10%)
    const variation = 0.9 + (Math.random() * 0.2);
    const randomizedPremium = Math.round(template.premium * variation);

    await addDoc(
      collection(db, 'policies'),
      { 
        ...template, 
        premium: randomizedPremium,
        seededAt: serverTimestamp() 
      }
    );
  }

  return count;
};