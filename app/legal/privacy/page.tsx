import Link from 'next/link'
import { BRAND } from '@/lib/brand'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-[#A9B1BE] hover:text-[#C9A25F] text-sm transition-colors">← Home</Link>
        <h1 className="text-3xl font-bold text-[#F7F7F5] mt-8 mb-2">Privacy Policy</h1>
        <p className="text-[#A9B1BE] text-sm mb-8">Last updated: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>

        <div className="prose prose-invert text-[#A9B1BE] space-y-6 text-sm leading-relaxed">
          <p><strong className="text-[#F7F7F5]">{BRAND.fullName} LLC</strong> ("we," "us," or "our") is committed to protecting your privacy. This policy describes how we collect, use, and protect your information.</p>

          <h2 className="text-[#F7F7F5] text-lg font-semibold mt-6">Information We Collect</h2>
          <p>When you submit a consultation request or contact us, we may collect your name, email address, phone number, county, and information about your insurance interests. We also collect analytics data (page views, form interactions) via Google Analytics 4.</p>

          <h2 className="text-[#F7F7F5] text-lg font-semibold mt-6">How We Use Your Information</h2>
          <p>We use your information to respond to your requests, schedule consultations, send follow-up communications, and improve our services. We do not sell your personal information to third parties.</p>

          <h2 className="text-[#F7F7F5] text-lg font-semibold mt-6">Data Retention</h2>
          <p>We retain your contact information for as long as necessary to provide services and comply with legal obligations. You may request deletion of your data at any time.</p>

          <h2 className="text-[#F7F7F5] text-lg font-semibold mt-6">Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at <a href={`mailto:${BRAND.email}`} className="text-[#C9A25F]">{BRAND.email}</a>.</p>

          <h2 className="text-[#F7F7F5] text-lg font-semibold mt-6">Contact</h2>
          <p>{BRAND.fullName} LLC · PA License #{BRAND.paLicense} · <a href={`mailto:${BRAND.email}`} className="text-[#C9A25F]">{BRAND.email}</a></p>
        </div>
      </div>
    </div>
  )
}
