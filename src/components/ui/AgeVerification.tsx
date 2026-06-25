// src/components/ui/AgeVerification.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wine, Check, AlertCircle, Sparkles, Calendar, Brain, Heart, X, Shield, Lock } from 'lucide-react'
import { Button } from '@/components/shadCn/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'

interface AgeVerificationProps {
  className?: string
}

interface Question {
  id: string
  text: string
  correctAnswer: 'yes' | 'no'
  date: Date
  hint: string
  explanation: string
}

export default function AgeVerification({ className = '' }: AgeVerificationProps) {
  const [showModal, setShowModal] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [isUnderage, setIsUnderage] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [score, setScore] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [verificationMethod, setVerificationMethod] = useState<'question' | 'date' | 'both'>('both')

  // ✅ Generate a random date between 18 and 80 years ago
  const generateRandomDate = useCallback((): Date => {
    const today = new Date()
    const minAge = 18
    const maxAge = 80
    const randomAge = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge
    const date = new Date(today)
    date.setFullYear(today.getFullYear() - randomAge)
    date.setMonth(Math.floor(Math.random() * 12))
    date.setDate(Math.floor(Math.random() * 28) + 1)
    return date
  }, [])

  // ✅ Generate a question with better logic
  const generateQuestion = useCallback((): Question => {
    const date = generateRandomDate()
    const today = new Date()
    const age = today.getFullYear() - date.getFullYear()
    const isOver18 = age >= 18
    
    // Randomize question type
    const questionTypes = ['before', 'after', 'age', 'year']
    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)]
    
    let text: string
    let correctAnswer: 'yes' | 'no'
    let explanation: string
    
    switch (type) {
      case 'before':
        text = `Were you born before ${date.toLocaleDateString('en-US', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })}?`
        correctAnswer = isOver18 ? 'yes' : 'no'
        explanation = isOver18 
          ? `This date is ${age} years ago, so if you were born before it, you're at least ${age} years old.`
          : `This date is only ${age} years ago, so if you were born before it, you'd be ${age} years old.`
        break
        
      case 'after':
        text = `Were you born after ${date.toLocaleDateString('en-US', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })}?`
        correctAnswer = isOver18 ? 'no' : 'yes'
        explanation = isOver18 
          ? `This date is ${age} years ago, so if you were born after it, you'd be younger than ${age}.`
          : `This date is only ${age} years ago, so if you were born after it, you'd be ${age} or younger.`
        break
        
      case 'age':
        const randomAge = Math.floor(Math.random() * 20) + 18
        text = `Are you at least ${randomAge} years old?`
        correctAnswer = randomAge <= 18 ? 'yes' : 'no'
        explanation = `You must be at least 18 years old to enter.`
        break
        
      case 'year':
        const year = new Date().getFullYear() - 18
        text = `Were you born in or before ${year}?`
        correctAnswer = 'yes'
        explanation = `Anyone born in or before ${year} is at least 18 years old.`
        break
        
      default:
        text = `Were you born before ${date.toLocaleDateString('en-US', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })}?`
        correctAnswer = isOver18 ? 'yes' : 'no'
        explanation = `This date is ${age} years ago.`
    }

    return {
      id: `q-${Date.now()}-${Math.random()}`,
      text,
      correctAnswer,
      date,
      hint: `Think about your age and the date mentioned.`,
      explanation
    }
  }, [generateRandomDate])

  // ✅ Check if user is of legal age based on birth date
  const isLegalAge = useCallback((birthDate: Date): boolean => {
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    const dayDiff = today.getDate() - birthDate.getDate()
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      return age - 1 >= 18
    }
    return age >= 18
  }, [])

  // ✅ Handle date selection verification
  const handleDateVerification = useCallback(() => {
    if (!selectedDate) {
      alert('Please select your birth date')
      return
    }

    if (isLegalAge(selectedDate)) {
      // ✅ User is 18 or older
      localStorage.setItem('age_verified', 'true')
      localStorage.setItem('age_verification_date', selectedDate.toISOString())
      localStorage.setItem('age_verification_method', 'date')
      setIsVerified(true)
      setShowModal(false)
      document.body.style.overflow = 'unset'
      toast.success('Welcome! You are verified as 18+')
    } else {
      // ❌ User is underage
      setIsUnderage(true)
      setAttemptCount(prev => prev + 1)
      setScore(0)
      toast.error('You must be at least 18 years old to enter')
    }
  }, [selectedDate, isLegalAge])

  // ✅ Handle question answer
  const handleAnswer = useCallback((answer: 'yes' | 'no') => {
    if (!currentQuestion) return

    const isCorrect = answer === currentQuestion.correctAnswer
    
    if (isCorrect) {
      // ✅ User passed the question
      localStorage.setItem('age_verified', 'true')
      localStorage.setItem('age_verification_method', 'question')
      setIsVerified(true)
      setShowModal(false)
      document.body.style.overflow = 'unset'
      setScore(prev => prev + 1)
      toast.success('Welcome! You are verified as 18+')
    } else {
      // ❌ User failed
      setIsUnderage(true)
      setAttemptCount(prev => prev + 1)
      setScore(0)
      toast.error('Verification failed. Please try again.')
    }
  }, [currentQuestion])

  // ✅ Generate new question
  const generateNewQuestion = useCallback(() => {
    setCurrentQuestion(generateQuestion())
    setShowHint(false)
    setLoading(false)
  }, [generateQuestion])

  // ✅ Reset and try again
  const handleReset = useCallback(() => {
    setIsUnderage(false)
    setAttemptCount(0)
    setScore(0)
    setSelectedDate(null)
    generateNewQuestion()
  }, [generateNewQuestion])

  // ✅ Initialize
  useEffect(() => {
    setIsMounted(true)
    
    // Check if user is already verified
    const verified = localStorage.getItem('age_verified')
    const verificationDate = localStorage.getItem('age_verification_date')
    
    if (verified === 'true') {
      // Check if verification is still valid (optional: re-verify after 30 days)
      if (verificationDate) {
        const date = new Date(verificationDate)
        const daysSinceVerification = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceVerification < 30) {
          setIsVerified(true)
          setShowModal(false)
          return
        }
      } else {
        setIsVerified(true)
        setShowModal(false)
        return
      }
    }

    // Show verification modal
    setShowModal(true)
    document.body.style.overflow = 'hidden'
    generateNewQuestion()
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [generateNewQuestion])

  // ✅ Don't render until mounted
  if (!isMounted) {
    return null
  }

  // ✅ If verified, render nothing
  if (isVerified) {
    return null
  }

  return (
    <AnimatePresence>
      {showModal && (
        <div className={cn("fixed inset-0 z-[9999] flex items-center justify-center p-4", className)}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative h-48 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative text-center">
                <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-3">
                  <Shield className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Age Verification</h2>
                <p className="text-white/80 text-sm">Please confirm you are 18 or older</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {!isUnderage ? (
                <>
                  {/* Verification Method Tabs */}
                  <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => setVerificationMethod('date')}
                      className={cn(
                        "flex-1 px-3 py-2 text-sm rounded-md transition-colors",
                        verificationMethod === 'date' 
                          ? "bg-pink-600 text-white" 
                          : "hover:bg-gray-200 dark:hover:bg-gray-700"
                      )}
                    >
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Birth Date
                    </button>
                  </div>

                  {/* Question Method */}
                  {verificationMethod === 'question' && currentQuestion && (
                    <motion.div
                      key={currentQuestion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="text-center mb-4">
                        <div className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-3 py-1 rounded-full text-sm font-medium">
                          <Brain className="h-4 w-4" />
                          Quick Question
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          Answer correctly to verify your age
                          {score > 0 && ` (${score} correct)`}
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                        <div className="text-4xl mb-3">🤔</div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {currentQuestion.text}
                        </p>
                      </div>

                      {/* Hint */}
                      <div className="text-center">
                        <button
                          onClick={() => setShowHint(!showHint)}
                          className="text-sm text-pink-600 hover:text-pink-700 hover:underline"
                        >
                          {showHint ? 'Hide hint' : 'Show hint'}
                        </button>
                        {showHint && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg"
                          >
                            💡 {currentQuestion.hint}
                          </motion.p>
                        )}
                      </div>

                      {/* Answer Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => handleAnswer('yes')}
                          className="bg-pink-600 hover:bg-pink-700 text-white"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Yes
                        </Button>
                        <Button
                          onClick={() => handleAnswer('no')}
                          variant="outline"
                          className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <X className="mr-2 h-4 w-4" />
                          No
                        </Button>
                      </div>

                      <div className="text-center">
                        <button
                          onClick={generateNewQuestion}
                          className="text-sm text-gray-400 hover:text-gray-600 transition"
                        >
                          <Sparkles className="inline h-3 w-3 mr-1" />
                          New question
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Date Method */}
                  {verificationMethod === 'date' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="text-center mb-4">
                        <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                          <Calendar className="h-4 w-4" />
                          Enter Your Birth Date
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          Please enter your date of birth to verify you are 18+
                        </p>
                      </div>

                      <div className="space-y-3">
                        <input
                          type="date"
                          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          onChange={(e) => {
                            if (e.target.value) {
                              setSelectedDate(new Date(e.target.value))
                            }
                          }}
                        />
                        
                        {selectedDate && (
                          <div className="text-sm text-gray-500">
                            {isLegalAge(selectedDate) ? (
                              <span className="text-green-600">✓ You are 18 or older</span>
                            ) : (
                              <span className="text-red-600">✗ You must be 18 or older</span>
                            )}
                          </div>
                        )}

                        <Button
                          onClick={handleDateVerification}
                          disabled={!selectedDate || !isLegalAge(selectedDate!)}
                          className="w-full bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Verify Age
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Terms */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      By continuing, you agree to our{' '}
                      <Link href="/terms" className="text-pink-600 hover:underline">
                        Terms & Conditions
                      </Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="text-pink-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                </>
              ) : (
                /* Underage Message */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-4"
                >
                  <div className="text-8xl mb-4">🔞</div>
                  <h3 className="text-2xl font-bold text-amber-800 dark:text-amber-400 mb-2">
                    Access Denied
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {attemptCount > 2 
                      ? `You must be at least 18 years old to access this site. We've detected ${attemptCount} failed attempts.`
                      : "You need to be 18 or older to enter."}
                  </p>
                  <div className="w-24 h-1 bg-gradient-to-r from-pink-600 to-purple-600 mx-auto rounded-full" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Mystic Wines is committed to responsible drinking.
                  </p>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                  {attemptCount > 3 && (
                    <p className="text-xs text-red-500 mt-2">
                      Multiple failed attempts detected. Please ensure you are 18+.
                    </p>
                  )}
                </motion.div>
              )}

              {/* Drink Responsibly Message */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  🍷 Please drink responsibly. Alcohol is not for sale to persons under 18 years.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}