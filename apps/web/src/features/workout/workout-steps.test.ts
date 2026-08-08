import { describe, expect, it } from 'vitest';
import { buildWorkoutSteps, toggleSupersetStepIndex } from './workout-steps';

describe('buildWorkoutSteps', () => {
  it('interleaves superset rounds as A1 then A2', () => {
    const steps = buildWorkoutSteps([
      {
        exerciseId: 'bench-press',
        supersetWith: 'barbell-row',
        sets: [
          { setNo: 1, reps: 6, weightKg: null, rpe: 7, tempo: null, isWarmup: true, isDropset: false },
          { setNo: 2, reps: 6, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
        ],
      },
      {
        exerciseId: 'barbell-row',
        supersetWith: 'bench-press',
        sets: [
          { setNo: 1, reps: 8, weightKg: null, rpe: 7, tempo: null, isWarmup: false, isDropset: false },
          { setNo: 2, reps: 8, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
        ],
      },
      {
        exerciseId: 'overhead-press',
        sets: [
          { setNo: 1, reps: 8, weightKg: null, rpe: 7, tempo: null, isWarmup: false, isDropset: false },
        ],
      },
    ]);

    expect(steps.map((s) => s.supersetLabel)).toEqual(['A1', 'A2', 'A1', 'A2', null]);
    expect(steps[0]?.exerciseIndex).toBe(0);
    expect(steps[1]?.exerciseIndex).toBe(1);
    expect(steps[3]?.isLastInSupersetRound).toBe(true);
  });

  it('toggles between A1 and A2 within a round', () => {
    const steps = buildWorkoutSteps([
      {
        exerciseId: 'a',
        supersetWith: 'b',
        sets: [{ setNo: 1, reps: 5, weightKg: null, rpe: 7, tempo: null, isWarmup: false, isDropset: false }],
      },
      {
        exerciseId: 'b',
        supersetWith: 'a',
        sets: [{ setNo: 1, reps: 5, weightKg: null, rpe: 7, tempo: null, isWarmup: false, isDropset: false }],
      },
    ]);
    expect(toggleSupersetStepIndex(steps, 0)).toBe(1);
    expect(toggleSupersetStepIndex(steps, 1)).toBe(0);
  });
});
