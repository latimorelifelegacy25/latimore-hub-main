import { ContentStatus, ContentType, type ContentAsset, type Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { checkCompliance } from '@/lib/ai/compliance'
import { completeAiRun, createAiRun, createSystemAiEvent, failAiRun } from '@/lib/ai/shared'
import { runEditor, runRepurposer, runStrategist, runWriter } from './agents'
import type {
  PipelineState,
  RepurposedVariant,
  StoredReview,
  VariantChannel,
} from './types'

// How many Writer -> Editor round trips one "draft" run may take before control returns to Jackson.
const MAX_AUTO_REVISIONS = 2

const EMAIL_DISCLOSURE =
  'Jackson M. Latimore Sr. | Latimore Life & Legacy LLC | PA DOI #1268820. This message is educational and is not individualized insurance, tax, or legal advice.'

// Proposed (never applied) posting offsets from the day the variants are staged, at 14:00 UTC.
const PROPOSED_DAY_OFFSET: Record<VariantChannel, number> = { email: 2, linkedin: 1, facebook: 2, instagram: 3 }
const PROPOSED_HOUR_UTC = 14

export class PipelineError extends Error {
  constructor(
    message: string,
    readonly status: number = 409,
  ) {
    super(message)
  }
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function isPipelineState(value: unknown): value is PipelineState {
  return !!value && typeof value === 'object' && typeof (value as PipelineState).stage === 'string'
}

export async function loadPipeline(id: string): Promise<{ asset: ContentAsset; state: PipelineState }> {
  const asset = await prisma.contentAsset.findUnique({ where: { id } })
  const meta = (asset?.metadata ?? null) as { pipeline?: unknown } | null
  if (!asset || !isPipelineState(meta?.pipeline)) throw new PipelineError('Pipeline not found', 404)
  return { asset, state: meta.pipeline }
}

async function savePipeline(
  id: string,
  state: PipelineState,
  extra: Prisma.ContentAssetUpdateInput = {},
): Promise<ContentAsset> {
  return prisma.contentAsset.update({
    where: { id },
    data: { ...extra, metadata: { pipeline: state } as unknown as Prisma.InputJsonValue },
  })
}

export async function listPipelines(take = 25) {
  const assets = await prisma.contentAsset.findMany({
    where: { channel: 'pipeline' },
    orderBy: { createdAt: 'desc' },
    take,
  })
  return assets.flatMap((asset) => {
    const meta = asset.metadata as { pipeline?: unknown } | null
    return isPipelineState(meta?.pipeline) ? [{ asset, state: meta.pipeline }] : []
  })
}

export async function getVariants(pipelineId: string) {
  return prisma.contentAsset.findMany({
    where: { metadata: { path: ['pipelineId'], equals: pipelineId } },
    orderBy: { createdAt: 'asc' },
  })
}

// Every agent call is logged to AiRun so the full chain is auditable.
async function tracked<T extends object>(
  agent: string,
  pipelineId: string,
  fn: () => Promise<{ model: string; output: T; usage?: { input_tokens?: number; output_tokens?: number } }>,
) {
  const run = await createAiRun({ type: 'content_generation', input: { pipeline: true, agent, pipelineId } })
  const started = Date.now()
  try {
    const result = await fn()
    await completeAiRun({
      aiRunId: run.id,
      output: result.output as unknown as Record<string, unknown>,
      model: result.model,
      tokensInput: result.usage?.input_tokens,
      tokensOutput: result.usage?.output_tokens,
      latencyMs: Date.now() - started,
    })
    return result
  } catch (error) {
    await failAiRun({ aiRunId: run.id, error }) // marks the run failed; its HTTP response is unused here
    throw error
  }
}

// ─── Step 1-2: intake + brief ─────────────────────────────────────────────────

async function buildBrief(id: string, state: PipelineState): Promise<PipelineState> {
  const { output: brief } = await tracked('strategist', id, () =>
    runStrategist({ topic: state.topic, sourceMaterial: state.sourceMaterial, channelGoals: state.channelGoals }),
  )
  // Trust the explicit flag, but also treat a brief with no usable facts as too thin.
  const thin = brief.needsMoreInput || brief.mustIncludeFacts.length === 0
  return {
    ...state,
    brief,
    stage: thin ? 'needs_input' : 'briefed',
    reviews: [],
    variantIds: state.variantIds,
  }
}

export async function createPipeline(input: {
  topic: string
  sourceMaterial: string
  channelGoals: string
  campaign?: string
  createdBy?: string | null
}) {
  const state: PipelineState = {
    stage: 'needs_input',
    topic: input.topic,
    sourceMaterial: input.sourceMaterial,
    channelGoals: input.channelGoals,
    brief: null,
    draftRevision: 0,
    writerFlags: [],
    reviews: [],
    variantIds: [],
  }
  const asset = await prisma.contentAsset.create({
    data: {
      title: input.topic.slice(0, 200),
      type: ContentType.blog,
      status: ContentStatus.draft,
      channel: 'pipeline',
      campaign: input.campaign,
      prompt: input.topic,
      createdBy: input.createdBy ?? undefined,
      metadata: { pipeline: state } as unknown as Prisma.InputJsonValue,
    },
  })
  const next = await buildBrief(asset.id, state)
  await savePipeline(asset.id, next)
  return loadPipeline(asset.id)
}

// Jackson supplies more material after the Strategist asked for it (or to redirect the brief).
export async function rebrief(id: string, extraMaterial: string) {
  const { state } = await loadPipeline(id)
  const next = await buildBrief(id, {
    ...state,
    sourceMaterial: `${state.sourceMaterial}\n\n${extraMaterial}`.trim(),
    draftRevision: 0,
    writerFlags: [],
  })
  await savePipeline(id, next, { bodyText: null })
  return loadPipeline(id)
}

// ─── Steps 3-4: draft + review ────────────────────────────────────────────────

async function reviewDraft(id: string, state: PipelineState, draft: string): Promise<PipelineState> {
  if (!state.brief) throw new PipelineError('No brief yet')
  const { output: review } = await tracked('editor', id, () =>
    runEditor({ brief: state.brief!, draft, writerFlags: state.writerFlags }),
  )
  const compliance = checkCompliance(draft)
  const blocking = review.issues.some((i) => i.severity === 'blocker' || i.severity === 'major')
  // The Editor model alone never approves: deterministic compliance and fact tracing must also pass.
  const approved =
    review.status === 'APPROVED' && !blocking && review.unsupportedClaims.length === 0 && compliance.passed
  const stored: StoredReview = {
    ...review,
    at: new Date().toISOString(),
    draftRevision: state.draftRevision,
    effectiveStatus: approved ? 'APPROVED' : 'CHANGES_REQUESTED',
    compliance,
  }
  return { ...state, reviews: [...state.reviews, stored], stage: approved ? 'editor_approved' : 'changes_requested' }
}

// Writer drafts (or revises against the Editor's flags), Editor reviews, repeat up to MAX_AUTO_REVISIONS.
export async function runDraftLoop(id: string, voiceNotes?: string) {
  const loaded = await loadPipeline(id)
  let state = loaded.state
  if (!state.brief || state.stage === 'needs_input') throw new PipelineError('The brief needs more input first')

  let draft = loaded.asset.bodyText ?? ''
  // A draft that exists but was never reviewed at its current revision (e.g. a hand edit) gets reviewed, not rewritten.
  if (draft && state.reviews.at(-1)?.draftRevision !== state.draftRevision) {
    state = await reviewDraft(id, state, draft)
    await savePipeline(id, state)
  }
  for (let attempt = 0; attempt <= MAX_AUTO_REVISIONS; attempt++) {
    if (state.stage === 'editor_approved') break
    const lastReview = state.reviews.at(-1)
    const revising = draft.length > 0 && lastReview?.effectiveStatus === 'CHANGES_REQUESTED'

    const issues = revising ? [...lastReview!.issues, ...unsupportedAsIssues(lastReview!), ...complianceAsIssues(lastReview!)] : undefined
    const { output } = await tracked('writer', id, () =>
      runWriter({ brief: state.brief!, voiceNotes, previousDraft: revising ? draft : undefined, editorIssues: issues }),
    )
    draft = output.draft
    state = { ...state, draftRevision: state.draftRevision + 1, writerFlags: output.flags }
    state = await reviewDraft(id, state, draft)
    await savePipeline(id, state, { bodyText: draft })
  }
  return loadPipeline(id)
}

function unsupportedAsIssues(review: StoredReview) {
  return review.unsupportedClaims.map((claim) => ({
    severity: 'major' as const,
    location: claim.slice(0, 80),
    problem: 'Claim is not supported by the brief',
    suggestedFix: 'Remove it or restate using only brief facts',
  }))
}

function complianceAsIssues(review: StoredReview) {
  return review.compliance.violations.map((v) => ({
    severity: 'blocker' as const,
    location: v.excerpt,
    problem: `${v.rule}: ${v.description}`,
    suggestedFix: 'Rephrase with "may", "can", or "could" and remove the prohibited claim',
  }))
}

// Re-run the Editor on the current text, e.g. after Jackson edits the draft by hand.
export async function reviewCurrent(id: string) {
  const { asset, state } = await loadPipeline(id)
  if (!asset.bodyText) throw new PipelineError('No draft to review')
  const next = await reviewDraft(id, state, asset.bodyText)
  await savePipeline(id, next)
  return loadPipeline(id)
}

export async function replaceDraft(id: string, text: string) {
  const { state } = await loadPipeline(id)
  if (!state.brief) throw new PipelineError('No brief yet')
  // A hand edit invalidates any earlier approval until the Editor re-checks it.
  await savePipeline(
    id,
    { ...state, stage: 'briefed', draftRevision: state.draftRevision + 1, writerFlags: [] },
    { bodyText: text },
  )
  return loadPipeline(id)
}

// ─── Step 5: repurpose into drafts ────────────────────────────────────────────

export async function repurpose(id: string) {
  const { asset, state } = await loadPipeline(id)
  const latest = state.reviews.at(-1)
  const draft = asset.bodyText
  if (
    !draft ||
    !state.brief ||
    state.stage !== 'editor_approved' ||
    latest?.effectiveStatus !== 'APPROVED' ||
    latest.draftRevision !== state.draftRevision
  ) {
    throw new PipelineError('Only a draft the Editor approved at its current revision can be repurposed')
  }
  // Defense in depth: the text itself must still pass compliance.
  if (!checkCompliance(draft).passed) throw new PipelineError('Draft no longer passes compliance')

  const { model, output } = await tracked('repurposer', id, () => runRepurposer({ approvedDraft: draft, brief: state.brief! }))

  const day = new Date()
  day.setUTCHours(PROPOSED_HOUR_UTC, 0, 0, 0)
  const created = await Promise.all(
    output.variants.map((variant) => createVariant(id, asset, variant, model, day)),
  )

  await savePipeline(id, { ...state, stage: 'repurposed', variantIds: created.map((c) => c.id) })
  await createSystemAiEvent({ type: 'content.pipeline.staged', payload: { pipelineId: id, variantIds: created.map((c) => c.id) } })
  return loadPipeline(id)
}

function createVariant(
  pipelineId: string,
  parent: ContentAsset,
  variant: RepurposedVariant,
  model: string,
  base: Date,
) {
  const isEmail = variant.channel === 'email'
  const tags = variant.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`))
  const body = isEmail ? `${variant.body.trim()}\n\n${EMAIL_DISCLOSURE}` : variant.body.trim()
  const proposed = new Date(base)
  proposed.setUTCDate(proposed.getUTCDate() + PROPOSED_DAY_OFFSET[variant.channel])
  return prisma.contentAsset.create({
    data: {
      title: `${parent.title} — ${variant.channel}`,
      type: isEmail ? ContentType.email : ContentType.social_post,
      status: ContentStatus.draft, // always a draft; nothing is scheduled or published here
      channel: variant.channel,
      campaign: parent.campaign,
      bodyText: body,
      metadata: {
        pipelineId,
        subject: isEmail ? variant.subject : undefined,
        preheader: isEmail ? variant.preheader : undefined,
        hashtags: tags,
        proposedSendAt: proposed.toISOString(),
        compliance: checkCompliance([variant.subject, body, tags.join(' ')].filter(Boolean).join('\n')),
        model,
      } as unknown as Prisma.InputJsonValue,
    },
  })
}

// ─── Step 6: Jackson's per-channel go / no-go ─────────────────────────────────

export async function decideVariant(pipelineId: string, variantId: string, decision: 'approve' | 'reject', by: string | null) {
  const variant = await prisma.contentAsset.findUnique({ where: { id: variantId } })
  const meta = (variant?.metadata ?? null) as { pipelineId?: string; compliance?: { passed?: boolean } } | null
  if (!variant || meta?.pipelineId !== pipelineId) throw new PipelineError('Variant not found', 404)
  if (variant.status !== ContentStatus.draft) throw new PipelineError(`Variant is already ${variant.status}`)

  if (decision === 'approve') {
    const fresh = checkCompliance([variant.bodyText, (variant.metadata as { subject?: string }).subject].filter(Boolean).join('\n'))
    if (!fresh.passed) throw new PipelineError('Variant fails compliance; edit or reject it', 422)
  }
  // Approval only marks the asset approved. Scheduling and publishing stay separate, manual steps.
  return prisma.contentAsset.update({
    where: { id: variantId },
    data: {
      status: decision === 'approve' ? ContentStatus.approved : ContentStatus.archived,
      metadata: {
        ...(variant.metadata as object),
        decision: { value: decision, by, at: new Date().toISOString() },
      } as unknown as Prisma.InputJsonValue,
    },
  })
}
