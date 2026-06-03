import Link from 'next/link'
import { Shield, FileText, Mail } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Revoluzion Automotive Privacy Policy — how we collect and use your data',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Shield size={24} className="text-primary" />
          <h1 className="text-3xl font-bold text-text-primary">Privacy Policy</h1>
        </div>
        <p className="text-text-muted">Last updated: {new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="space-y-6 text-text-secondary text-sm leading-relaxed">
        <section className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-3">1. Information We Collect</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong className="text-text-primary">Account info:</strong> Email, username, display name, profile photo</li>
            <li><strong className="text-text-primary">Content:</strong> Posts, builds, listings, chat messages you create</li>
            <li><strong className="text-text-primary">Vehicle info:</strong> Cars you add to your garage</li>
            <li><strong className="text-text-primary">Usage data:</strong> Pages visited, features used (anonymized analytics)</li>
            <li><strong className="text-text-primary">Device info:</strong> Browser type, IP address, operating system</li>
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-3">2. How We Use Your Information</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>To provide and improve the Revoluzion platform</li>
            <li>To personalize your experience and content</li>
            <li>To process marketplace transactions and payments</li>
            <li>To send important account notifications</li>
            <li>To ensure platform security and prevent abuse</li>
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-3">3. Third-Party Services</h2>
          <p className="mb-3">We use trusted third-party providers:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong className="text-text-primary">Supabase:</strong> Database and authentication hosting</li>
            <li><strong className="text-text-primary">Google:</strong> OAuth sign-in and Maps</li>
            <li><strong className="text-text-primary">Stripe:</strong> Secure payment processing</li>
            <li><strong className="text-text-primary">Vercel:</strong> Web hosting and CDN</li>
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-3">4. Data Retention</h2>
          <p>Your data is retained while your account is active. You may request deletion of your account and all associated data by contacting us at <a href="mailto:hello@revoluzion.my" className="text-primary hover:text-primary-light">hello@revoluzion.my</a>.</p>
        </section>

        <section className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-3">5. Your Rights</h2>
          <p>Under the Personal Data Protection Act 2010 (PDPA Malaysia), you have the right to:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-3">6. Contact</h2>
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-primary" />
            <a href="mailto:hello@revoluzion.my" className="text-primary hover:text-primary-light">hello@revoluzion.my</a>
          </div>
        </section>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/legal/terms" className="text-primary hover:text-primary-light text-sm flex items-center gap-1">
          <FileText size={14} /> Terms of Service
        </Link>
        <Link href="/" className="text-text-muted hover:text-text-secondary text-sm">← Back to Home</Link>
      </div>
    </div>
  )
}
