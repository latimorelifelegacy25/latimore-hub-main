import type { ComplianceResult } from '@/lib/ai/compliance'

export type PipelineStage =
  | 'needs_input' // Strategist could not write a confident brief
  | 'briefed' // brief ready, waiting for the draft run
  | 'changes_requested' // Editor flagged issues the revision loop could not clear
  | 'editor_approved' // Editor + deterministic compliance both passed
  | 'repurposed' // variants staged as drafts for Jackson

export type ContentBrief = {
  needsMoreInput: boolean
  missingInputs: string[]
  angle: string
  audience: string
  keyMessage: string
  mustIncludeFacts: { fact: string; source: string }[]
  callToAction: string
  channelNotes: { blog: string; social: string; email: string }
  targetLength: string
}

export type EditorIssue = {
  severity: 'blocker' | 'major' | 'minor'
  location: string
  problem: string
  suggestedFix: string
}

export type EditorReview = {
  status: 'APPROVED' | 'CHANGES_REQUESTED'
  issues: EditorIssue[]
  unsupportedClaims: string[]
}

export type StoredReview = EditorReview & {
  at: string
  draftRevision: number
  // Server-side verdict after the deterministic compliance gate; the LLM's status alone never decides.
  effectiveStatus: 'APPROVED' | 'CHANGES_REQUESTED'
  compliance: ComplianceResult
}

export type PipelineState = {
  stage: PipelineStage
  topic: string
  sourceMaterial: string
  channelGoals: string
  brief: ContentBrief | null
  draftRevision: number
  writerFlags: string[]
  reviews: StoredReview[]
  variantIds: string[]
}

export type VariantChannel = 'linkedin' | 'facebook' | 'instagram' | 'email'

export type RepurposedVariant = {
  channel: VariantChannel
  body: string
  hashtags: string[]
  subject?: string
  preheader?: string
}
