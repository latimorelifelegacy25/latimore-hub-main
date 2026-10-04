import Link from 'next/link'
import { BRAND } from '@/lib/brand'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-[#A9B1BE] hover:text-[#C9A25F] text-sm transition-colors">← Home</Link>
        <h1 className="text-3xl font-bold text-[#F7F7F5] mt-8 mb-2">Terms of Use</h1>
        <p className="text-[#A9B1BE] text-sm mb-8">Last updated: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
        <div className="space-y-6 text-[#A9B1BE] text-sm leading-relaxed">
          <p>By accessing this website, you agree to these terms. This site is for informational and educational purposes only and does not constitute an offer or solicitation for any specific insurance product.</p>
          <p>Content is provided as-is without warranty of any kind. {BRAND.fullName} reserves the right to update or remove content at any time.</p>
          <p>{BRAND.fullName} is not liable for any damages arising from your use of, or inability to use, this website or its content, to the fullest extent permitted by law.</p>
          <p>These terms are governed by the laws of the Commonwealth of Pennsylvania, without regard to its conflict-of-law provisions. Any dispute arising from these terms or use of this site will be subject to the exclusive jurisdiction of the state and federal courts located in Pennsylvania.</p>
          <p>Questions? <a href={`mailto:${BRAND.email}`} className="text-[#C9A25F]">{BRAND.email}</a></p>
        </div>
      </div>
    </div>
  )
}
