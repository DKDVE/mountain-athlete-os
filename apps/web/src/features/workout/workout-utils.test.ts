import { describe, expect, it } from 'vitest';
import type { LoggedSetRow } from '@/lib/db';
import { tonnageKg, formatDuration } from '@/features/workout/workout-utils';

describe('workout-utils', () => {
  it('sums working-set tonnage excluding warmups', () => {
    const sets: LoggedSetRow[] = [
      {
        clientId: '1',
        exerciseId: 'squat',
        setNo: 1,
        weightKg: 100,
        reps: 5,
        rpe: 7,
        isWarmup: true,
        isDropset: false,
        pain: null,
        note: null,
      },
      {
        clientId: '2',
        exerciseId: 'squat',
        setNo: 2,
        weightKg: 100,
        reps: 8,
        rpe: 8,
        isWarmup: false,
        isDropset: false,
        pain: null,
        note: null,
      },
    ];
    expect(tonnageKg(sets)).toBe(800);
  });

  it('formats duration mm:ss', () => {
    expect(formatDuration(125)).toBe('02:05');
  });
});
