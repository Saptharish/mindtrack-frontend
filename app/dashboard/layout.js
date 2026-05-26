'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { auth, maya } from '../../lib/api'

export default function DashboardLayout({ children }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser]           = useState(null)
  const [stats, setStats]         = useState({ entries: 0, avgMood: 0, memDays: 0 })
  const [hoveredItem, setHovered] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    auth.me().then(res => setUser(res.data)).catch(() => {
      localStorage.removeItem('token')
      router.push('/login')
    })
    maya.memory().then(r => {
      setStats(prev => ({ ...prev, memDays: r.data.days_of_data || 0 }))
    }).catch(() => {})
  }, [router])

  const logout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard/maya',      label: 'Talk to Maya', icon: '💬', desc: 'Voice AI companion' },
    { href: '/dashboard/journal',   label: 'Journal',      icon: '📝', desc: 'Write your thoughts' },
    { href: '/dashboard/analytics', label: 'Analytics',    icon: '📊', desc: 'Mood trends' },
    { href: '/dashboard/history',   label: 'History',      icon: '📋', desc: 'Past entries' },
  ]

  const memColor = stats.memDays >= 3 ? '#34d399' : stats.memDays >= 1 ? '#fbbf24' : '#555578'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <aside style={{
        width: 240, display: 'flex', flexDirection: 'column',
        position: 'fixed', height: '100vh', zIndex: 50,
        background: 'linear-gradient(180deg, #0a0a1e 0%, #080818 100%)',
        borderRight: '1px solid #1a1a35',
      }}>

        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid #1a1a35' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #1a3a6a, #080820 60%)',
              border: '1px solid rgba(74,158,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: '0 0 12px rgba(74,158,255,0.1)',
            }}>🧠</div>
            <div>
              <div style={{ fontWeight: 700, color: 'white', fontSize: 16,
                letterSpacing: '-0.3px' }}>MindTrack</div>
              <div style={{ fontSize: 10, color: '#444466',
                letterSpacing: '0.04em' }}>Mental Wellness Journal</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, color: '#333355', textTransform: 'uppercase',
            letterSpacing: '0.12em', padding: '0 0.5rem', marginBottom: '0.75rem',
            fontWeight: 600 }}>Menu</div>

          {navItems.map(item => {
            const isActive = pathname === item.href
            const isHovered = hoveredItem === item.href
            return (
              <Link key={item.href} href={item.href}
                onMouseEnter={() => setHovered(item.href)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0.6rem 0.75rem', borderRadius: 10,
                  marginBottom: 2, textDecoration: 'none',
                  transition: 'all 0.2s',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(74,158,255,0.15), rgba(74,158,255,0.05))'
                    : isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: isActive ? '1px solid rgba(74,158,255,0.2)' : '1px solid transparent',
                }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15,
                  background: isActive ? 'rgba(74,158,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: isActive ? '1px solid rgba(74,158,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'white' : isHovered ? '#ccccee' : '#8888aa',
                    transition: 'color 0.2s',
                  }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: '#444466', marginTop: 1 }}>
                    {item.desc}
                  </div>
                </div>
                {isActive && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%',
                    background: '#4a9eff', flexShrink: 0 }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Memory status */}
        <div style={{ padding: '0.75rem', margin: '0 0.75rem',
          background: 'rgba(255,255,255,0.02)', borderRadius: 10,
          border: '1px solid #1a1a35', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: 10, color: '#444466', textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: 8 }}>Maya's memory</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: '#666688' }}>
              {stats.memDays >= 3 ? '🧠 Fully personalized'
               : stats.memDays >= 1 ? '⏳ Learning about you'
               : '💡 Building memory...'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: memColor }}>
              {stats.memDays}
            </div>
          </div>
          <div style={{ marginTop: 6, height: 3, background: '#1a1a35',
            borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2,
              background: memColor,
              width: `${Math.min((stats.memDays/3)*100, 100)}%`,
              transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* User */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid #1a1a35' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10,
              padding: '0.6rem 0.75rem', marginBottom: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a3a6a, #0a2a4a)',
                border: '1px solid rgba(74,158,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#4a9eff', flexShrink: 0,
              }}>
                {user.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'white', fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.username}
                </div>
                <div style={{ fontSize: 10, color: '#444466',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}
          <button onClick={logout}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            style={{
              width: '100%', padding: '0.6rem 0.75rem',
              borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#f87171',
              fontSize: 13, textAlign: 'left', display: 'flex',
              alignItems: 'center', gap: 8, transition: 'background 0.2s',
            }}>
            <span>↩</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}