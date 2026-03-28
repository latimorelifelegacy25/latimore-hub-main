export const BRAND = {
  // Public-facing name (use in headings/metadata)
  name: 'Latimore Life & Legacy',
  // Used when "LLC" is appended in legal copy
  fullName: 'Latimore Life & Legacy',

  tagline: 'Protecting Today. Securing Tomorrow.',
  hashtag: '#TheBeatGoesOn',
    cardUrl: 'https://card.latimorelifelegacy.com',

  advisor: 'Jackson M. Latimore Sr., Founder & CEO',
  affiliation: 'In Affiliation with Global Financial Impact',

  phone: '(856) 895-1457',
  phoneRaw: '8568951457',
  email: 'jackson1989@latimorelegacy.com',

  nipr: '21638507',
  paLicense: '1268820',

  // Primary CTAs
  // Route booking CTAs to the branded /book page (which embeds the live Fillout form)
  bookingUrl: '/book',
  filloutUrl: 'https://latimorelifelegacy.fillout.com/latimorelifelegacy',
  ethosUrl: 'https://agents.ethoslife.com/invite/29ad1',

  // Social
  instagram: 'https://www.instagram.com/jacksonlatimore.global',
  linkedin: 'https://www.linkedin.com/in/startwithjacksongfi',
  facebook: 'https://www.facebook.com/LatimoreLegacyLLC/',

  instagramUrl: 'https://www.instagram.com/jacksonlatimore.global',
  linkedinUrl: 'https://www.linkedin.com/in/startwithjacksongfi',
  facebookUrl: 'https://www.facebook.com/LatimoreLegacyLLC/',

  // Service region
  counties: ['Schuylkill', 'Luzerne', 'Northumberland'],

  // Used for absolute URLs in emails
  // Prefer the NEXT_PUBLIC_BASE_URL environment variable; otherwise default to
  // the public domain latimorelifelegacy.com so generated links point at
  // the correct live site rather than the old `latimorehub.vercel.app` preview.
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://latimorelifelegacy.com',
} as const
