import type { Metadata } from 'next'
import ServicesFunnel from './ServicesFunnel'

export const metadata: Metadata = {
  title: '10 Strategies to Build, Protect & Transfer Wealth | Latimore Life & Legacy',
  description:
    'Explore 10 customized wealth strategies with Jackson M. Latimore Sr. — independent insurance advisor serving Schuylkill, Luzerne, and Northumberland Counties, PA.',
}

export default function ServicesFunnelPage() {
  return <ServicesFunnel />
}
