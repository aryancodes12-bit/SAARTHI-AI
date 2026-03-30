import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ArrowRight, ShieldAlert, HeartPulse, Building, Wallet, Target, RefreshCcw, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const QUESTIONS = [
  {
    id: 'income',
    title: 'What is your annual family income?',
    icon: <Wallet size={32} className="text-emerald-500 mb-4" />,
    options: [
      { label: 'Under ₹5 Lakhs', value: 3 },
      { label: '₹5 - 12 Lakhs', value: 6 },
      { label: '₹12 - 25 Lakhs', value: 8 },
      { label: 'Above ₹25 Lakhs', value: 10 }
    ]
  },
  {
    id: 'dependents',
    title: 'How many financial dependents do you have?',
    icon: <HeartPulse size={32} className="text-red-500 mb-4" />,
    options: [
      { label: 'None', value: 10 },
      { label: '1-2 (Spouse/Child)', value: 6 },
      { label: '3-4 (Including Parents)', value: 4 },
      { label: '5+', value: 2 }
    ]
  },
  {
    id: 'liabilities',
    title: 'What are your total current liabilities (Home Loan, Auto)?',
    icon: <Building size={32} className="text-blue-500 mb-4" />,
    options: [
      { label: 'Zero Debt', value: 10 },
      { label: 'Under ₹20 Lakhs', value: 7 },
      { label: '₹20 - 50 Lakhs', value: 4 },
      { label: 'Above ₹50 Lakhs', value: 2 }
    ]
  },
  {
    id: 'health_cover',
    title: 'What is your current Health Insurance cover limit?',
    icon: <ShieldAlert size={32} className="text-orange-500 mb-4" />,
    options: [
      { label: 'None / Company Only', value: 2 },
      { label: '₹3 - 5 Lakhs', value: 5 },
      { label: '₹10 - 25 Lakhs', value: 8 },
      { label: '₹50 Lakhs+', value: 10 }
    ]
  }
]

export default function RiskAssessment() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [isCalculating, setIsCalculating] = useState(false)
  const [finalScore, setFinalScore] = useState(null)

  const handleSelect = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value })
    
    // Auto advance
    setTimeout(() => {
      if (currentStep < QUESTIONS.length - 1) {
        setCurrentStep(prev => prev + 1)
      } else {
        calculateScore()
      }
    }, 400)
  }

  const calculateScore = () => {
    setIsCalculating(true)
    setTimeout(() => {
      // Sum values and normalize to 100
      const totalPoints = Object.values(answers).reduce((a, b) => a + b, 0)
      const maxPossible = QUESTIONS.length * 10
      const score = Math.round((totalPoints / maxPossible) * 100)
      
      setFinalScore(score)
      setIsCalculating(false)
    }, 2500)
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500 border-green-500 shadow-neon-green bg-green-50/10'
    if (score >= 50) return 'text-yellow-500 border-yellow-500 shadow-neon-yellow bg-yellow-50/10'
    return 'text-red-500 border-red-500 shadow-neon-red bg-red-50/10'
  }

  const getScoreMessage = (score) => {
    if (score >= 80) return { title: 'Excellent Protection', desc: 'Your family is highly secure against financial shocks.' }
    if (score >= 50) return { title: 'Partial Vulnerability', desc: 'You have basic cover, but critical gaps exist. Ensure your term life matches your liabilities.' }
    return { title: 'High Risk Alert', desc: 'Your family is highly exposed to medical and debt vectors. Immediate action recommended.' }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* ── Header ── */}
      <nav className="bg-white px-6 py-4 flex items-center shadow-sm relative z-20">
        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-800 transition-colors mr-4">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-gray-900 font-bold text-lg leading-tight">Financial Health Check</h1>
          <p className="text-gray-500 text-xs font-medium">SaarthiAI Risk Analysis Engine</p>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative overflow-hidden">
        
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        {!finalScore && !isCalculating && (
          <div className="w-full max-w-xl animate-fade-in-up">
            
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
                <span>Step {currentStep + 1} of {QUESTIONS.length}</span>
                <span>{Math.round(((currentStep) / QUESTIONS.length) * 100)}% Complete</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep) / QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-gray-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0B1F4B] to-[#FF6B00]" />
              
              <div className="flex justify-center flex-col items-center">
                {QUESTIONS[currentStep].icon}
                <h2 className="text-2xl font-bold font-outfit text-gray-900 mb-8 leading-tight">
                  {QUESTIONS[currentStep].title}
                </h2>
              </div>

              <div className="space-y-3">
                {QUESTIONS[currentStep].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(QUESTIONS[currentStep].id, opt.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left font-bold transition-all duration-200 flex items-center justify-between group
                      ${answers[QUESTIONS[currentStep].id] === opt.value 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-neon-blue' 
                        : 'border-gray-100 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <span>{opt.label}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${answers[QUESTIONS[currentStep].id] === opt.value ? 'border-blue-500' : 'border-gray-300 group-hover:border-gray-400'}
                    `}>
                      {answers[QUESTIONS[currentStep].id] === opt.value && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isCalculating && (
          <div className="w-full max-w-md text-center animate-fade-in flex flex-col items-center">
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
              <Target size={40} className="absolute inset-0 m-auto text-[#0B1F4B] animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold font-outfit text-gray-900 mb-2">AI is Processing...</h2>
            <p className="text-gray-500 font-medium">Correlating your liabilities with market inflation parameters.</p>
            
            <div className="mt-8 space-y-3 w-full text-left max-w-xs mx-auto">
              <div className="flex items-center gap-3 text-sm text-green-600 font-semibold animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
                <CheckCircle size={16} /> Parsing dependency ratios
              </div>
              <div className="flex items-center gap-3 text-sm text-green-600 font-semibold animate-fade-in-up" style={{ animationDelay: '1s', animationFillMode: 'both' }}>
                <CheckCircle size={16} /> Syncing current policy logic
              </div>
              <div className="flex items-center gap-3 text-sm text-green-600 font-semibold animate-fade-in-up" style={{ animationDelay: '1.5s', animationFillMode: 'both' }}>
                <CheckCircle size={16} /> Generating Protection Score
              </div>
            </div>
          </div>
        )}

        {finalScore !== null && !isCalculating && (
          <div className="w-full max-w-2xl animate-fade-in-up">
            <div className={`rounded-[2.5rem] p-8 md:p-12 border-4 backdrop-blur-xl bg-white/90 text-center relative ${getScoreColor(finalScore)}`}>
              
              <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-6">Your SaarthiAI Score</p>
              
              <div className="flex justify-center items-end gap-2 mb-6">
                <h1 className="text-8xl md:text-9xl font-black font-outfit leading-none tracking-tighter">
                  {finalScore}
                </h1>
                <span className="text-2xl md:text-4xl font-bold opacity-50 mb-3">/ 100</span>
              </div>
              
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8 max-w-md mx-auto">
                <h3 className="text-xl font-bold mb-2">{getScoreMessage(finalScore).title}</h3>
                <p className="text-sm font-medium opacity-90 leading-relaxed">
                  {getScoreMessage(finalScore).desc}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <button 
                  onClick={() => {
                    setAnswers({})
                    setCurrentStep(0)
                    setFinalScore(null)
                  }}
                  className="px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-current hover:bg-black/5 transition"
                >
                  <RefreshCcw size={18} /> Retake Assessment
                </button>
                <button 
                  onClick={() => navigate('/compare?category=term')}
                  className="px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-current text-white hover:opacity-90 transition shadow-xl shadow-current/30"
                >
                  View Recommendations <ArrowRight size={18} />
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
