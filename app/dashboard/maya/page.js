'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { maya } from '../../../lib/api'

export default function MayaPage() {
  const [messages, setMessages]     = useState([])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [orbState, setOrbState]     = useState('idle')
  const [status, setStatus]         = useState('Press Talk to Maya to begin')
  const [isActive, setIsActive]     = useState(false)
  const [memoryData, setMemoryData] = useState(null)

  const chatEndRef            = useRef(null)
  const recognitionRef        = useRef(null)
  const synthRef              = useRef(null)
  const isActiveRef           = useRef(false)
  const isListeningRef        = useRef(false)
  const isSpeakingRef         = useRef(false)
  const isStartingRef         = useRef(false)
  const startListeningLoopRef = useRef(null)
  const endConversationRef    = useRef(null)
  const messagesRef           = useRef([])

  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { messagesRef.current = messages }, [messages])

  useEffect(() => {
    maya.memory().then(r => setMemoryData(r.data)).catch(() => {})
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
    return () => {
      recognitionRef.current?.stop()
      synthRef.current?.cancel()
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getBestVoice = useCallback(() => {
    const voices = synthRef.current?.getVoices() || []
    const preferred = [
      'Google UK English Female',
      'Google US English',
      'Microsoft Aria Online (Natural)',
      'Microsoft Jenny Online (Natural)',
      'Samantha', 'Karen', 'Moira', 'Victoria',
    ]
    for (const name of preferred) {
      const v = voices.find(v => v.name === name)
      if (v) return v
    }
    return voices.find(v =>
      v.lang.startsWith('en') && (
        v.name.toLowerCase().includes('female') ||
        v.name.includes('Aria') ||
        v.name.includes('Jenny') ||
        v.name.includes('Samantha')
      )
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0]
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    isListeningRef.current = false
  }, [])

  const speakText = useCallback((text, onEnd) => {
    if (!synthRef.current || !text) { onEnd?.(); return }
    synthRef.current.cancel()
    isSpeakingRef.current = true
    stopListening()
    setTimeout(() => {
      const utt   = new SpeechSynthesisUtterance(text)
      const voice = getBestVoice()
      if (voice) utt.voice = voice
      utt.rate   = 0.92
      utt.pitch  = 1.05
      utt.volume = 1.0
      utt.lang   = 'en-US'
      utt.onstart = () => {
        setOrbState('speaking')
        isSpeakingRef.current = true
        stopListening()
      }
      utt.onend = () => {
        isSpeakingRef.current = false
        setTimeout(() => { onEnd?.() }, 800)
      }
      utt.onerror = () => {
        isSpeakingRef.current = false
        setTimeout(() => { onEnd?.() }, 500)
      }
      synthRef.current.speak(utt)
    }, 150)
  }, [getBestVoice, stopListening])

  const processUserMessage = useCallback(async (text) => {
    if (!text?.trim()) return
    stopListening()

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setOrbState('thinking')
    setStatus(`💬 You: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`)
    setLoading(true)

    try {
      const res = await maya.chat(text, [])
      const reply = res.data.reply

      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setOrbState('speaking')
      setStatus(`🔊 Maya: "${reply.slice(0, 50)}${reply.length > 50 ? '...' : ''}"`)

      speakText(reply, () => {
        if (isActiveRef.current) {
          startListeningLoopRef.current?.()
        } else {
          setOrbState('idle')
          setStatus('Press Talk to Maya to continue')
        }
      })
    } catch (err) {
      const status_code = err?.response?.status
      const detail      = err?.response?.data?.detail

      if (status_code === 401) {
        setStatus('❌ Session expired — please sign out and sign in again')
        setOrbState('idle')
        setIsActive(false)
        isActiveRef.current = false
      } else if (status_code === 422) {
        setStatus('❌ Invalid request — refreshing...')
        setOrbState('active')
        if (isActiveRef.current) setTimeout(() => startListeningLoopRef.current?.(), 1500)
      } else if (status_code === 500) {
        setStatus('❌ Server error — check Railway logs')
        setOrbState('active')
        if (isActiveRef.current) setTimeout(() => startListeningLoopRef.current?.(), 2000)
      } else {
        setStatus(`❌ Error: ${detail || err?.message || 'Unknown'} — retrying...`)
        setOrbState('active')
        if (isActiveRef.current) setTimeout(() => startListeningLoopRef.current?.(), 1500)
      }
    }
    setLoading(false)
  }, [speakText, stopListening])

  const endConversation = useCallback(() => {
    stopListening()
    synthRef.current?.cancel()
    setIsActive(false)
    isActiveRef.current   = false
    isStartingRef.current = false
    setOrbState('idle')
    setStatus('Conversation ended. Press Talk to Maya to start again.')
    isSpeakingRef.current = false

    const currentMessages = messagesRef.current
    if (currentMessages.length >= 2) {
      maya.saveSession(currentMessages)
        .then(() => maya.memory().then(r => setMemoryData(r.data)).catch(() => {}))
        .catch(() => {})
    }

    const farewell = "Take care of yourself. I'm always here when you need me."
    speakText(farewell, () => {})
  }, [speakText, stopListening])

  const startListeningLoop = useCallback(() => {
    if (!isActiveRef.current) return
    if (isListeningRef.current || isSpeakingRef.current) return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setStatus('⚠️ Please use Chrome or Edge for voice')
      return
    }

    stopListening()

    setTimeout(() => {
      if (!isActiveRef.current) return

      const recognition           = new SR()
      recognition.lang            = 'en-US'
      recognition.continuous      = false
      recognition.interimResults  = false
      recognition.maxAlternatives = 1
      recognitionRef.current      = recognition
      isListeningRef.current      = true

      setOrbState('listening')
      setStatus('🎙️ Listening... speak now')

      recognition.onresult = (event) => {
        isListeningRef.current = false
        const transcript = event.results[0][0].transcript.trim()
        console.log('Voice heard:', transcript)
        if (transcript && isActiveRef.current) {
          const stopWords = ['stop', 'goodbye', 'bye', 'exit',
                             'quit', 'bye maya', 'goodbye maya']
          if (stopWords.some(w => transcript.toLowerCase().includes(w))) {
            endConversationRef.current?.()
            return
          }
          processUserMessage(transcript)
        }
      }

      recognition.onerror = (event) => {
        isListeningRef.current = false
        console.log('Speech error:', event.error)

        if (event.error === 'not-allowed') {
          setStatus('⚠️ Microphone blocked — allow in browser settings')
          setIsActive(false)
          isActiveRef.current = false
          setOrbState('idle')
          return
        }
        if (event.error === 'audio-capture') {
          setStatus('⚠️ No microphone found')
          setIsActive(false)
          isActiveRef.current = false
          setOrbState('idle')
          return
        }
        if (isActiveRef.current) {
          setTimeout(() => {
            if (isActiveRef.current && !isSpeakingRef.current) {
              startListeningLoop()
            }
          }, 1000)
        }
      }

      recognition.onend = () => {
        isListeningRef.current = false
        if (isActiveRef.current && !isSpeakingRef.current) {
          setTimeout(() => {
            if (isActiveRef.current && !isSpeakingRef.current) {
              startListeningLoop()
            }
          }, 300)
        }
      }

      try {
        recognition.start()
      } catch (e) {
        console.log('Recognition start error:', e)
        isListeningRef.current = false
        setTimeout(() => {
          if (isActiveRef.current) startListeningLoop()
        }, 500)
      }
    }, 300)
  }, [processUserMessage, stopListening])

  useEffect(() => { startListeningLoopRef.current = startListeningLoop }, [startListeningLoop])
  useEffect(() => { endConversationRef.current = endConversation }, [endConversation])

  const startConversation = useCallback(async () => {
    if (isStartingRef.current || isActiveRef.current) return
    isStartingRef.current = true

    setIsActive(true)
    isActiveRef.current = true
    setOrbState('speaking')
    setStatus('🔊 Maya is greeting you...')
    setMessages([])

    try {
      const memRes = await maya.memory()
      const days   = memRes.data?.days_of_data || 0
      const mems   = memRes.data?.memories || []
      setMemoryData(memRes.data)

      let greeting = "Hey! So glad you're here. How are you feeling today?"
      if (days >= 1 && mems.length > 0) {
        const emotion = mems[0]?.dominant_emotion || 'something on your mind'
        greeting = `Hey, good to hear from you! Last time you seemed to be feeling ${emotion} — how are you today?`
      }

      setMessages([{ role: 'assistant', content: greeting }])
      speakText(greeting, () => {
        isStartingRef.current = false
        if (isActiveRef.current) startListeningLoopRef.current?.()
      })
    } catch (err) {
      isStartingRef.current = false
      const greeting = "Hey! So glad you're here. How are you feeling today?"
      setMessages([{ role: 'assistant', content: greeting }])
      speakText(greeting, () => {
        if (isActiveRef.current) startListeningLoopRef.current?.()
      })
    }
  }, [speakText])

  const handleTextSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const text = input
    setInput('')
    await processUserMessage(text)
  }

  const orbConfig = {
    idle:      { icon: '🧠', label: 'READY',
      bg: 'radial-gradient(circle at 35% 35%, #1e4a80, #080a28 70%)',
      color: '#555578', shadow: '0 0 30px rgba(74,158,255,0.25)' },
    active:    { icon: '💬', label: 'ACTIVE',
      bg: 'radial-gradient(circle at 35% 35%, #0a4a2a, #020820 60%)',
      color: '#34d399', shadow: '0 0 30px rgba(52,211,153,0.2)' },
    listening: { icon: '🎙️', label: 'LISTENING...',
      bg: 'radial-gradient(circle at 35% 35%, #4a1a1a, #1a0808 60%)',
      color: '#f87171', shadow: '0 0 30px rgba(239,68,68,0.3)' },
    thinking:  { icon: '⚡', label: 'THINKING...',
      bg: 'radial-gradient(circle at 35% 35%, #2a1a4a, #080818 60%)',
      color: '#9b6dff', shadow: '0 0 30px rgba(155,109,255,0.3)' },
    speaking:  { icon: '🔊', label: 'SPEAKING...',
      bg: 'radial-gradient(circle at 35% 35%, #1a3a6a, #080820 60%)',
      color: '#4a9eff', shadow: '0 0 30px rgba(74,158,255,0.3)' },
  }
  const orb       = orbConfig[orbState] || orbConfig.idle
  const waveColor = { listening:'#f87171', speaking:'#4a9eff', thinking:'#9b6dff' }[orbState]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Left panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '2rem', overflowY: 'auto' }}>

        {/* Orb */}
        <div style={{ position: 'relative', width: 220, height: 220,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '0.75rem', flexShrink: 0 }}>
          <div style={{ position: 'absolute',
            width: 200, height: 200,
            top: '50%', left: '50%', marginTop: -100, marginLeft: -100,
            borderRadius: '50%', border: '1px solid rgba(74,158,255,0.2)',
            animation: 'ringRotate 10s linear infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute',
            width: 164, height: 164,
            top: '50%', left: '50%', marginTop: -82, marginLeft: -82,
            borderRadius: '50%', border: '1px dashed rgba(74,158,255,0.12)',
            animation: 'ringRotateReverse 7s linear infinite', pointerEvents: 'none' }} />
          <div style={{ width: 130, height: 130, borderRadius: '50%',
            background: orb.bg, boxShadow: orb.shadow,
            border: '1px solid rgba(74,158,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', zIndex: 10,
            animation: 'orbFloat 3s ease-in-out infinite',
            transition: 'all 0.4s ease' }}>
            <span style={{ fontSize: 42 }}>{orb.icon}</span>
          </div>
        </div>
        <div style={{ marginBottom: '0.5rem', fontSize: 11, fontWeight: 600,
          letterSpacing: '3px', textTransform: 'uppercase',
          color: orb.color, transition: 'color 0.3s' }}>
          {orb.label}
        </div>
        {waveColor && (
          <div style={{ display: 'flex', alignItems: 'center',
            gap: 3, marginBottom: '0.5rem', height: 32 }}>
            {[5,10,18,26,18,10,5,10,18,10,5].map((h, i) => (
              <div key={i} style={{ width: 3, height: h, borderRadius: 2,
                background: waveColor, boxShadow: `0 0 6px ${waveColor}`,
                animation: `waveBar .5s ease infinite`,
                animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        )}

        {/* Status */}
        <div style={{ width: '100%', maxWidth: 440,
          background: '#0d0d22', border: '1px solid #1a1a35',
          borderRadius: 12, padding: '0.75rem 1rem',
          marginBottom: '1rem', display: 'flex',
          alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: orbState === 'listening' ? '#f87171'
              : orbState === 'speaking' ? '#4a9eff'
              : isActive ? '#34d399' : '#222240',
            boxShadow: isActive
              ? `0 0 6px ${orbState === 'listening' ? '#f87171' : '#34d399'}` : 'none',
            transition: 'all 0.3s' }} />
          <span style={{ fontSize: 13, color: '#8888aa' }}>{status}</span>
        </div>

        {/* Buttons */}
        <div style={{ width: '100%', maxWidth: 440, marginBottom: '1.25rem' }}>
          {!isActive ? (
            <button onClick={startConversation}
              style={{ width: '100%', padding: '1rem 1.5rem',
                borderRadius: 14, cursor: 'pointer',
                background: 'linear-gradient(135deg, #0a3a1a, #0a4a2a)',
                border: '1px solid rgba(52,211,153,0.5)',
                color: '#34d399', fontSize: 15, fontWeight: 600,
                letterSpacing: '1px', textTransform: 'uppercase',
                boxShadow: '0 4px 20px rgba(52,211,153,0.1)' }}>
              💬 Talk to Maya
            </button>
          ) : (
            <button onClick={endConversation}
              style={{ width: '100%', padding: '0.875rem',
                borderRadius: 14, cursor: 'pointer',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(248,113,113,0.4)',
                color: '#f87171', fontSize: 14, fontWeight: 600 }}>
              🛑 Stop talking to Maya
            </button>
          )}
        </div>

        {/* Text input */}
        <form onSubmit={handleTextSend}
          style={{ width: '100%', maxWidth: 440, display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="Or type your message..."
            style={{ flex: 1, background: '#0d0d22',
              border: '1px solid #1a1a35', borderRadius: 12,
              padding: '0.75rem 1rem', color: 'white',
              fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          <button type="submit" disabled={loading || !input.trim()}
            style={{ padding: '0.75rem 1.25rem', background: '#4a9eff',
              borderRadius: 12, color: 'white', fontWeight: 600,
              border: 'none', cursor: 'pointer',
              opacity: (!input.trim() || loading) ? 0.5 : 1 }}>
            Send
          </button>
        </form>

        {/* Instructions */}
        {!isActive && (
          <div style={{ width: '100%', maxWidth: 440, marginTop: '1rem',
            background: '#0d0d22', border: '1px solid #1a1a35',
            borderRadius: 12, padding: '1rem' }}>
            {[
              ['1', 'Press Talk to Maya to start'],
              ['2', 'Allow microphone when browser asks'],
              ['3', 'Maya greets you — speak freely after'],
              ['4', 'Say "goodbye" or press Stop to end'],
            ].map(([n, t]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center',
                gap: 10, marginBottom: n === '4' ? 0 : 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%',
                  background: '#111135', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#34d399', flexShrink: 0,
                  border: '1px solid #1a1a35' }}>
                  {n}
                </div>
                <span style={{ fontSize: 12, color: '#8888aa' }}>{t}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div style={{ width: 380, borderLeft: '1px solid #1a1a35',
        display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ padding: '1rem 1.25rem',
          borderBottom: '1px solid #1a1a35' }}>
          <div style={{ fontSize: 11, color: '#555578',
            textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Conversation
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem',
          display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%',
                background: '#0f2a1a', border: '1px solid #0e2e1e',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🧠</div>
              <div>
                <div style={{ fontSize: 9, color: '#34d399', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 4 }}>Maya</div>
                <div style={{ background: '#0d0d22', border: '1px solid #1a1a35',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '0.75rem 1rem', fontSize: 13,
                  color: '#8888aa', lineHeight: 1.6 }}>
                  Hi! I'm Maya 🌿 Press{' '}
                  <strong style={{ color: 'white' }}>Talk to Maya</strong>{' '}
                  to begin.
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'column' : 'row',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: msg.role === 'user' ? 4 : 10 }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%',
                    background: '#0f2a1a', border: '1px solid #0e2e1e',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🧠</div>
                )}
                <div style={{ maxWidth: '82%' }}>
                  <div style={{ fontSize: 9, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginBottom: 4,
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                    color: msg.role === 'user' ? '#4a9eff' : '#34d399' }}>
                    {msg.role === 'user' ? 'You' : 'Maya'}
                  </div>
                  <div style={{
                    padding: '0.7rem 1rem', fontSize: 13, lineHeight: 1.65,
                    borderRadius: msg.role === 'user'
                      ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? '#4a9eff' : '#0d0d22',
                    color: msg.role === 'user' ? 'white' : '#c8c8e8',
                    border: msg.role === 'user' ? 'none' : '1px solid #1a1a35' }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Memory panel */}
        {memoryData && (
          <div style={{ padding: '1rem', borderTop: '1px solid #1a1a35' }}>
            <div style={{ fontSize: 11, color: '#555578',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: '0.75rem' }}>
              Maya's memory
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8, marginBottom: 10 }}>
              {[
                { label: 'Msgs',
                  value: messages.filter(m => m.role === 'user').length,
                  color: '#4a9eff' },
                { label: 'Days',
                  value: memoryData.days_of_data || 0,
                  color: (memoryData.days_of_data||0) >= 3 ? '#34d399'
                       : (memoryData.days_of_data||0) >= 1 ? '#fbbf24' : '#555578' },
                { label: 'Insights',
                  value: memoryData.insights?.length || 0,
                  color: '#9b6dff' },
              ].map(s => (
                <div key={s.label} style={{ background: '#080818',
                  border: '1px solid #1a1a35', borderRadius: 10,
                  padding: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700,
                    color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#555578' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, padding: '0.5rem 0.75rem',
              borderRadius: 8, lineHeight: 1.5,
              borderLeft: `2px solid ${(memoryData.days_of_data||0) >= 3
                ? '#34d399' : (memoryData.days_of_data||0) >= 1
                ? '#fbbf24' : '#555578'}`,
              background: (memoryData.days_of_data||0) >= 3
                ? 'rgba(52,211,153,0.08)' : (memoryData.days_of_data||0) >= 1
                ? 'rgba(251,191,36,0.08)' : '#0d0d22',
              color: (memoryData.days_of_data||0) >= 3 ? '#34d399'
                   : (memoryData.days_of_data||0) >= 1 ? '#fbbf24' : '#555578' }}>
              {(memoryData.days_of_data||0) >= 3
                ? '🧠 Maya knows you well — fully personalized'
                : (memoryData.days_of_data||0) >= 1
                ? `⏳ ${3-(memoryData.days_of_data||0)} more session(s) until deep personalization`
                : '💡 Talk daily — after 3 sessions Maya deeply understands you'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}