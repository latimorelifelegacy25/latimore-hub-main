import { redirect } from 'next/navigation'

// The article composer now lives inside the unified Content Repository
// dashboard (the gold "Write article" button in its top bar) rather than as
// a separate page — see app/admin/marketing/repository/.
export default function ComposerPage() {
  redirect('/admin/marketing/repository')
}
