import Link from 'next/link'
import { FileText, Shield, Mail } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Revoluzion Automotive Terms of Service and User Agreement',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <FileText size={24} className="text-primary" />
          <h1 className="text-3xl font-bold text-text-primary">Terms of Service</h1>
        </div>
        <p className="text-text-muted">Last updated: {new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="prose prose-invert prose-cyan max-w-none space-y-6 text-text-secondary text-sm leading-relaxed">
        <section className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using the Revoluzion Automotive platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
        </section>

        <section className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-3">2. Use of the Platform</h2>
          <p className="mb-3">You may use Revoluzion Automotive to:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Share automotive content, builds, and experiences</li>
            <li>Connect with other automotive enthusiasts</li>
            <li>Buy and sell automotive products and parts</li>
            <li>Discover events and community meetups</li>
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-3">3. User Conduct</h2>
          <p className="mb-3">You agree not to:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Post offensive, illegal, or misleading content</li>
            <li>Harass, threaten, or abuse other members</li>
            <li>Attempt to hack, scrape, or disrupt the platform</li>
            <li>Sell counterfeit or illegal items on the marketplace</li>
            <li>Spam or send unsolicited messages</li>
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-3">4. Marketplace</h2>
          <p>Revoluzion Automotive acts as a platform connecting buyers and sellers. We do not take responsibility for individual transactions. All sales are between the parties involved. Buyers and sellers must comply with Malaysian consumer protection laws.</p>
        </section>

        <section className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-3">5. Intellectual Property</h2>
          <p>Content you post remains your property. By posting, you grant Revoluzion a non-exclusive license to display and promote your content within the platform. The Revoluzion logo, branding, and platform design are our intellectual property.</p>
        </section>

        <section className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-3">6. Limitation of Liability</h2>
          <p>Revoluzion Automotive is provided &quot;as is.&quot; We are not liable for any damages arising from your use of the platform, marketplace transactions, event attendance, or reliance on user-generated content.</p>
        </section>

        <section className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-3">7. Governing Law</h2>
          <p>These terms are governed by the laws of Malaysia. Any disputes shall be subject to the jurisdiction of Malaysian courts.</p>
        </section>

        <section className="card p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-3">8. Contact</h2>
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-primary" />
            <a href="mailto:hello@revoluzion.my" className="text-primary hover:text-primary-light">hello@revoluzion.my</a>
          </div>
        </section>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/legal/privacy" className="text-primary hover:text-primary-light text-sm flex items-center gap-1">
          <Shield size={14} /> Privacy Policy
        </Link>
        <Link href="/" className="text-text-muted hover:text-text-secondary text-sm">← Back to Home</Link>
      </div>
    </div>
  )
}
