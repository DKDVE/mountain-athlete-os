import { describe, expect, it } from 'vitest';
import { suggestWeight } from './suggested-weight.js';

describe('suggestWeight', () => {
  it('progresses when target reps hit at acceptable RPE', () => {
    expect(
      suggestWeight({
        lastWeightKg: 100,
        lastReps: 8,
        targetReps: 8,
        lastRpe: 7,
        readiness: 80,
        userOverrideKg: null,
      }),
    ).toBe(102.5);
  });

  it('holds when reps below target', () => {
    expect(
      suggestWeight({
        lastWeightKg: 100,
        lastReps: 6,
        targetReps: 8,
        lastRpe: 8,
        readiness: 80,
        userOverrideKg: null,
      }),
    ).toBe(100);
  });

  it('downgrades on low readiness', () => {
    expect(
      suggestWeight({
        lastWeightKg: 100,
        lastReps: 8,
        targetReps: 8,
        lastRpe: 7,
        readiness: 40,
        userOverrideKg: null,
      }),
    ).toBe(97.5);
  });

  it('uses user override as base for next suggestion', () => {
    expect(
      suggestWeight({
        lastWeightKg: 100,
        lastReps: 8,
        targetReps: 8,
        lastRpe: 7,
        readiness: 80,
        userOverrideKg: 95,
      }),
    ).toBe(97.5);
  });
});
