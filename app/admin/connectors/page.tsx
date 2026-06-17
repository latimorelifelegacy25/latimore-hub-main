import { prisma } from '@/lib/prisma'
import NotionSyncPanel from './NotionSyncPanel'

export const dynamic = 'force-dynamic'

export default async function IntegrationsPage() {
  const totalContacts = await prisma.contact.count()
  const notionConfigured = Boolean(process.env.NOTION_API_KEY && process.env.NOTION_CONTACT_DB_ID)

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Integrations</h1>
        <p className="mt-2 text-sm text-[#A9B1BE]">
          Connect external services and manage API integrations.
        </p>
      </div>

      <NotionSyncPanel totalContacts={totalContacts} notionConfigured={notionConfigured} />
    </div>
  )
}
