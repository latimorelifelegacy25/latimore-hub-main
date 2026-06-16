import type { PipelineStage } from './normalizers'

// Forward/lateral moves a lead is allowed to make from each stage. Anything
// not listed here (e.g. New -> Sold) is rejected by `canTransition` so a
// lead can't skip qualification/booking on its way to a closed-won state.
const ALLOWED_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  New: ['Attempted_Contact', 'Qualified', 'Follow_Up', 'Lost'],
  Attempted_Contact: ['Qualified', 'Follow_Up', 'Lost'],
  Qualified: ['Booked', 'Follow_Up', 'Lost'],
  Booked: ['Sold', 'Follow_Up', 'Lost'],
  Follow_Up: ['Attempted_Contact', 'Qualified', 'Booked', 'Lost'],
  Sold: ['Follow_Up', 'Lost'],
  Lost: ['Follow_Up', 'New'],
}

export function canTransition(from: PipelineStage, to: PipelineStage): boolean {
  if (from === to) return true
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

export class InvalidStageTransitionError extends Error {
  constructor(public readonly from: PipelineStage, public readonly to: PipelineStage) {
    super(`Invalid stage transition: ${from} -> ${to}`)
    this.name = 'InvalidStageTransitionError'
  }
}

export function assertTransition(from: PipelineStage, to: PipelineStage): void {
  if (!canTransition(from, to)) {
    throw new InvalidStageTransitionError(from, to)
  }
}
