// src/components/ui/AgeVerification.tsx
'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Check, 
  X, 
  Calendar, 
  Brain, 
  Sparkles, 
  Lock, 
  Heart,
  Wine,
  GlassWater,
  ChevronRight,
  ArrowRight,
  Award,
  Clock,
  Users,
  Star,
  PartyPopper
} from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'

interface AgeVerificationProps {
  className?: string
  daysUntilReVerify?: number // Default: 30 days
}

interface Question {
  id: string
  text: string
  correctAnswer: 'yes' | 'no'
  hint: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export default function AgeVerification({ 
  className = '', 
  daysUntilReVerify = 30 
}: AgeVerificationProps) {
  // State
  const [isVerified, setIsVerified] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState<'welcome' | 'date' | 'question' | 'success' | 'denied'>('welcome')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedMethod, setSelectedMethod] = useState<'date' | 'question'>('date')
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [error, setError] = useState('')

  // Refs
  const isInitialized = useRef(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // ✅ Generate random question
  const generateQuestion = useCallback((): Question => {
    const today = new Date()
    const questions: Question[] = [
      {
        id: `q-${Date.now()}-1`,
        text: `Were you born before ${new Date(today.getFullYear() - 20, 0, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}?`,
        correctAnswer: 'yes',
        hint: 'Think about when you were born',
        explanation: 'Anyone born before 2004 is at least 20 years old.',
        difficulty: 'easy'
      },
      {
        id: `q-${Date.now()}-2`,
        text: `Were you born after ${new Date(today.getFullYear() - 15, 11, 31).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}?`,
        correctAnswer: 'no',
        hint: 'If you were born after 2009, you\'re under 15',
        explanation: 'Anyone born after 2009 is under 15 years old.',
        difficulty: 'easy'
      },
      {
        id: `q-${Date.now()}-3`,
        text: `Are you at least 21 years old?`,
        correctAnswer: 'yes',
        hint: 'Legal drinking age in some countries is 21',
        explanation: 'You must be at least 18 to enter, but 21+ gets bonus access.',
        difficulty: 'medium'
      },
      {
        id: `q-${Date.now()}-4`,
        text: `Were you born before ${new Date(today.getFullYear() - 25, 0, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}?`,
        correctAnswer: 'yes',
        hint: 'The 90s were a great decade!',
        explanation: 'If you were born before 1999, you\'re at least 25.',
        difficulty: 'medium'
      },
      {
        id: `q-${Date.now()}-5`,
        text: `Were you born after ${new Date(today.getFullYear() - 18, 0, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}?`,
        correctAnswer: 'no',
        hint: 'That would make you under 18',
        explanation: 'You must be born before 2006 to be at least 18.',
        difficulty: 'easy'
      }
    ]

    // Shuffle and pick one
    const shuffled = questions.sort(() => 0.5 - Math.random())
    return shuffled[0] || questions[0]
  }, [])

  // ✅ Check legal age
  const isLegalAge = useCallback((birthDate: Date): boolean => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 18
  }, [])

  // ✅ Verify age via date
  const verifyByDate = useCallback(() => {
    if (!birthYear || !birthMonth || !birthDay) {
      setError('Please enter your full birth date')
      return
    }

    const year = parseInt(birthYear)
    const month = parseInt(birthMonth) - 1
    const day = parseInt(birthDay)
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      setError('Please enter a valid date')
      return
    }

    const birthDate = new Date(year, month, day)
    
    // Validate date
    if (birthDate.getFullYear() !== year || 
        birthDate.getMonth() !== month || 
        birthDate.getDate() !== day) {
      setError('Please enter a valid date')
      return
    }

    if (isLegalAge(birthDate)) {
      // ✅ Verified
      const verificationData = {
        verified: true,
        date: birthDate.toISOString(),
        method: 'date',
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('age_verification', JSON.stringify(verificationData))
      setIsVerified(true)
      setShowModal(false)
      setCurrentStep('success')
      document.body.style.overflow = 'unset'
      toast.success('🎉 Welcome! You are verified as 18+')
    } else {
      // ❌ Underage
      setError('You must be at least 18 years old to enter')
      setAttemptCount(prev => prev + 1)
      toast.error('Age verification failed')
      
      if (attemptCount >= 2) {
        setCurrentStep('denied')
      }
    }
  }, [birthYear, birthMonth, birthDay, isLegalAge, attemptCount])

