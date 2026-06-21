const BOUNDARY_LABEL = '[INSTRUCTION BOUNDARY]'

export function sanitizeAiText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function buildInstructionBoundaryBlock(systemCtx: unknown, prompt: unknown): string {
  const cleanSystem = sanitizeAiText(systemCtx)
  const cleanPrompt = sanitizeAiText(prompt)

  if (!cleanSystem) return cleanPrompt

  return `${cleanSystem}\n\n${BOUNDARY_LABEL}\n\n${cleanPrompt}`
}

export function buildLabeledPromptBlock({
  systemCtx,
  prompt,
  schemaName,
  schema,
}: {
  systemCtx?: unknown
  prompt: unknown
  schemaName?: string
  schema?: unknown
}): string {
  const cleanSystem = sanitizeAiText(systemCtx)
  const cleanPrompt = sanitizeAiText(prompt)
  const parts: string[] = []

  if (cleanSystem) {
    parts.push('[SYSTEM CONTEXT]', cleanSystem, '[END SYSTEM CONTEXT]', BOUNDARY_LABEL)
  }

  if (schemaName && schema) {
    parts.push(
      `[JSON OUTPUT CONTRACT: ${schemaName}]`,
      'Return ONLY valid JSON. Do not include markdown fences, prose, or commentary.',
      JSON.stringify(schema),
      '[END JSON OUTPUT CONTRACT]',
      BOUNDARY_LABEL,
    )
  }

  parts.push('[USER PROMPT]', cleanPrompt, '[END USER PROMPT]')

  return parts.join('\n\n')
}
