import type { PlannedSession } from '@maos/shared';

export type PlannedExercise = PlannedSession['exercises'][number];

export interface WorkoutStep {
  exerciseIndex: number;
  setIndex: number;
  supersetLabel: 'A1' | 'A2' | null;
  /** Rest timer starts after this step when the set is not a warm-up. */
  isLastInSupersetRound: boolean;
}

/** Flatten planned exercises into log steps; supersets interleave A1/A2 per round. */
export function buildWorkoutSteps(exercises: PlannedExercise[]): WorkoutStep[] {
  const steps: WorkoutStep[] = [];
  const used = new Set<number>();
  const groups: number[][] = [];

  for (let i = 0; i < exercises.length; i++) {
    if (used.has(i)) continue;
    const ex = exercises[i];
    if (!ex) continue;
    const partnerIdx = ex.supersetWith
      ? exercises.findIndex((other, j) => j !== i && other.exerciseId === ex.supersetWith)
      : -1;
    if (
      partnerIdx >= 0 &&
      exercises[partnerIdx]?.supersetWith === ex.exerciseId &&
      !used.has(partnerIdx)
    ) {
      groups.push([i, partnerIdx]);
      used.add(i);
      used.add(partnerIdx);
    } else {
      groups.push([i]);
      used.add(i);
    }
  }

  for (const group of groups) {
    if (group.length === 1) {
      const idx = group[0];
      if (idx === undefined) continue;
      const sets = exercises[idx]?.sets ?? [];
      sets.forEach((_, setIdx) => {
        steps.push({
          exerciseIndex: idx,
          setIndex: setIdx,
          supersetLabel: null,
          isLastInSupersetRound: true,
        });
      });
      continue;
    }

    const maxSets = Math.max(...group.map((idx) => exercises[idx]?.sets.length ?? 0));
    for (let round = 0; round < maxSets; round += 1) {
      group.forEach((exIdx, slot) => {
        const sets = exercises[exIdx]?.sets ?? [];
        if (round >= sets.length) return;
        steps.push({
          exerciseIndex: exIdx,
          setIndex: round,
          supersetLabel: slot === 0 ? 'A1' : 'A2',
          isLastInSupersetRound: slot === group.length - 1,
        });
      });
    }
  }

  return steps;
}

/** Toggle A1 ↔ A2 within the same superset round. */
export function toggleSupersetStepIndex(steps: WorkoutStep[], stepIndex: number): number {
  const cur = steps[stepIndex];
  if (!cur?.supersetLabel) return stepIndex;
  const delta = cur.supersetLabel === 'A1' ? 1 : -1;
  const next = stepIndex + delta;
  if (next < 0 || next >= steps.length) return stepIndex;
  const sibling = steps[next];
  if (sibling && sibling.setIndex === cur.setIndex && sibling.supersetLabel) return next;
  return stepIndex;
}
