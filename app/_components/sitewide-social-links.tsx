import { Facebook, Instagram, Linkedin } from 'lucide-react'
import { BRAND } from '@/lib/brand'

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: BRAND.facebook,
    icon: Facebook,
  },
  {
    label: 'Instagram',
    href: BRAND.instagram,
    icon: Instagram,
  },
  {
    label: 'LinkedIn',
    href: BRAND.linkedin,
    icon: Linkedin,
  },
] as const

export default function SitewideSocialLinks() {
  return (
    <aside
      aria-label="Latimore Life & Legacy social media"
      className="fixed bottom-4 left-4 z-[900] flex items-center gap-2 rounded-full border border-[#C9A25F]/50 bg-[#0E1A2B]/95 p-2 shadow-xl backdrop-blur"
    >
      {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Follow Latimore Life & Legacy on ${label}`}
          title={label}
          data-track-event="social_link_clicked"
          data-track-label={label}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A25F]/40 text-[#E5C882] transition hover:border-[#C9A25F] hover:bg-[#C9A25F] hover:text-[#0E1A2B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5C882]"
        >
          <Icon size={20} aria-hidden="true" />
        </a>
      ))}
    </aside>
  )
}
