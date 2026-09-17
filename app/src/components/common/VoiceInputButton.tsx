import { useCallback, useEffect, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { Mic } from 'lucide-react'

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void
  className?: string
  size?: 'sm' | 'md'
}

export default function VoiceInputButton({ onTranscript, className = '', size = 'md' }: VoiceInputButtonProps) {
  const { t, language } = useLanguage()
  const {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  } = useSpeechRecognition()

  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  const lastSentRef = useRef('')

  const handleToggle = useCallback(() => {
    if (isListening) {
      stopListening()
      return
    }
    lastSentRef.current = ''
    const lang = language === 'ar' ? 'ar-SA' : 'en-US'
    startListening(lang)
  }, [isListening, stopListening, startListening, language])

  useEffect(() => {
    if (transcript && transcript !== lastSentRef.current) {
      lastSentRef.current = transcript
      onTranscriptRef.current(transcript)
    }
  }, [transcript])

  useEffect(() => {
    return () => stopListening()
  }, [stopListening])

  const iconSize = size === 'sm' ? 14 : 18
  const padClass = size === 'sm' ? 'p-1.5' : 'p-2'

  return (
    <button
      type="button"
      className={`btn-ghost ${padClass} ${
        isListening
          ? 'bg-red-50 text-red-600 animate-pulse'
          : transcript
          ? 'bg-green-50 text-green-600'
          : ''
      } ${className}`}
      onClick={handleToggle}
      title={
        !isSupported
          ? t('Voice input not supported in this browser', 'الإدخال الصوتي غير مدعوم في هذا المتصفح')
          : error || t('Voice Input', 'إدخال صوتي')
      }
      disabled={!isSupported}
      aria-label={t('Voice input', 'إدخال صوتي')}
    >
      <Mic size={iconSize} />
      {size === 'md' && (
        <span className="ms-1.5 hidden sm:inline">
          {isListening
            ? t('Listening...', 'جاري الاستماع...')
            : transcript
            ? t('Done!', 'تم!')
            : t('Voice', 'صوتي')}
        </span>
      )}
    </button>
  )
}
