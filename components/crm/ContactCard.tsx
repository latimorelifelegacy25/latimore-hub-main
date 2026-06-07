type ContactCardProps = {
  contact: {
    id?: string
    name?: string | null
    fullName?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
    status?: string | null
  }
}

function displayName(contact: ContactCardProps['contact']) {
  return (
    contact.name ||
    contact.fullName ||
    [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
    contact.email ||
    contact.phone ||
    'Unknown Contact'
  )
}

export default function ContactCard({ contact }: ContactCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="font-semibold text-white">{displayName(contact)}</p>
      {contact.email ? <p className="text-sm text-[#A9B1BE]">{contact.email}</p> : null}
      {contact.phone ? <p className="text-sm text-[#A9B1BE]">{contact.phone}</p> : null}
      <p className="mt-1 text-xs text-[#A9B1BE]">Status: {contact.status ?? 'NEW'}</p>
    </div>
  )
}
