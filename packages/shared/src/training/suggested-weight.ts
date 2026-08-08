/** Double-progression + readiness downgrade for ghost weight suggestions. */

export interface SuggestWeightInput {
  lastWeightKg: number;
  lastReps: number;
  targetReps: number;
  lastRpe: number | null;
  readiness: number | null;
  userOverrideKg: number | null;
  incrementKg?: number;
}

export function suggestWeight(input: SuggestWeightInput): number {
  const increment = input.incrementKg ?? 2.5;
  const base = input.userOverrideKg ?? input.lastWeightKg;

  if (input.readiness != null && input.readiness < 50) {
    return Math.max(0, roundKg(base - increment));
  }

  const hitTarget = input.lastReps >= input.targetReps;
  const rpeOk = input.lastRpe == null || input.lastRpe <= 8;
  if (hitTarget && rpeOk) {
    return roundKg(base + increment);
  }

  return roundKg(base);
}

function roundKg(kg: number): number {
  return Math.round(kg * 2) / 2;
}
