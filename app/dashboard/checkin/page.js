'use client'
import { useState, useEffect, useCallback } from 'react'
import { journal } from '../../../lib/api'

function SliderRow({ label, value, onChange, color, emoji, disabled }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: '#8888aa', fontWeight: 500 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{emoji(value)}</span>
          <span style={{ fontSize: 22, fontWeight: 700, color, minWidth: 28,
            textAlign: 'right' }}>{value}</span>
          <span style={{ fontSize: 12, color: '#444466' }}>/10</span>
        </div>
      </div>
      <div style={{ position: 'relative', height: 6, background: '#1a1a35',
        borderRadius: 3 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${value * 10}%`, background: color,
          borderRadius: 3, transition: 'width 0.2s' }} />
        <input type="range" min="1" max="10" value={value}
          onChange={e => onChange(Number(e.target.value))}
          disabled={disabled}
          style={{ position: 'absolute', inset: 0, width: '100%',
            opacity: 0, cursor: disabled ? 'not-allowed' : 'pointer',
            height: '100%' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        marginTop: 4 }}>
        <span style={{ fontSize: 10, color: '#333355' }}>Low</span>
        <span style={{ fontSize: 10, color: '#333355' }}>High</span>
      </div>
    </div>
  )
}

const moodEmoji = (val) => {
  if (val <= 2) return '😢'
  if (val <= 4) return '😔'
  if (val <= 6) return '😐'
  if (val <= 8) return '😊'
  return '🤩'
}
const energyEmoji = (val) => (val <= 3 ? '😴' : val <= 6 ? '🙂' : '⚡')
const stressEmoji = (val) => (val <= 3 ? '😌' : val <= 6 ? '😤' : '🤯')

export default function CheckInPage() {
  const [mood, setMood]         = useState(5)
  const [energy, setEnergy]     = useState(5)
  const [stress, setStress]     = useState(5)
  const [note, setNote]         = useState('')
  const [saved, setSaved]       = useState(false)
  const [loading, setLoading]   = useState(false)
  const [streak, setStreak]     = useState(0)
  const [history, setHistory]   = useState([])
  const [alreadyDone, setAlreadyDone] = useState(false)

  const calculateStreak = useCallback((data) => {
    if (!data.length) { setStreak(0); return }
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date))
    let count = 0
    let current = new Date()
    current.setHours(0, 0, 0, 0)

    for (const entry of sorted) {
      const entryDate = new Date(entry.date)
      entryDate.setHours(0, 0, 0, 0)
      const diff = (current - entryDate) / (1000 * 60 * 60 * 24)
      if (diff <= 1) { count++; current = entryDate }
      else break
    }
    setStreak(count)
  }, [])

  useEffect(() => {
    // localStorage only exists client-side, so this must run post-mount;
    // that inherently means a second render, which is what these setState
    // calls trigger — the alternative (reading in a lazy useState initializer)
    // would mismatch the server-prerendered HTML on hydration.
    /* eslint-disable react-hooks/set-state-in-effect */
    const stored = JSON.parse(localStorage.getItem('checkins') || '[]')
    setHistory(stored)
    calculateStreak(stored)

    const today = new Date().toDateString()
    const todayEntry = stored.find(c => new Date(c.date).toDateString() === today)
    if (todayEntry) {
      setAlreadyDone(true)
      setMood(todayEntry.mood)
      setEnergy(todayEntry.energy)
      setStress(todayEntry.stress)
      setNote(todayEntry.note || '')
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [calculateStreak])

  const handleSave = async () => {
    if (loading) return
    setLoading(true)
    const entry = {
      date: new Date().toISOString(),
      mood, energy, stress, note,
    }

    const stored = JSON.parse(localStorage.getItem('checkins') || '[]')
    const today  = new Date().toDateString()
    const filtered = stored.filter(c => new Date(c.date).toDateString() !== today)
    const updated  = [entry, ...filtered]
    localStorage.setItem('checkins', JSON.stringify(updated))
    calculateStreak(updated)
    setHistory(updated)

    if (note.trim()) {
      try {
        await journal.create(
          `Daily check-in — Mood: ${mood}/10, Energy: ${energy}/10, Stress: ${stress}/10. ${note}`
        )
      } catch {}
    }

    setSaved(true)
    setAlreadyDone(true)
    setLoading(false)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Daily Check-in
          </h1>
          <p style={{ color: '#8888aa', fontSize: 14 }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric'
            })}
          </p>
        </div>

        {/* Streak */}
        <div style={{ background: 'linear-gradient(135deg, #1a1200, #2a2000)',
          border: '1px solid rgba(251,191,36,0.3)', borderRadius: 16,
          padding: '0.875rem 1.25rem', textAlign: 'center',
          boxShadow: '0 0 20px rgba(251,191,36,0.1)' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24',
            lineHeight: 1 }}>🔥 {streak}</div>
          <div style={{ fontSize: 11, color: '#92710a', marginTop: 4,
            textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Day streak
          </div>
        </div>
      </div>

      {/* Already done banner */}
      {alreadyDone && !saved && (
        <div style={{ background: 'rgba(52,211,153,0.08)',
          border: '1px solid rgba(52,211,153,0.2)',
          borderLeft: '3px solid #34d399', borderRadius: 12,
          padding: '0.875rem 1rem', marginBottom: '1.5rem',
          fontSize: 13, color: '#34d399' }}>
          ✅ You already checked in today! Come back tomorrow to keep your streak.
        </div>
      )}

      {/* Success banner */}
      {saved && (
        <div style={{ background: 'rgba(52,211,153,0.08)',
          border: '1px solid rgba(52,211,153,0.2)',
          borderLeft: '3px solid #34d399', borderRadius: 12,
          padding: '0.875rem 1rem', marginBottom: '1.5rem',
          fontSize: 13, color: '#34d399' }}>
          ✅ Check-in saved! Great job keeping your streak going.
        </div>
      )}

      {/* Sliders card */}
      <div style={{ background: '#0d0d22', border: '1px solid #1a1a35',
        borderRadius: 20, padding: '1.5rem', marginBottom: '1rem' }}>

        <SliderRow label="Mood" value={mood} onChange={setMood}
          color="#34d399" emoji={moodEmoji} disabled={alreadyDone} />
        <SliderRow label="Energy" value={energy} onChange={setEnergy}
          color="#4a9eff" emoji={energyEmoji} disabled={alreadyDone} />
        <SliderRow label="Stress" value={stress} onChange={setStress}
          color="#f87171" emoji={stressEmoji} disabled={alreadyDone} />

        {/* Note */}
        <div style={{ marginTop: '0.5rem' }}>
          <label style={{ fontSize: 12, color: '#8888aa', display: 'block',
            marginBottom: 8, fontWeight: 500 }}>
            Quick note (optional)
          </label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            disabled={alreadyDone}
            placeholder="How are you feeling today?..."
            rows={3}
            style={{ width: '100%', background: '#080818',
              border: '1px solid #1a1a35', borderRadius: 12,
              padding: '0.75rem 1rem', color: 'white', fontSize: 13,
              outline: 'none', resize: 'none', fontFamily: 'inherit',
              opacity: alreadyDone ? 0.5 : 1 }} />
        </div>
      </div>

      {/* Save button */}
      {!alreadyDone && (
        <button onClick={handleSave} disabled={loading}
          style={{ width: '100%', padding: '1rem',
            background: 'linear-gradient(135deg, #4a9eff, #2563eb)',
            borderRadius: 14, color: 'white', fontWeight: 600,
            fontSize: 15, border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(74,158,255,0.3)',
            opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Saving...' : '✨ Save Check-in'}
        </button>
      )}

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ fontSize: 11, color: '#555578', textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: '1rem' }}>
            Recent check-ins
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(0, 7).map((entry, i) => (
              <div key={i} style={{ background: '#0d0d22',
                border: '1px solid #1a1a35', borderRadius: 12,
                padding: '0.75rem 1rem', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, color: '#555578' }}>
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric'
                  })}
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { label: 'Mood', value: entry.mood, color: '#34d399' },
                    { label: 'Energy', value: entry.energy, color: '#4a9eff' },
                    { label: 'Stress', value: entry.stress, color: '#f87171' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700,
                        color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: '#444466' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
