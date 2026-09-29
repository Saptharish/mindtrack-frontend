import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={{ padding: '3rem 2rem', maxWidth: 720, margin: '0 auto', color: '#c8c8e8' }}>
      <Link href="/login" style={{ fontSize: 13, color: '#4a9eff' }}>← Back</Link>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: '1rem 0' }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: 13, color: '#8888aa', marginBottom: '1.5rem' }}>
        Placeholder — replace this page with your actual Privacy Policy before
        launching to real users. Given Myndara stores journal entries and chat
        conversations that can include sensitive mental-health disclosures, this
        should clearly explain what is stored, that entries and chats are sent to
        Anthropic&apos;s API for analysis, how long data is kept, who can access it,
        and how a user can export or delete their data.
      </p>
    </div>
  )
}
