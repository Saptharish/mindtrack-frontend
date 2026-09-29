'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '../../lib/api'

function ErrorBanner({ error }) {
  const isSuccess = error.includes('created') || error.includes('confirmed')
  return (
    <div style={{
      padding: '0.75rem 1rem', borderRadius: 10, fontSize: 13,
      background: isSuccess ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
      border: `1px solid ${isSuccess ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
      color: isSuccess ? '#34d399' : '#f87171',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span>{isSuccess ? '✅' : '⚠️'}</span>
      {error}
    </div>
  )
}

const FALLBACK_QUESTIONS = [
  'What was the name of your first pet?',
  'What city were you born in?',
  'What was the name of your first school?',
  "What is your mother's maiden name?",
  'What was your childhood nickname?',
]

export default function Login() {
  const router              = useRouter()
  const [mode, setMode]     = useState('login') // 'login' | 'register' | 'recover'
  const [email, setEmail]   = useState('')
  const [password, setPass] = useState('')
  const [username, setUser] = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const [questions, setQuestions]           = useState(FALLBACK_QUESTIONS)
  const [securityQuestion, setSecQuestion]  = useState(FALLBACK_QUESTIONS[0])
  const [securityAnswer, setSecAnswer]      = useState('')

  const [recoverStep, setRecoverStep]       = useState('email') // email | answer | reset | done
  const [recoverEmail, setRecoverEmail]     = useState('')
  const [recoverQuestion, setRecoverQuestion] = useState('')
  const [recoverAnswer, setRecoverAnswer]   = useState('')
  const [recoverToken, setRecoverToken]     = useState('')
  const [recoverUsername, setRecoverUsername] = useState('')
  const [recoverNewPass, setRecoverNewPass] = useState('')

  useEffect(() => {
    auth.securityQuestions().then(res => {
      if (res.data?.questions?.length) {
        setQuestions(res.data.questions)
        setSecQuestion(res.data.questions[0])
      }
    }).catch(() => {})
  }, [])

  const resetRecoverState = () => {
    setRecoverStep('email')
    setRecoverEmail('')
    setRecoverQuestion('')
    setRecoverAnswer('')
    setRecoverToken('')
    setRecoverUsername('')
    setRecoverNewPass('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      if (mode === 'register') {
        await auth.register({
          email: email.trim(), username: username.trim(), password,
          security_question: securityQuestion, security_answer: securityAnswer,
        })
        setMode('login')
        setPass('')
        setError('Account created! Please sign in.')
      } else {
        const res = await auth.login(email.trim(), password)
        localStorage.setItem('token', res.data.access_token)
        router.push('/dashboard')
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.detail || 'Something went wrong. Try again.')
      } else if (err.code === 'ECONNABORTED') {
        setError('The server is taking too long to respond. Please try again.')
      } else {
        setError('Cannot reach the server. Check your connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRecoverStart = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const res = await auth.recoverStart(recoverEmail.trim())
      setRecoverQuestion(res.data.security_question)
      setRecoverStep('answer')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRecoverVerify = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const res = await auth.recoverVerify(recoverEmail.trim(), recoverAnswer)
      setRecoverToken(res.data.reset_token)
      setRecoverUsername(res.data.username)
      setRecoverStep('reset')
    } catch (err) {
      setError(err.response?.data?.detail || 'Incorrect answer. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRecoverReset = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      await auth.recoverReset(recoverToken, recoverNewPass)
      setRecoverStep('done')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.875rem 1rem', background: '#080818',
    border: '1px solid #1a1a35', borderRadius: 12, color: 'white', fontSize: 14,
    outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit',
  }
  const labelStyle = {
    fontSize: 12, fontWeight: 500, color: '#8888aa', display: 'block',
    marginBottom: 6, letterSpacing: '0.04em',
  }
  const primaryButtonStyle = (disabled) => ({
    width: '100%', padding: '0.9rem',
    background: disabled ? 'rgba(74,158,255,0.5)' : 'linear-gradient(135deg, #4a9eff, #2563eb)',
    borderRadius: 12, color: 'white', fontWeight: 600, fontSize: 15,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s', letterSpacing: '0.02em',
    boxShadow: disabled ? 'none' : '0 4px 20px rgba(74,158,255,0.3)',
  })

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'radial-gradient(ellipse at 50% 0%, #0d1a2e 0%, #080818 60%)',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -200, left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74,158,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Left side — branding */}
      <div style={{
        flex: 1, flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '3rem', display: 'none',
      }} className="left-panel">

      </div>

      {/* Center — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '2rem',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #1a3a6a, #080820 60%)',
              border: '1px solid rgba(74,158,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, margin: '0 auto 1rem',
              boxShadow: '0 0 30px rgba(74,158,255,0.15)',
            }}>🧠</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'white',
              letterSpacing: '-0.5px', marginBottom: 6 }}>Myndara</h1>
            <p style={{ color: '#555578', fontSize: 14 }}>
              Your private AI wellness companion
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: 'rgba(13,13,34,0.8)',
            border: '1px solid rgba(26,26,53,0.8)',
            borderRadius: 20, padding: '2rem',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          }}>

            {/* Tabs */}
            {mode !== 'recover' && (
              <div style={{
                display: 'flex', background: '#080818',
                borderRadius: 10, padding: 4, marginBottom: '1.75rem',
                border: '1px solid #1a1a35',
              }}>
                {['login', 'register'].map(m => (
                  <button key={m} type="button" disabled={loading}
                    onClick={() => { setMode(m); setError('') }}
                    style={{
                      flex: 1, padding: '0.6rem', borderRadius: 8,
                      fontSize: 13, fontWeight: 500, border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                      background: mode === m ? '#1a3a6a' : 'transparent',
                      color: mode === m ? 'white' : '#555578',
                      boxShadow: mode === m ? '0 2px 8px rgba(74,158,255,0.2)' : 'none',
                    }}>
                    {m === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>
            )}

            {mode === 'recover' ? (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 4 }}>
                  Reset your password
                </h2>
                <p style={{ fontSize: 13, color: '#8888aa', marginBottom: '1.5rem' }}>
                  Answer your security question to regain access — no email required.
                </p>

                {recoverStep === 'email' && (
                  <form onSubmit={handleRecoverStart}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={labelStyle}>ACCOUNT EMAIL</label>
                        <input type="email" value={recoverEmail}
                          onChange={e => setRecoverEmail(e.target.value)}
                          placeholder="you@email.com" required style={inputStyle} />
                      </div>
                      {error && <ErrorBanner error={error} />}
                      <button type="submit" disabled={loading} style={primaryButtonStyle(loading)}>
                        {loading ? 'Please wait...' : 'Continue'}
                      </button>
                    </div>
                  </form>
                )}

                {recoverStep === 'answer' && (
                  <form onSubmit={handleRecoverVerify}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={labelStyle}>SECURITY QUESTION</label>
                        <p style={{ fontSize: 14, color: '#c8c8e8', marginBottom: 10 }}>
                          {recoverQuestion}
                        </p>
                        <input type="text" value={recoverAnswer}
                          onChange={e => setRecoverAnswer(e.target.value)}
                          placeholder="Your answer" required style={inputStyle} />
                      </div>
                      {error && <ErrorBanner error={error} />}
                      <button type="submit" disabled={loading} style={primaryButtonStyle(loading)}>
                        {loading ? 'Checking...' : 'Verify answer'}
                      </button>
                    </div>
                  </form>
                )}

                {recoverStep === 'reset' && (
                  <form onSubmit={handleRecoverReset}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{
                        padding: '0.75rem 1rem', borderRadius: 10, fontSize: 13,
                        background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                        color: '#34d399' }}>
                        ✅ Identity confirmed — your username is <strong>{recoverUsername}</strong>
                      </div>
                      <div>
                        <label style={labelStyle}>NEW PASSWORD</label>
                        <input type="password" value={recoverNewPass}
                          onChange={e => setRecoverNewPass(e.target.value)}
                          placeholder="••••••••" required minLength={8} style={inputStyle} />
                      </div>
                      {error && <ErrorBanner error={error} />}
                      <button type="submit" disabled={loading} style={primaryButtonStyle(loading)}>
                        {loading ? 'Saving...' : 'Set new password'}
                      </button>
                    </div>
                  </form>
                )}

                {recoverStep === 'done' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{
                      padding: '0.75rem 1rem', borderRadius: 10, fontSize: 13,
                      background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                      color: '#34d399' }}>
                      ✅ Password updated! You can sign in with your new password now.
                    </div>
                    <button type="button" onClick={() => { setMode('login'); setError(''); resetRecoverState() }}
                      style={primaryButtonStyle(false)}>
                      Back to sign in
                    </button>
                  </div>
                )}

                <button type="button"
                  onClick={() => { setMode('login'); setError(''); resetRecoverState() }}
                  style={{ marginTop: '1.25rem', fontSize: 12, color: '#555578',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  ← Back to sign in
                </button>
              </div>
            ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {mode === 'register' && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500,
                      color: '#8888aa', display: 'block', marginBottom: 6,
                      letterSpacing: '0.04em' }}>
                      USERNAME
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 14, top: '50%',
                        transform: 'translateY(-50%)', fontSize: 16, opacity: 0.5 }}>
                        👤
                      </div>
                      <input type="text" value={username}
                        onChange={e => setUser(e.target.value)}
                        placeholder="your_username"
                        required
                        style={{
                          width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                          background: '#080818', border: '1px solid #1a1a35',
                          borderRadius: 12, color: 'white', fontSize: 14,
                          outline: 'none', transition: 'border-color 0.2s',
                          fontFamily: 'inherit',
                        }}
                        onFocus={e => e.target.style.borderColor = '#4a9eff'}
                        onBlur={e => e.target.style.borderColor = '#1a1a35'}
                      />
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <div>
                    <label style={labelStyle}>SECURITY QUESTION</label>
                    <p style={{ fontSize: 11, color: '#555578', marginBottom: 8 }}>
                      Used to recover your account if you forget your password.
                    </p>
                    <select value={securityQuestion}
                      onChange={e => setSecQuestion(e.target.value)}
                      style={{ ...inputStyle, marginBottom: 10, cursor: 'pointer' }}>
                      {questions.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                    <input type="text" value={securityAnswer}
                      onChange={e => setSecAnswer(e.target.value)}
                      placeholder="Your answer" required minLength={2} style={inputStyle} />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 12, fontWeight: 500,
                    color: '#8888aa', display: 'block', marginBottom: 6,
                    letterSpacing: '0.04em' }}>
                    EMAIL ADDRESS
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 14, top: '50%',
                      transform: 'translateY(-50%)', fontSize: 16, opacity: 0.5 }}>
                      ✉️
                    </div>
                    <input type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      required
                      style={{
                        width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                        background: '#080818', border: '1px solid #1a1a35',
                        borderRadius: 12, color: 'white', fontSize: 14,
                        outline: 'none', transition: 'border-color 0.2s',
                        fontFamily: 'inherit',
                      }}
                      onFocus={e => e.target.style.borderColor = '#4a9eff'}
                      onBlur={e => e.target.style.borderColor = '#1a1a35'}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 500,
                      color: '#8888aa', letterSpacing: '0.04em' }}>
                      PASSWORD
                    </label>
                    {mode === 'login' && (
                      <button type="button"
                        onClick={() => { setMode('recover'); setError(''); resetRecoverState() }}
                        style={{ fontSize: 12, color: '#4a9eff',
                          background: 'none', border: 'none',
                          cursor: 'pointer', padding: 0 }}>
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 14, top: '50%',
                      transform: 'translateY(-50%)', fontSize: 16, opacity: 0.5 }}>
                      🔒
                    </div>
                    <input type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPass(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        width: '100%', padding: '0.875rem 3rem 0.875rem 2.75rem',
                        background: '#080818', border: '1px solid #1a1a35',
                        borderRadius: 12, color: 'white', fontSize: 14,
                        outline: 'none', transition: 'border-color 0.2s',
                        fontFamily: 'inherit',
                      }}
                      onFocus={e => e.target.style.borderColor = '#4a9eff'}
                      onBlur={e => e.target.style.borderColor = '#1a1a35'}
                    />
                    <button type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 14, top: '50%',
                        transform: 'translateY(-50%)', background: 'none',
                        border: 'none', cursor: 'pointer',
                        fontSize: 16, opacity: 0.5, padding: 0 }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {error && <ErrorBanner error={error} />}

                <button type="submit" disabled={loading}
                  style={{
                    width: '100%', padding: '0.9rem',
                    background: loading
                      ? 'rgba(74,158,255,0.5)'
                      : 'linear-gradient(135deg, #4a9eff, #2563eb)',
                    borderRadius: 12, color: 'white',
                    fontWeight: 600, fontSize: 15,
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', letterSpacing: '0.02em',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(74,158,255,0.3)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                  }}>
                  {loading ? (
                    <>
                      <div style={{
                        width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      Please wait...
                    </>
                  ) : (
                    mode === 'login' ? '→  Sign in to Myndara' : '→  Create your account'
                  )}
                </button>
              </div>
            </form>
            )}

            {mode !== 'recover' && (
              <>
                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center',
                  gap: 12, margin: '1.5rem 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#1a1a35' }} />
                  <span style={{ fontSize: 12, color: '#333355' }}>SECURE & PRIVATE</span>
                  <div style={{ flex: 1, height: 1, background: '#1a1a35' }} />
                </div>

                {/* Trust badges */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                  {['🔐 Encrypted', '🧠 AI-powered', '🌿 Private'].map(badge => (
                    <div key={badge} style={{ fontSize: 11, color: '#444466',
                      display: 'flex', alignItems: 'center', gap: 4 }}>
                      {badge}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer note */}
          <p style={{ textAlign: 'center', fontSize: 12,
            color: '#333355', marginTop: '1.5rem' }}>
            By signing in you agree to our{' '}
            <Link href="/terms" style={{ color: '#4a9eff' }}>Terms</Link>
            {' & '}
            <Link href="/privacy" style={{ color: '#4a9eff' }}>Privacy Policy</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: #333355; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0px 1000px #080818 inset !important;
          -webkit-text-fill-color: white !important;
        }
      `}</style>
    </div>
  )
}