import Link from 'next/link'

export default function TermsPage() {
  return (
    <div style={{ padding: '3rem 2rem', maxWidth: 720, margin: '0 auto', color: '#c8c8e8' }}>
      <Link href="/login" style={{ fontSize: 13, color: '#4a9eff' }}>← Back</Link>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: '1rem 0' }}>
        Terms of Service
      </h1>
      <p style={{ fontSize: 13, color: '#8888aa', marginBottom: '1.5rem' }}>
        Placeholder — replace this page with your actual Terms of Service before
        launching to real users. At minimum it should cover: acceptable use, account
        responsibilities, a clear statement that Myndara is not a substitute for
        professional mental health care or crisis support, data retention, and
        how to delete an account.
      </p>
    </div>
  )
}
