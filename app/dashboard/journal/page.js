'use client'
import { useState, useRef } from 'react'
import { journal } from '../../../lib/api'

export default function JournalPage() {
  const [text, setText]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [listening, setListening] = useState(false)
  const recognitionRef          = useRef(null)

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Please use Chrome for voice input'); return }
    const r            = new SR()
    r.lang             = 'en-US'
    r.continuous       = false
    r.interimResults   = false
    r.onstart          = () => setListening(true)
    r.onresult         = (e) => { setText(e.results[0][0].transcript); setListening(false) }
    r.onerror          = () => setListening(false)
    r.onend            = () => setListening(false)
    r.start()
    recognitionRef.current = r
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim() || loading) return
    setLoading(true)
    try {
      const res = await journal.create(text)
      setResult(res.data)
      setText('')
    } catch {
      alert('Error saving entry. Please try again.')
    }
    setLoading(false)
  }

  const pillColors = [
    { bg: '#0a1e38', color: '#4a9eff' },
    { bg: '#160f2a', color: '#9b6dff' },
    { bg: '#081e14', color: '#34d399' },
    { bg: '#1e1200', color: '#fbbf24' },
  ]

  return (
    <div style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Journal</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Write or speak your thoughts. Maya will analyze them.
      </p>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <div style={{ background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: 16,
          padding: 4, marginBottom: '1rem' }}>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="How are you feeling today? Write freely — this is your safe space..."
            rows={6} style={{ width: '100%', background: 'transparent',
              padding: '1rem', color: 'white', resize: 'none',
              outline: 'none', fontSize: 14, lineHeight: 1.7,
              fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0 0.75rem 0.75rem' }}>
            <button type="button" onClick={startVoice} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.5rem 1rem', borderRadius: 10, fontSize: 13,
              fontWeight: 500, cursor: 'pointer', border: 'none',
              background: listening ? 'rgba(239,68,68,0.2)' : 'var(--bg-tertiary)',
              color: listening ? '#f87171' : 'var(--text-secondary)',
              outline: listening ? '1px solid #f87171' : 'none' }}>
              {listening ? '🔴 Listening...' : '🎙️ Record voice'}
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {text.length} chars
            </span>
          </div>
        </div>

        <button type="submit" disabled={loading || !text.trim()}
          style={{ width: '100%', padding: '0.875rem',
            background: 'var(--accent-blue)', borderRadius: 12,
            color: 'white', fontWeight: 600, fontSize: 14,
            border: 'none', cursor: 'pointer',
            opacity: (!text.trim() || loading) ? 0.5 : 1 }}>
          {loading ? '✨ Analyzing...' : '✨ Save & Analyze Entry'}
        </button>
      </form>

      {result && (
        <div className="animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Scores */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Mood Score',
                value: `${result.sentiment?.mood_score}/10`,
                color: '#34d399' },
              { label: 'Distress',
                value: `${result.llm_result?.distress_score}/10`,
                color: (result.llm_result?.distress_score||0) >= 7 ? '#f87171'
                     : (result.llm_result?.distress_score||0) >= 4 ? '#fbbf24' : '#34d399' },
              { label: 'Tone',
                value: result.sentiment?.label === 'POSITIVE' ? '😊 Good' : '😔 Low',
                color: result.sentiment?.label === 'POSITIVE' ? '#34d399' : '#f87171' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--bg-secondary)',
                border: '1px solid var(--border)', borderRadius: 14,
                padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700,
                  marginBottom: 4, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)',
                  textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Themes */}
          {result.llm_result?.themes?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Themes detected
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.llm_result.themes.map((t, i) => (
                  <span key={i} style={{ padding: '4px 14px', borderRadius: 20,
                    fontSize: 13, fontWeight: 500,
                    background: pillColors[i%4].bg,
                    color: pillColors[i%4].color }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reflection */}
          {result.llm_result?.reflection && (
            <div style={{ background: '#090f1e',
              border: '1px solid #142845',
              borderLeft: '4px solid var(--accent-blue)',
              borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ fontSize: 10, color: 'var(--accent-blue)',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Claude's Reflection
              </div>
              <p style={{ color: '#8ab4d8', lineHeight: 1.75, fontSize: 14 }}>
                {result.llm_result.reflection}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}