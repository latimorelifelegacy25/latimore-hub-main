export const dynamic = 'force-dynamic'

import MessagesPage from '@/app/admin/messages/page'

type CRMMessagePageProps = {
  searchParams?: Promise<{ contactId?: string }>
}

export const metadata = {
  title: 'CRM Messages | Latimore OS',
}

export default function CRMMessagesPage({ searchParams }: CRMMessagePageProps) {
  return <MessagesPage searchParams={searchParams} />
}