  // ✅ Verify via question
  const verifyByQuestion = useCallback((answer: 'yes' | 'no') => {
    if (!currentQuestion) return

    const isCorrect = answer === currentQuestion.correctAnswer
    
    if (isCorrect) {
      // ✅ Verified
      const verificationData = {
        verified: true,
        method: 'question',
        timestamp: new Date().toISOString(),
        score: score + 1
      }
      localStorage.setItem('age_verification', JSON.stringify(verificationData))
      setIsVerified(true)
      setShowModal(false)
      setCurrentStep('success')
      document.body.style.overflow = 'unset'
      toast.success('🎉 Welcome! You are verified as 18+')
    } else {
      // ❌ Failed
      setError('Incorrect answer. Please try again.')
      setAttemptCount(prev => prev + 1)
      toast.error('Verification failed')
      
      if (attemptCount >= 2) {
        setCurrentStep('denied')
      } else {
        // Generate new question
        setCurrentQuestion(generateQuestion())
        setShowHint(false)
      }
    }
  }, [currentQuestion, generateQuestion, score, attemptCount])

  // ✅ Check existing verification
  const checkVerification = useCallback(() => {
    try {
      const stored = localStorage.getItem('age_verification')
      if (!stored) return false

      const data = JSON.parse(stored)
      if (!data.verified) return false

      // Check if verification has expired
      const verificationDate = new Date(data.timestamp)
      const daysSince = (Date.now() - verificationDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSince > daysUntilReVerify) {
        // Re-verify after X days
        localStorage.removeItem('age_verification')
        return false
      }

      return true
    } catch {
      return false
    }
  }, [daysUntilReVerify])

