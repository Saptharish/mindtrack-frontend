'use client'
import { useState, useEffect } from 'react'
import { journal, maya } from '../../../lib/api'

export default function HistoryPage() {
  const [tab, setTab]             = useState('maya')
  const [entries, setEntries]     = useState([])
  const [sessions, setSessions]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState({})
  const [deleting, setDeleting]   = useState(null)

  useEffect(() => {
    Promise.all([
      journal.getAll().catch(() => ({ data: [] })),
      maya.getSessions().catch(() => ({ data: [] })),
    ]).then(([j, m]) => {
      setEntries(j.data || [])
      setSessions(m.data || [])
      setLoading(false)
    })
  }, [])

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const handleDeleteSession = async (id) => {
    if (!confirm('Delete this Maya conversation?')) return
    setDeleting(id)
    try {
      await maya.deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
    } catch {
      alert('Failed to delete conversation.')
    }
    setDeleting(null)
  }

  const handleDeleteEntry = async (id) => {
    if (!confirm('Delete this journal entry?')) return
    setDeleting(id)
    try {
      await journal.delete(id)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch {
      alert('Failed to delete entry.')
    }
    setDeleting(null)
  }

  if (loading) return (
    <div style={{ padding: '2rem', display: 'flex',
      alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ color: 'var(--text-secondary)' }}>Loading history...</div>
    </div>
  )

  const pillColors = [
    { bg: '#0a1e38', color: '#4a9eff' },
    { bg: '#160f2a', color: '#9b6dff' },
    { bg: '#081e14', color: '#34d399' },
  ]

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>History</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '2rem',
        background: '#0d0d22', border: '1px solid #1a1a35',
        borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {[
          { key: 'maya',    label: '🧠 Maya Conversations', count: sessions.length },
          { key: 'journal', label: '📋 Journal Entries',    count: entries.length  },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: 10,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              transition: 'all 0.2s',
              background: tab === t.key ? '#1a1a40' : 'transparent',
              color: tab === t.key ? 'white' : '#555578',
              boxShadow: tab === t.key ? '0 0 12px rgba(74,158,255,0.1)' : 'none' }}>
            {t.label}
            <span style={{ marginLeft: 8, fontSize: 11, padding: '1px 7px',
              borderRadius: 20, background: tab === t.key ? '#4a9eff22' : '#1a1a35',
              color: tab === t.key ? '#4a9eff' : '#555578' }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Maya Conversations */}
      {tab === 'maya' && (
        sessions.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              No Maya conversations yet. Start talking to Maya!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.map((session, i) => {
              const conversation = session.conversation || []
              const userMsgs  = conversation.filter(m => m.role === 'user')
              const firstUser = userMsgs[0]?.content || ''
              const date      = session.created_at
                ? new Date(session.created_at).toLocaleString()
                : `Session ${i + 1}`
              const isExpanded = expanded[session.id]

              return (
                <div key={session.id}
                  className="animate-fadeInUp"
                  style={{ background: 'var(--bg-secondary)',
                    border: '1px solid #1a1a35', borderRadius: 16,
                    overflow: 'hidden',
                    animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}>

                  {/* Session header */}
                  <div style={{ padding: '1.25rem', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center',
                        gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#555578' }}>
                          📅 {date}
                        </span>
                        <span style={{ fontSize: 11, padding: '2px 8px',
                          borderRadius: 6, background: '#0a1e38', color: '#4a9eff' }}>
                          {userMsgs.length} message{userMsgs.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {firstUser && !isExpanded && (
                        <p style={{ fontSize: 13, color: '#8888aa', margin: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', maxWidth: '90%' }}>
                          "{firstUser}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => toggleExpand(session.id)}
                        style={{ padding: '0.4rem 0.875rem', borderRadius: 8,
                          border: '1px solid #1a1a35', cursor: 'pointer',
                          background: isExpanded ? '#1a1a40' : 'transparent',
                          color: '#8888aa', fontSize: 12 }}>
                        {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={deleting === session.id}
                        style={{ padding: '0.4rem 0.875rem', borderRadius: 8,
                          border: '1px solid rgba(248,113,113,0.3)', cursor: 'pointer',
                          background: 'rgba(239,68,68,0.06)',
                          color: '#f87171', fontSize: 12,
                          opacity: deleting === session.id ? 0.5 : 1 }}>
                        {deleting === session.id ? '...' : '🗑 Delete'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded conversation */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #1a1a35',
                      padding: '1rem', display: 'flex',
                      flexDirection: 'column', gap: 10, maxHeight: 420,
                      overflowY: 'auto' }}>
                      {conversation.map((msg, j) => (
                        <div key={j} style={{
                          display: 'flex',
                          flexDirection: msg.role === 'user' ? 'column' : 'row',
                          alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          gap: msg.role === 'user' ? 4 : 8 }}>
                          {msg.role === 'assistant' && (
                            <div style={{ width: 24, height: 24, borderRadius: '50%',
                              background: '#0f2a1a', border: '1px solid #0e2e1e',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>
                              🧠
                            </div>
                          )}
                          <div style={{ maxWidth: '80%' }}>
                            <div style={{ fontSize: 9, fontWeight: 600,
                              textTransform: 'uppercase', letterSpacing: '0.08em',
                              marginBottom: 3,
                              textAlign: msg.role === 'user' ? 'right' : 'left',
                              color: msg.role === 'user' ? '#4a9eff' : '#34d399' }}>
                              {msg.role === 'user' ? 'You' : 'Maya'}
                            </div>
                            <div style={{
                              padding: '0.6rem 0.875rem', fontSize: 13,
                              lineHeight: 1.6,
                              borderRadius: msg.role === 'user'
                                ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                              background: msg.role === 'user' ? '#4a9eff' : '#0d0d22',
                              color: msg.role === 'user' ? 'white' : '#c8c8e8',
                              border: msg.role === 'user' ? 'none' : '1px solid #1a1a35' }}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Journal Entries */}
      {tab === 'journal' && (
        entries.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              No entries yet. Start journaling!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {entries.map((entry, i) => {
              const themes = entry.themes?.split(',').filter(Boolean) || []
              const dScore = entry.distress_score || 0
              const dColor = dScore >= 7 ? '#f87171'
                           : dScore >= 4 ? '#fbbf24' : '#34d399'
              return (
                <div key={entry.id}
                  className="animate-fadeInUp"
                  style={{ background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)', borderRadius: 16,
                    padding: '1.25rem',
                    animationDelay: `${Math.min(i * 0.05, 0.3)}s`,
                    transition: 'border-color 0.2s' }}>

                  <div style={{ display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center',
                      gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        📅 {entry.date}
                      </span>
                      <span style={{ fontSize: 11, padding: '3px 10px',
                        borderRadius: 6, background: 'var(--bg-tertiary)',
                        color: '#34d399' }}>
                        Mood: {entry.sentiment_score}/10
                      </span>
                      <span style={{ fontSize: 11, padding: '3px 10px',
                        borderRadius: 6, background: 'var(--bg-tertiary)',
                        color: dColor }}>
                        Distress: {dScore}/10
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      disabled={deleting === entry.id}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: 8,
                        border: '1px solid rgba(248,113,113,0.3)', cursor: 'pointer',
                        background: 'rgba(239,68,68,0.06)',
                        color: '#f87171', fontSize: 12, flexShrink: 0,
                        opacity: deleting === entry.id ? 0.5 : 1 }}>
                      {deleting === entry.id ? '...' : '🗑 Delete'}
                    </button>
                  </div>

                  <p style={{ fontSize: 14, color: 'var(--text-secondary)',
                    lineHeight: 1.65, marginBottom: 10,
                    display: '-webkit-box', WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {entry.raw_text}
                  </p>

                  {themes.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap',
                      gap: 6, marginBottom: 10 }}>
                      {themes.map((t, j) => (
                        <span key={j} style={{ fontSize: 11, padding: '3px 10px',
                          borderRadius: 20, background: pillColors[j%3].bg,
                          color: pillColors[j%3].color }}>
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {entry.llm_reflection && (
                    <div style={{ background: 'var(--bg-primary)',
                      borderLeft: '3px solid var(--accent-blue)',
                      borderRadius: '0 8px 8px 0',
                      padding: '0.6rem 0.875rem' }}>
                      <p style={{ fontSize: 12, color: '#8ab4d8', lineHeight: 1.6 }}>
                        {entry.llm_reflection}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
