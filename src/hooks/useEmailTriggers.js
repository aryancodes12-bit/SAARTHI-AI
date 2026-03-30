// src/hooks/useEmailTriggers.js
// ─────────────────────────────────────────────────────────────────────────────
// DROP-IN HOOK — import and call initEmailTriggers(user, userProfile) once
// inside CustomerDashboard.jsx useEffect
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import emailjs from '@emailjs/browser'

const EMAILJS_SERVICE_ID = 'service_n7mx59n'
const EMAILJS_TEMPLATE_ID = 'template_q17vqyq'
const EMAILJS_PUBLIC_KEY = 'h8aFcNKUWZTN8_R4O'

// ─── Helper: send one email via EmailJS ──────────────────────────────────────
async function sendEmail({ toEmail, toName, subject, message }) {
    try {
        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            { to_email: toEmail, to_name: toName, name: toName, subject, message },
            EMAILJS_PUBLIC_KEY
        )
        console.log(`📧 Email sent: ${subject}`)
        return true
    } catch (err) {
        console.error('❌ EmailJS error:', err)
        return false
    }
}

// ─── Helper: get/create trigger state doc in Firestore ───────────────────────
async function getTriggerState(uid) {
    const ref = doc(db, 'emailTriggers', uid)
    const snap = await getDoc(ref)
    if (snap.exists()) return { ref, data: snap.data() }
    // First time — create empty state
    const initial = {
        uid,
        welcomeSent: false,
        firstLoginAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        day3Sent: false,
        day7Sent: false,
        day14Sent: false,
        inactivityReminderSent: false,
        lastInactivityCheck: new Date().toISOString(),
        productViewCounts: {},       // { productName: count }
        productEmailSentFor: [],     // product names already emailed
        scrollDepthEmailSent: false,
        scrollDepth75Reached: false,
        timeSpentEmailSent: false,
        totalTimeSpentSeconds: 0,
    }
    await setDoc(ref, initial)
    return { ref, data: initial }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 1 — TIME-BASED (Day 3, Day 7, Day 14 after first login)
// ─────────────────────────────────────────────────────────────────────────────
async function checkTimeTriggers(user, userProfile, state, ref) {
    const firstName = userProfile?.displayName?.split(' ')[0] || 'there'
    const email = user.email
    const firstLogin = new Date(state.firstLoginAt)
    const now = new Date()
    const daysSince = Math.floor((now - firstLogin) / (1000 * 60 * 60 * 24))

    const updates = {}

    if (daysSince >= 3 && !state.day3Sent) {
        await sendEmail({
            toEmail: email, toName: firstName,
            subject: `${firstName}, your personalised insurance plan is waiting 🛡️`,
            message: `Namaste ${firstName}! 🙏\n\nIt's been 3 days since you joined SaarthiAI. We noticed you haven't explored your personalised insurance recommendations yet.\n\n🎯 Our AI has already identified the best plans for your profile:\n• ✅ Top 3 plans curated just for you\n• ✅ Instant quotes — no agent needed\n• ✅ Compare 50+ insurers in seconds\n\nDon't let your family go unprotected another day.\n\n👉 View your plan now: https://saarthi-ai-mu.vercel.app/\n\nTeam SaarthiAI 🛡️`,
        })
        updates.day3Sent = true
    }

    if (daysSince >= 7 && !state.day7Sent) {
        await sendEmail({
            toEmail: email, toName: firstName,
            subject: `${firstName}, 1 week in — have you secured your family yet? ⏳`,
            message: `Namaste ${firstName}! 🙏\n\nA week has passed since you joined SaarthiAI.\n\n⚠️ Quick fact: Every day without adequate cover is a day your family is financially exposed.\n\n📊 India Reality Check:\n• Medical inflation: 14% per year\n• Avg ICU cost: ₹15,000/day\n• 80% of Indians are underinsured\n\n🤖 Your AI advisor has kept your personalised plan updated and ready for you.\n\n⏱️ Takes just 2 minutes to review.\n\n👉 https://saarthi-ai-mu.vercel.app/\n\nTeam SaarthiAI`,
        })
        updates.day7Sent = true
    }

    if (daysSince >= 14 && !state.day14Sent) {
        await sendEmail({
            toEmail: email, toName: firstName,
            subject: `${firstName}, your protection gap is growing 📈`,
            message: `Namaste ${firstName}! 🙏\n\n2 weeks in — and your insurance profile is still incomplete.\n\nHere's what our AI has been holding for you:\n\n💡 EXCLUSIVE 14-DAY INSIGHT:\n• Coverage gap analysis: READY\n• 3 personalised plan options: READY\n• Premium comparison across 50+ insurers: READY\n\nAll free. No agent calls. No spam.\n\nJust your AI advisor, working silently for you.\n\n🔗 Access your full report: https://saarthi-ai-mu.vercel.app/\n\nTeam SaarthiAI 🛡️\n\nP.S. Life events like marriage, home purchase, or a new baby can change your insurance needs overnight. Have any of these happened recently?`,
        })
        updates.day14Sent = true
    }

    if (Object.keys(updates).length > 0) {
        await updateDoc(ref, updates)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 2 — INACTIVITY (7 days since last login)
// ─────────────────────────────────────────────────────────────────────────────
async function checkInactivityTrigger(user, userProfile, state, ref) {
    const firstName = userProfile?.displayName?.split(' ')[0] || 'there'
    const lastLogin = new Date(state.lastLoginAt)
    const now = new Date()
    const daysSince = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24))

    // Update lastLoginAt on every visit
    await updateDoc(ref, {
        lastLoginAt: new Date().toISOString(),
        inactivityReminderSent: daysSince >= 7 ? state.inactivityReminderSent : false, // reset if they came back
    })

    if (daysSince >= 7 && !state.inactivityReminderSent) {
        await sendEmail({
            toEmail: user.email, toName: firstName,
            subject: `${firstName}, we missed you! Your plan needs a review 👀`,
            message: `Namaste ${firstName}! 🙏\n\nWe noticed you haven't visited SaarthiAI in over a week.\n\nA lot can change in 7 days — market rates, new plan launches, your personal situation.\n\n🔔 What's new for you:\n• Fresh AI recommendations based on latest data\n• New low-cost term life options just listed\n• Updated health plan comparisons\n\nYour profile is still saved. Pick up right where you left off.\n\n👉 Come back: https://saarthi-ai-mu.vercel.app/\n\nWe're here whenever you need us 🛡️\n\nTeam SaarthiAI`,
        })
        await updateDoc(ref, { inactivityReminderSent: true })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 3 — BEHAVIOR-BASED (product viewed 3+ times)
// ─────────────────────────────────────────────────────────────────────────────
export async function trackProductViewAndEmail(user, userProfile, productName, productType) {
    if (!user?.email) return
    const firstName = userProfile?.displayName?.split(' ')[0] || 'there'

    const { ref, data: state } = await getTriggerState(user.uid)

    const currentCount = (state.productViewCounts?.[productName] || 0) + 1
    const alreadySent = state.productEmailSentFor?.includes(productName)

    await updateDoc(ref, {
        [`productViewCounts.${productName}`]: currentCount,
    })

    if (currentCount >= 3 && !alreadySent) {
        const productEmails = {
            'Term Life': {
                subject: `${firstName}, you keep coming back to Term Life — let's make it yours 🛡️`,
                message: `Namaste ${firstName}! 🙏\n\nOur AI noticed you've explored Term Life Insurance multiple times.\n\nThat tells us one thing — you care about your family's future. ❤️\n\n🎯 Here's why Term Life makes sense for you RIGHT NOW:\n• Lock in low premiums while you're young & healthy\n• ₹1 Crore cover from just ₹490/month\n• Tax benefit under Section 80C\n• Claim settlement ratio: 98%+\n\nStop browsing. Start protecting.\n\n👉 Get your quote in 30 seconds: https://saarthi-ai-mu.vercel.app/\n\nTeam SaarthiAI 🛡️`,
            },
            'Health': {
                subject: `${firstName}, 3 visits to Health Insurance — our AI has something for you ❤️`,
                message: `Namaste ${firstName}! 🙏\n\nYou've been exploring Health Insurance plans on SaarthiAI — and we think that's incredibly smart.\n\n📊 Did you know?\n• 1 hospitalisation in India now costs ₹3–15 Lakhs\n• Medical inflation is running at 14% per year\n• Without health insurance, savings can vanish overnight\n\n💊 Our AI has curated your perfect health plan:\n• Cashless at 10,000+ hospitals\n• No co-payment for those under 45\n• Pre & post hospitalisation covered\n• Free annual health check-up included\n\n👉 See your personalised plan: https://saarthi-ai-mu.vercel.app/\n\nTeam SaarthiAI`,
            },
        }

        const emailContent = productEmails[productType] || {
            subject: `${firstName}, still thinking about ${productName}? Let our AI decide for you 🤖`,
            message: `Namaste ${firstName}! 🙏\n\nYou've viewed *${productName}* multiple times on SaarthiAI.\n\nOur AI has analysed this plan against your profile and the results are in — this could be a strong fit for you.\n\n✅ Personalised recommendation: ${productName}\n✅ Matched to your risk profile\n✅ Compared against 50+ alternatives\n\nDon't overthink it. Let the AI guide you.\n\n👉 https://saarthi-ai-mu.vercel.app/\n\nTeam SaarthiAI 🛡️`,
        }

        await sendEmail({ toEmail: user.email, toName: firstName, ...emailContent })
        await updateDoc(ref, {
            productEmailSentFor: [...(state.productEmailSentFor || []), productName],
        })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 4 — SCROLL DEPTH + TIME SPENT
// ─────────────────────────────────────────────────────────────────────────────
export function useScrollAndTimeTrigger(user, userProfile) {
    const scrollEmailSentRef = useRef(false)
    const timeEmailSentRef = useRef(false)
    const sessionStartRef = useRef(Date.now())
    const totalTimeRef = useRef(0)

    useEffect(() => {
        if (!user?.email) return

        // ── Scroll depth tracker ──────────────────────────────────────
        const handleScroll = async () => {
            if (scrollEmailSentRef.current) return

            const scrollTop = window.scrollY || document.documentElement.scrollTop
            const docHeight = document.documentElement.scrollHeight - window.innerHeight
            const scrollPct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0

            if (scrollPct >= 75) {
                scrollEmailSentRef.current = true
                const firstName = userProfile?.displayName?.split(' ')[0] || 'there'

                try {
                    const { ref, data: state } = await getTriggerState(user.uid)
                    if (!state.scrollDepthEmailSent) {
                        await sendEmail({
                            toEmail: user.email, toName: firstName,
                            subject: `${firstName}, you explored a lot — your AI summary is ready 📋`,
                            message: `Namaste ${firstName}! 🙏\n\nYou just did a thorough exploration of SaarthiAI — and our AI was watching every scroll. 👁️\n\nBased on what you explored, here's your personalised summary:\n\n🔍 YOUR EXPLORATION INSIGHTS:\n• You clearly want comprehensive coverage\n• You're comparing multiple plan types\n• You care about value, not just price\n\n🤖 AI VERDICT:\nYou're an informed buyer. Here's what we recommend — a bundled approach:\n✅ Term Life (₹1Cr cover)\n✅ Health Top-Up (fills gaps)\n✅ One-time AI consultation (free)\n\n👉 Get your bundled quote: https://saarthi-ai-mu.vercel.app/\n\nTeam SaarthiAI 🛡️`,
                        })
                        await updateDoc(ref, { scrollDepthEmailSent: true })
                    }
                } catch (err) {
                    console.error('Scroll trigger error:', err)
                }
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })

        // ── Time spent tracker (email after 3 min = 180s) ─────────────
        const timeInterval = setInterval(async () => {
            if (timeEmailSentRef.current) return

            const sessionSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000)
            totalTimeRef.current = sessionSeconds

            if (sessionSeconds >= 10) { // 3 minutes
                timeEmailSentRef.current = true
                const firstName = userProfile?.displayName?.split(' ')[0] || 'there'

                try {
                    const { ref, data: state } = await getTriggerState(user.uid)
                    if (!state.timeSpentEmailSent) {
                        await sendEmail({
                            toEmail: user.email, toName: firstName,
                            subject: `${firstName}, 3 mins of research — you deserve our best recommendation 🏆`,
                            message: `Namaste ${firstName}! 🙏\n\nYou've spent quality time researching on SaarthiAI today — and that means you're serious about protecting your family.\n\nWe respect that. So here's our BEST recommendation, no filters:\n\n🏆 TOP PICK FOR YOUR PROFILE:\n\n1️⃣ Term Life — ₹1 Crore cover @ ₹490/month\n   Best for: Family income protection\n\n2️⃣ Health Top-Up — ₹10 Lakh top-up @ ₹299/month\n   Best for: Filling hospitalisation gaps\n\n3️⃣ Critical Illness — Lump sum on diagnosis\n   Best for: Cancer, heart attack, stroke cover\n\n💡 Combined monthly cost: Under ₹1,200\n💡 Combined coverage: ₹1.1 Crore+\n\n👉 Lock these in now: https://saarthi-ai-mu.vercel.app/\n\nTeam SaarthiAI 🛡️`,
                        })
                        await updateDoc(ref, { timeSpentEmailSent: true })
                    }
                } catch (err) {
                    console.error('Time trigger error:', err)
                }
            }
        }, 15000) // check every 15 seconds

        return () => {
            window.removeEventListener('scroll', handleScroll)
            clearInterval(timeInterval)
        }
    }, [user, userProfile])
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — call this once in CustomerDashboard useEffect
// ─────────────────────────────────────────────────────────────────────────────
export async function initEmailTriggers(user, userProfile) {
    if (!user?.uid || !user?.email) return

    try {
        const { ref, data: state } = await getTriggerState(user.uid)
        await checkTimeTriggers(user, userProfile, state, ref)
        await checkInactivityTrigger(user, userProfile, state, ref)
        console.log('✅ Email triggers checked')
    } catch (err) {
        console.error('❌ Email trigger error:', err)
    }
}