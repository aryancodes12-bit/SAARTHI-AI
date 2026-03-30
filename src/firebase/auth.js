import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
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

// ─── Email/Password Sign Up ────────────────────────────────────────
export async function signUpWithEmail(email, password, displayName) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const user = result.user

    // Set display name on Firebase Auth profile
    await updateProfile(user, { displayName })

    // Send verification email
    await sendEmailVerification(user)

    // Create Firestore profile
    await createOrUpdateUserProfile({ ...user, displayName }, 'email')

    return { success: true, user, needsVerification: true }
  } catch (err) {
    console.error('Email sign-up error:', err)
    const msg = friendlyAuthError(err.code)
    return { success: false, error: msg }
  }
}

// ─── Email/Password Sign In ────────────────────────────────────────
export async function signInWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const user = result.user

    if (!user.emailVerified) {
      await signOut(auth) // Force sign-out until email is verified
      return { success: false, error: 'Please verify your email before signing in. Check your inbox for the verification link.' }
    }

    await createOrUpdateUserProfile(user, 'email')
    return { success: true, user }
  } catch (err) {
    console.error('Email sign-in error:', err)
    return { success: false, error: friendlyAuthError(err.code) }
  }
}

// ─── Resend Verification Email ─────────────────────────────────────
export async function resendVerificationEmail() {
  try {
    const user = auth.currentUser
    if (user) await sendEmailVerification(user)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ─── Friendly Error Messages ───────────────────────────────────────
function friendlyAuthError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with this email. Please sign up.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Incorrect email or password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}

