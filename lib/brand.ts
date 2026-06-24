/**
 * COLORS — canonical design-token values for use in inline styles and
 * TypeScript components that cannot consume CSS custom properties directly.
 *
 * Keep these in sync with the :root tokens in app/globals.css.
 * When building new components, prefer CSS classes and var(--token-name)
 * over importing from here.
 */
export const COLORS = {
  // Dark surfaces
  navyDeep:  '#0B0F17',   /* --color-navy-900  admin/dark bg           */
  navy:      '#0E1A2B',   /* --color-navy-800  public headings/hero     */
  navyMid:   '#142235',   /* --color-navy-700                           */
  navyHero:  '#1a2942',   /* --color-navy-600  hero gradient end        */
  surface:   '#1a2535',   /* --color-navy-500  admin surface            */

  // Gold accent
  gold:       '#C9A25F',  /* --color-gold-500  primary CTA / brand      */
  goldHover:  '#d4b48a',  /* --color-gold-400  hover state              */
  goldLight:  '#E5C882',  /* --color-gold-300  text/icon on dark        */
  goldBorder: '#e8d5b8',  /* --color-gold-200                           */
  goldPale:   '#fdf6ee',  /* --color-gold-100  pale panel bg            */
  goldCream:  '#f9f6f0',  /* --color-gold-50   editorial bg             */

  // Neutrals
  cream:   '#F4F1EA',
  white:   '#ffffff',
  gray50:  '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray500: '#6b7280',
  gray600: '#475467',
  gray700: '#374151',

  // On-dark text
  ink:      '#F7F7F5',   /* --color-ink       primary light text        */
  inkMuted: '#A9B1BE',   /* --color-ink-muted muted light text          */

  // Semantic shortcuts
  text:      '#0E1A2B',  /* --color-text                                */
  textMuted: '#475467',  /* --color-text-muted                          */
  border:    '#e5e7eb',  /* --color-border                              */

  // Blog track accents
  trackA: '#2d5f8a',
  trackB: '#4a7c59',
  trackC: '#7a4f2e',
} as const

const DEFAULT_GOOGLE_APPOINTMENT_SCHEDULE_URL =
  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0RjEKuPGf76zHTJE0p3E_oOL0FJnPi5s28JlVnXPTHTdXkMJWqUWpbup9FNP_bOg6Z-4Zv_8Ph?gv=true'

export const BRAND = {
  // Public-facing name (use in headings/metadata)
  name: 'Latimore Life & Legacy',
  // Used when "LLC" is appended in legal copy
  fullName: 'Latimore Life & Legacy LLC',

  tagline: 'Protecting Today. Securing Tomorrow.',
  hashtag: '#TheBeatGoesOn',
  cardUrl: 'https://card.latimorelifelegacy.com',

  advisor: 'Jackson M. Latimore Sr., Founder & CEO',
  affiliation: 'In Affiliation with Global Financial Impact',

  phone: '(717) 615-2613',
  phoneRaw: '7176152613',
  email: 'jackson1989@latimorelegacy.com',

  nipr: '21638507',
  paLicense: '1268820',

  // Primary CTAs — keep public booking traffic on-site for stable tracking and fallback handling.
  bookingUrl: '/book',
  googleAppointmentScheduleUrl:
    process.env.NEXT_PUBLIC_GOOGLE_APPOINTMENT_SCHEDULE_URL ??
    DEFAULT_GOOGLE_APPOINTMENT_SCHEDULE_URL,

  // Legacy fallback only. Do not use this for primary public CTAs.
  filloutUrl: 'https://latimorelifelegacy.fillout.com/latimorelifelegacy',
  ethosUrl: 'https://agents.ethoslife.com/invite/29ad1',

  // Social
  instagram: 'https://www.instagram.com/latimorelifelegacy25/',
  linkedin: 'https://www.linkedin.com/in/startwithjacksongfi',
  facebook: 'https://www.facebook.com/LatimoreLegacyLLC/',

  instagramUrl: 'https://www.instagram.com/latimorelifelegacy25/',
  linkedinUrl: 'https://www.linkedin.com/in/startwithjacksongfi',
  facebookUrl: 'https://www.facebook.com/LatimoreLegacyLLC/',

  // Service region
  counties: ['Schuylkill', 'Luzerne', 'Northumberland'],

  // Used for absolute URLs in emails. Prefer NEXT_PUBLIC_BASE_URL when set;
  // otherwise default to the canonical public domain.
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.latimorelifelegacy.com',
} as const
