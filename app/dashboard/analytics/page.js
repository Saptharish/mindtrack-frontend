'use client'
import { useState, useEffect } from 'react'
import { journal } from '../../../lib/api'

export default function AnalyticsPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    journal.analytics()
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: '2rem', display: 'flex',
      alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ color: 'var(--text-secondary)' }}>Loading analytics...</div>
    </div>
  )

  if (!data || data.total === 0) return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
      <div style={{ color: 'var(--text-secondary)' }}>
        No data yet. Start journaling to see analytics.
      </div>
    </div>
  )

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Analytics</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Your mood and wellness trends over time.
      </p>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16, marginBottom: '2rem' }}>
        {[
          { label: 'Total Entries', value: data.total,        color: '#4a9eff' },
          { label: 'Avg Mood',      value: data.avg_mood,     color: '#34d399' },
          { label: 'Avg Distress',  value: data.avg_distress, color: '#fbbf24' },
          { label: 'Best Mood',     value: data.best_mood,    color: '#9b6dff' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--bg-secondary)',
            border: '1px solid var(--border)', borderRadius: 14,
            padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 700,
              marginBottom: 4, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Mood chart */}
      {data.trend && data.trend.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
            7-day mood trend
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end',
            gap: 12, height: 160, paddingBottom: 8 }}>
            {data.trend.map((t, i) => (
              <div key={i} style={{ flex: 1, display: 'flex',
                flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: '100%', borderRadius: '6px 6px 0 0',
                  background: 'linear-gradient(to top, #4a9eff, rgba(74,158,255,0.4))',
                  height: `${((t.mood || 0) / 10) * 140}px`,
                  minHeight: 4, transition: 'height 0.5s ease' }} />
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {t.date?.slice(5)}
                </div>
              </div>
            ))}
          </div>

          {/* Distress overlay legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2,
                background: 'linear-gradient(to top, #4a9eff, rgba(74,158,255,0.4))' }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Mood score</span>
            </div>
          </div>
        </div>
      )}

      {/* Distress trend */}
      {data.trend && data.trend.some(t => t.distress) && (
        <div style={{ background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: 16,
          padding: '1.5rem', marginTop: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
            7-day distress trend
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end',
            gap: 12, height: 120, paddingBottom: 8 }}>
            {data.trend.map((t, i) => (
              <div key={i} style={{ flex: 1, display: 'flex',
                flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: '100%', borderRadius: '6px 6px 0 0',
                  background: 'linear-gradient(to top, #f87171, rgba(248,113,113,0.4))',
                  height: `${((t.distress || 0) / 10) * 100}px`,
                  minHeight: 4 }} />
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {t.date?.slice(5)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}