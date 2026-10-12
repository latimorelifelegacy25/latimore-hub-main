import { PRODUCT_CATALOG } from '@/lib/products/catalog'

export type NavMenuLink = { href: string; label: string }
export type NavMenuItem = NavMenuLink & { children?: readonly NavMenuLink[] }

/**
 * Primary site menu. Items with `children` open a dropdown on click; the first
 * child is always the section's overview page so the section stays reachable.
 */
export const NAV_MENU: readonly NavMenuItem[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  {
    href: '/products',
    label: 'Products',
    children: [
      { href: '/products', label: 'All Products' },
      ...PRODUCT_CATALOG.map((product) => ({ href: `/products#${product.slug}`, label: product.name })),
      { href: '/products/find-my-fit', label: 'Find My Fit' },
    ],
  },
  {
    href: '/services',
    label: 'Services',
    children: [
      { href: '/services', label: 'All Services' },
      { href: '/services/life-insurance', label: 'Life Insurance' },
      { href: '/services/mortgage-protection', label: 'Mortgage Protection' },
      { href: '/services/final-expense', label: 'Final Expense' },
      { href: '/services/retirement-income', label: 'Retirement Income' },
      { href: '/services/401k-rollover', label: '401(k) Rollover' },
      { href: '/services/iul-strategy', label: 'IUL Strategy' },
      { href: '/services/college-funding', label: 'College Funding' },
      { href: '/services/business-protection', label: 'Business Protection' },
      { href: '/services/business-continuity', label: 'Business Continuity' },
      { href: '/services/estate-planning', label: 'Estate Planning' },
      { href: '/services/debt-strategy', label: 'Debt Strategy' },
    ],
  },
  {
    href: '/solutions',
    label: 'Planning Tools',
    children: [
      { href: '/solutions', label: 'All Planning Tools' },
      { href: '/education/checkup', label: 'Legacy Checkup' },
      { href: '/products/find-my-fit', label: 'Find My Fit' },
      { href: '/solutions/family-protection', label: 'Family Protection' },
      { href: '/solutions/retirement-income', label: 'Retirement Income' },
      { href: '/solutions/legacy-planning', label: 'Legacy Planning' },
      { href: '/marketing/quote-calculator', label: 'Quote Calculator' },
    ],
  },
  {
    href: '/education',
    label: 'Education',
    children: [
      { href: '/education', label: 'Education Center' },
      { href: '/education/blog', label: 'Articles' },
      { href: '/blog', label: 'Blog' },
      { href: '/faq', label: 'FAQ' },
      { href: '/schuylkill', label: 'Schuylkill County' },
    ],
  },
  { href: '/join', label: 'Join Our Team' },
  { href: '/contact', label: 'Contact' },
]

function pathOf(href: string) {
  return href.split('#')[0].split('?')[0]
}

/** True when the current page is this item or one of its dropdown pages. */
export function isNavItemActive(item: NavMenuItem, currentPath: string) {
  if (!currentPath) return false
  if (pathOf(item.href) === currentPath) return true
  return item.children?.some((child) => pathOf(child.href) === currentPath) ?? false
}
