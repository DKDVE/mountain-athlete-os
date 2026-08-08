import { describe, expect, it } from 'vitest';
import { estimateDurationMinutes, exercisePreview } from '@/features/program/program-utils';

describe('program-utils', () => {
  it('estimates strength session duration from sets', () => {
    const mins = estimateDurationMinutes({
      exercises: [
        {
          exerciseId: 'back-squat',
          sets: [
            { setNo: 1, reps: 5, weightKg: null, rpe: 7, tempo: null, isWarmup: true, isDropset: false },
            { setNo: 2, reps: 5, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
          ],
        },
      ],
      mobility: ['hip-flexor-stretch'],
    });
    expect(mins).toBeGreaterThan(0);
  });

  it('previews exercise ids', () => {
    expect(
      exercisePreview({
        exercises: [{ exerciseId: 'back-squat', sets: [] }],
        mobility: [],
      }),
    ).toEqual(['back squat']);
  });
});
