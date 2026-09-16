export type LatimoreToolAudience = 'public' | 'advisor' | 'operations'
export type LatimoreToolArea = 'client' | 'advisor' | 'crm' | 'marketing' | 'content' | 'analytics' | 'automation' | 'documents' | 'integrations'

export type LatimoreToolDefinition = {
  id: string
  name: string
  description: string
  href: string
  audience: LatimoreToolAudience
  area: LatimoreToolArea
  trackingTool: string
  status: 'active' | 'internal' | 'preview'
  requiresAuth: boolean
}

export const LATIMORE_TOOL_REGISTRY: readonly LatimoreToolDefinition[] = [
  {
    id: 'family-protection-snapshot',
    name: 'Family Protection Snapshot',
    description: 'Educational protection-gap assessment for public visitors.',
    href: '/solutions/family-protection',
    audience: 'public',
    area: 'client',
    trackingTool: 'family_protection_snapshot',
    status: 'active',
    requiresAuth: false,
  },
  {
    id: 'retirement-income-snapshot',
    name: 'Retirement Income Snapshot',
    description: 'Educational retirement-income gap assessment.',
    href: '/solutions/retirement-income',
    audience: 'public',
    area: 'client',
    trackingTool: 'retirement_income_snapshot',
    status: 'active',
    requiresAuth: false,
  },
  {
    id: 'legacy-cost-snapshot',
    name: 'Legacy Cost Snapshot',
    description: 'Educational estimate of immediate legacy and final-arrangement obligations.',
    href: '/solutions/legacy-planning',
    audience: 'public',
    area: 'client',
    trackingTool: 'legacy_cost_snapshot',
    status: 'active',
    requiresAuth: false,
  },
  {
    id: 'personal-financial-review',
    name: 'Personal Financial Review',
    description: 'Persistent client discovery and planning workspace.',
    href: '/admin/advisor/pfr',
    audience: 'advisor',
    area: 'advisor',
    trackingTool: 'personal_financial_review',
    status: 'active',
    requiresAuth: true,
  },
  {
    id: 'appointment-guide',
    name: 'Appointment Guide',
    description: 'Latimore-branded appointment and discovery guide.',
    href: '/admin/advisor/appointment-guide',
    audience: 'advisor',
    area: 'advisor',
    trackingTool: 'appointment_guide',
    status: 'active',
    requiresAuth: true,
  },
  {
    id: 'knowledge-center',
    name: 'Knowledge Center',
    description: 'Carrier-neutral advisor training and knowledge checks.',
    href: '/admin/advisor/knowledge-center',
    audience: 'advisor',
    area: 'advisor',
    trackingTool: 'knowledge_center',
    status: 'active',
    requiresAuth: true,
  },
  {
    id: 'conversation-coach',
    name: 'Conversation Coach',
    description: 'Education-first coaching for client questions and objections.',
    href: '/admin/advisor/conversation-coach',
    audience: 'advisor',
    area: 'advisor',
    trackingTool: 'conversation_coach',
    status: 'active',
    requiresAuth: true,
  },
  {
    id: 'crm',
    name: 'Life Hub CRM',
    description: 'Lead, contact, appointment, opportunity, and follow-up operations.',
    href: '/admin/crm/hub',
    audience: 'operations',
    area: 'crm',
    trackingTool: 'crm',
    status: 'active',
    requiresAuth: true,
  },
  {
    id: 'tracking-command-center',
    name: 'Tracking Command Center',
    description: 'First-party acquisition, funnel, tool-performance, and conversion analytics.',
    href: '/analytics',
    audience: 'operations',
    area: 'analytics',
    trackingTool: 'tracking_command_center',
    status: 'active',
    requiresAuth: true,
  },
  {
    id: 'workflow-operations',
    name: 'Workflow Operations',
    description: 'Agent-harness runs, compliance outcomes, duration, token usage, cost, and audit history.',
    href: '/admin/workflow-runs',
    audience: 'operations',
    area: 'automation',
    trackingTool: 'workflow_operations',
    status: 'active',
    requiresAuth: true,
  },
  {
    id: 'workflow-builder',
    name: 'Workflow Builder',
    description: 'Design and inspect multi-step automation sequences.',
    href: '/admin/workflow',
    audience: 'operations',
    area: 'automation',
    trackingTool: 'workflow_builder',
    status: 'internal',
    requiresAuth: true,
  },
  {
    id: 'content-repository',
    name: 'Content Repository',
    description: 'UTM-tagged content, links, campaigns, publishing, and deployment controls.',
    href: '/admin/content/repository',
    audience: 'operations',
    area: 'content',
    trackingTool: 'content_repository',
    status: 'active',
    requiresAuth: true,
  },
  {
    id: 'composer',
    name: 'Composer',
    description: 'Latimore content and artifact composition workspace.',
    href: '/admin/composer',
    audience: 'operations',
    area: 'content',
    trackingTool: 'composer',
    status: 'active',
    requiresAuth: true,
  },
  {
    id: 'document-builder',
    name: 'Document Builder',
    description: 'Create and manage Latimore business documents.',
    href: '/admin/documents',
    audience: 'operations',
    area: 'documents',
    trackingTool: 'document_builder',
    status: 'active',
    requiresAuth: true,
  },
  {
    id: 'marketing-tools',
    name: 'Marketing Tools',
    description: 'Campaign planning, content operations, and performance workflows.',
    href: '/admin/marketing',
    audience: 'operations',
    area: 'marketing',
    trackingTool: 'marketing_tools',
    status: 'active',
    requiresAuth: true,
  },
  {
    id: 'integrations',
    name: 'Integrations',
    description: 'Connected-system and connector operations.',
    href: '/admin/connectors',
    audience: 'operations',
    area: 'integrations',
    trackingTool: 'integrations',
    status: 'active',
    requiresAuth: true,
  },
] as const

export function getLatimoreTool(id: string): LatimoreToolDefinition | undefined {
  return LATIMORE_TOOL_REGISTRY.find(tool => tool.id === id)
}

export function getLatimoreToolsByArea(area: LatimoreToolArea): LatimoreToolDefinition[] {
  return LATIMORE_TOOL_REGISTRY.filter(tool => tool.area === area)
}

export function getLatimoreToolsByAudience(audience: LatimoreToolAudience): LatimoreToolDefinition[] {
  return LATIMORE_TOOL_REGISTRY.filter(tool => tool.audience === audience)
}
