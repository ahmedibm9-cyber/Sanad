import { useState, useRef, useCallback, useEffect } from 'react'

// Web Speech API type declarations (not included in default TypeScript lib)
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionResultEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition: new () => SpeechRecognitionInstance
  webkitSpeechRecognition: new () => SpeechRecognitionInstance
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean
  isListening: boolean
  transcript: string
  error: string | null
  startListening: (lang?: string) => void
  stopListening: () => void
  resetTranscript: () => void
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const finalTranscriptRef = useRef('')

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    finalTranscriptRef.current = ''
  }, [])

  const startListening = useCallback(
    (lang?: string) => {
      if (!isSupported) {
        setError('Speech recognition is not supported in this browser')
        return
      }

      // Stop any existing session
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }

      setError(null)
      setTranscript('')
      finalTranscriptRef.current = ''

      const win = window as unknown as WindowWithSpeechRecognition
      const SpeechRecognitionConstructor = win.SpeechRecognition || win.webkitSpeechRecognition
      const recognition = new SpeechRecognitionConstructor()

      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = lang || 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: SpeechRecognitionResultEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          } else {
            interimTranscript += result[0].transcript
          }
        }

        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript
          setTranscript(finalTranscriptRef.current)
        } else if (interimTranscript) {
          setTranscript(finalTranscriptRef.current + interimTranscript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessages: Record<string, string> = {
          'no-speech': 'No speech detected. Please try again.',
          'audio-capture': 'Microphone not found. Please check your device.',
          'not-allowed': 'Microphone permission denied. Please allow access.',
          'network': 'Network error. Please check your connection.',
          'aborted': 'Speech recognition was aborted.',
          'service-not-allowed': 'Speech service not allowed. Please check settings.',
        }
        setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`)
        setIsListening(false)
        recognitionRef.current = null
      }

      recognition.onend = () => {
        setIsListening(false)
        recognitionRef.current = null
      }

      try {
        recognition.start()
        recognitionRef.current = recognition
      } catch {
        setError('Failed to start speech recognition')
        setIsListening(false)
      }
    },
    [isSupported]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}
