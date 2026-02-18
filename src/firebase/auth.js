import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// ─── Google Sign In ────────────────────────────────────────────────
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    await createOrUpdateUserProfile(user, 'google')
    return { success: true, user }
  } catch (err) {
    console.error('Google sign-in error:', err)
    return { success: false, error: err.message }
  }
}

// ─── OTP — Step 1: Send OTP ────────────────────────────────────────
export async function sendOTP(phoneNumber, recaptchaContainerId) {
  try {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
      callback: () => {},
    })
    const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
    window.confirmationResult = confirmation
    return { success: true }
  } catch (err) {
    console.error('OTP send error:', err)
    return { success: false, error: err.message }
  }
}

// ─── OTP — Step 2: Verify OTP ──────────────────────────────────────
export async function verifyOTP(otp) {
  try {
    if (!window.confirmationResult) throw new Error('No OTP session. Please resend.')
    const result = await window.confirmationResult.confirm(otp)
    const user = result.user
    await createOrUpdateUserProfile(user, 'phone')
    return { success: true, user }
  } catch (err) {
    console.error('OTP verify error:', err)
    return { success: false, error: err.message }
  }
}

// ─── Create/Update User Profile ────────────────────────────────────
export async function createOrUpdateUserProfile(user, provider) {
  const userRef = doc(db, 'users', user.uid)
  const snap = await getDoc(userRef)

  if (!snap.exists()) {
    // New user — create profile
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || null,
      phone: user.phoneNumber || null,
      displayName: user.displayName || 'SaarthiAI User',
      photoURL: user.photoURL || null,
      provider,
      role: 'customer',              // 'customer' | 'agent' | 'admin'
      consentGiven: false,
      consentTimestamp: null,
      onboardingComplete: false,
      lifeEvents: [],
      behaviorData: {},
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    })
  } else {
    // Existing user — update last login
    await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true })
  }
}

// ─── Sign Out ──────────────────────────────────────────────────────
export async function logOut() {
  await signOut(auth)
}

// ─── Auth State Listener ───────────────────────────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}
