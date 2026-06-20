import type { Metadata } from 'next'
import EstatePlanningPerk from './EstatePlanningPerk'

export const metadata: Metadata = {
  title: 'Estate Planning Perk | Latimore Life & Legacy LLC',
  description:
    'Get your life insurance strategy and receive a complete estate planning bundle — Will, Living Trust, and Power of Attorney — included at no extra cost.',
}

export default function EstatePlanningPerkPage() {
  return <EstatePlanningPerk />
}