  // ✅ Initialize
  useEffect(() => {
    // Only run once
    if (isInitialized.current) return
    isInitialized.current = true

    // Check if already verified
    const verified = checkVerification()
    
    if (verified) {
      setIsVerified(true)
      setShowModal(false)
      document.body.style.overflow = 'unset'
      setIsLoading(false)
      return
    }

    // Show modal
    setShowModal(true)
    setCurrentStep('welcome')
    document.body.style.overflow = 'hidden'
    setCurrentQuestion(generateQuestion())
    setIsLoading(false)

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [checkVerification, generateQuestion])

  // ✅ Handle modal close (prevent closing without verification)
  const handleCloseAttempt = useCallback(() => {
    toast.warning('Please verify your age to continue')
  }, [])

  // ✅ Handle success animation
  useEffect(() => {
    if (currentStep === 'success') {
      const timer = setTimeout(() => {
        setShowModal(false)
        document.body.style.overflow = 'unset'
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  // ✅ Don't render if verified
  if (isVerified) return null

  return (
    <AnimatePresence>
      {showModal && (
        <div className={cn("fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4", className)}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={handleCloseAttempt}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto border border-gray-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative Background Elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />

            {/* Content */}
            <div className="relative p-6 sm:p-8">
              {/* Loading State */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Welcome Step */}
                  {currentStep === 'welcome' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-600/20">
                          <Shield className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-white">Age Verification</h2>
                        <p className="mt-2 text-gray-400 text-sm">
                          Please confirm you are 18 or older to access Mystic Wines
                        </p>
                      </div>

                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <div className="flex items-start gap-3 text-sm">
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-4 w-4 text-green-400" />
                          </div>
                          <div>
                            <p className="text-gray-300 font-medium">Why we verify?</p>
                            <p className="text-gray-400 text-xs">
                              We're committed to responsible drinking and comply with legal age requirements.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => setCurrentStep('date')}
                          className="w-full flex items-center justify-between bg-pink-600 hover:bg-pink-700 text-white rounded-xl px-4 py-3 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5" />
                            <span className="font-medium">Enter Birth Date</span>
                          </div>
                          <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        {/* <button
                          onClick={() => {
                            setCurrentStep('question')
                            setCurrentQuestion(generateQuestion())
                          }}
                          className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-4 py-3 transition-colors group border border-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <Brain className="h-5 w-5 text-purple-400" />
                            <span className="font-medium">Answer a Question</span>
                          </div>
                          <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button> */}
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-500">
                          By continuing, you agree to our{' '}
                          <Link href="/terms" className="text-pink-400 hover:underline">
                            Terms
                          </Link>
                          {' '}&{' '}
                          <Link href="/privacy" className="text-pink-400 hover:underline">
                            Privacy Policy
                          </Link>
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Date Verification Step */}
                  {currentStep === 'date' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm">
                          <Calendar className="h-4 w-4" />
                          Enter Your Birth Date
                        </div>
                        <p className="mt-2 text-gray-400 text-sm">
                          Please enter your date of birth to verify your age
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Month</label>
                          <select
                            value={birthMonth}
                            onChange={(e) => setBirthMonth(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          >
                            <option value="">MM</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                              <option key={m} value={m.toString().padStart(2, '0')}>
                                {m.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Day</label>
                          <select
                            value={birthDay}
                            onChange={(e) => setBirthDay(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          >
                            <option value="">DD</option>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                              <option key={d} value={d.toString().padStart(2, '0')}>
                                {d.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Year</label>
                          <select
                            value={birthYear}
                            onChange={(e) => setBirthYear(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          >
                            <option value="">YYYY</option>
                            {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2"
                        >
                          {error}
                        </motion.p>
                      )}

                      <div className="flex gap-3">
                        <Button
                          onClick={verifyByDate}
                          className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Verify Age
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCurrentStep('welcome')
                            setError('')
                          }}
                          className="border-gray-700 text-gray-400 hover:bg-gray-800"
                        >
                          Back
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Question Verification Step */}
                  {currentStep === 'question' && currentQuestion && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-sm">
                          <Brain className="h-4 w-4" />
                          Quick Question
                        </div>
                        <p className="mt-2 text-gray-400 text-sm">
                          Answer correctly to verify your age
                        </p>
                      </div>

                      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                        <div className="text-4xl mb-3 text-center">🤔</div>
                        <p className="text-lg font-medium text-white text-center">
                          {currentQuestion.text}
                        </p>
                        <div className="mt-3 flex justify-center gap-2">
                          <span className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-400">
                            {currentQuestion.difficulty}
                          </span>
                        </div>
                      </div>

                      {showHint && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 text-sm text-gray-300"
                        >
                          💡 {currentQuestion.hint}
                        </motion.div>
                      )}

                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={() => setShowHint(!showHint)}
                          className="text-xs text-gray-400 hover:text-gray-300 transition"
                        >
                          {showHint ? 'Hide hint' : 'Show hint'}
                        </button>
                      </div>

                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2"
                        >
                          {error}
                        </motion.p>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => verifyByQuestion('yes')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Yes
                        </Button>
                        <Button
                          onClick={() => verifyByQuestion('no')}
                          variant="outline"
                          className="border-gray-700 hover:bg-gray-800"
                        >
                          <X className="mr-2 h-4 w-4" />
                          No
                        </Button>
                      </div>

                      <div className="text-center">
                        <button
                          onClick={() => {
                            setCurrentStep('welcome')
                            setError('')
                          }}
                          className="text-xs text-gray-400 hover:text-gray-300 transition"
                        >
                          ← Back to options
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Success Step */}
                  {currentStep === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                        <PartyPopper className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="mt-4 text-2xl font-bold text-white">
                        Welcome to Mystic Wines! 🍷
                      </h3>
                      <p className="mt-2 text-gray-400">
                        You've been verified as 18+. Enjoy exploring our collection.
                      </p>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="mt-4 inline-block"
                      >
                        <Wine className="h-8 w-8 text-pink-400" />
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Denied Step */}
                  {currentStep === 'denied' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8"
                    >
                      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/20">
                        <Lock className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="mt-4 text-2xl font-bold text-red-400">
                        Access Denied
                      </h3>
                      <p className="mt-2 text-gray-400">
                        You must be at least 18 years old to access this site.
                      </p>
                      <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <p className="text-sm text-gray-300">
                          🍷 Please drink responsibly. Alcohol is not for sale to persons under 18 years.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setCurrentStep('welcome')
                          setAttemptCount(0)
                          setError('')
                          setBirthYear('')
                          setBirthMonth('')
                          setBirthDay('')
                        }}
                        className="mt-4 bg-pink-600 hover:bg-pink-700 text-white"
                      >
                        Try Again
                      </Button>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}