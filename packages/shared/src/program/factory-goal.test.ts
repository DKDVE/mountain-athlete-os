import { describe, expect, it } from 'vitest';
import { AthleteProfile } from '../schemas/athlete-profile.js';
import type { AthleteProfile as AthleteProfileType } from '../schemas/athlete-profile.js';
import { excludedExerciseIds } from '../program/contraindications.js';
import {
  buildWeekSessions,
  evaluateProgramGeneration,
} from '../program/factory.js';

const BASE: AthleteProfileType = {
  goals: ['hybrid_performance'],
  experience: 'intermediate',
  constraints: {
    daysPerWeek: 4,
    sessionMinutes: 60,
    equipment: ['barbell', 'rack', 'bench', 'pull_up_bar', 'dumbbell', 'machine', 'cable', 'band', 'bodyweight', 'outdoor'],
  },
  screening: { flags: [] },
  preferences: { likedMovements: [], dislikedMovements: [] },
  metricsSnapshot: {},
};

describe('AthleteProfile schema', () => {
  it('parses a complete profile', () => {
    const parsed = AthleteProfile.parse(BASE);
    expect(parsed.goals[0]).toBe('hybrid_performance');
  });

  it('rejects empty goals', () => {
    expect(() => AthleteProfile.parse({ ...BASE, goals: [] })).toThrow();
  });
});

describe('goal-aware program factory', () => {
  it('generates strength scheme with lower reps', () => {
    const profile: AthleteProfileType = { ...BASE, goals: ['strength'] };
    const result = evaluateProgramGeneration(profile);
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    const sessions = buildWeekSessions('2026-08-11', 1, profile);
    const lowerA = sessions.find((s) => s.title === 'Lower A');
    expect(lowerA?.planned.exercises[0]?.sets[1]?.reps).toBe(4);
  });

  it('generates endurance scheme with higher reps', () => {
    const profile: AthleteProfileType = { ...BASE, goals: ['endurance'] };
    const result = evaluateProgramGeneration(profile);
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    const sessions = buildWeekSessions('2026-08-11', 1, profile);
    const lowerA = sessions.find((s) => s.title === 'Lower A');
    expect(lowerA?.planned.exercises[0]?.sets[0]?.reps).toBe(15);
  });

  it('blocks longevity goal with specialized state', () => {
    const result = evaluateProgramGeneration({ ...BASE, goals: ['longevity'] });
    expect(result.status).toBe('specialized');
  });

  it('blocks cardiac screening flag', () => {
    const result = evaluateProgramGeneration({
      ...BASE,
      screening: { flags: [{ flag: 'cardiac' }] },
    });
    expect(result.status).toBe('specialized');
  });

  it('excludes shoulder-contraindicated movements for shoulder injury', () => {
    const profile: AthleteProfileType = {
      ...BASE,
      screening: { flags: [{ flag: 'current_injury', region: 'shoulder' }] },
    };
    const excluded = excludedExerciseIds(profile);
    expect(excluded.has('overhead-press')).toBe(true);
    expect(excluded.has('bench-press')).toBe(true);
    expect(excluded.has('back-squat')).toBe(false);

    const sessions = buildWeekSessions('2026-08-11', 1, profile);
    const upper = sessions.find((s) => s.title === 'Upper');
    const ids = upper?.planned.exercises.map((e) => e.exerciseId) ?? [];
    expect(ids).not.toContain('overhead-press');
    expect(ids).not.toContain('bench-press');
    expect(ids.length).toBeGreaterThan(0);
  });

  it('substitutes safe lifts when dual injury would empty Lower A', () => {
    const profile: AthleteProfileType = {
      ...BASE,
      screening: {
        flags: [
          { flag: 'current_injury', region: 'lowBack' },
          { flag: 'current_injury', region: 'shoulder' },
        ],
      },
    };
    const sessions = buildWeekSessions('2026-08-10', 1, profile);
    const lowerA = sessions.find((s) => s.title === 'Lower A');
    expect(lowerA).toBeTruthy();
    const ids = lowerA?.planned.exercises.map((e) => e.exerciseId) ?? [];
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).not.toContain('back-squat');
    expect(ids).not.toContain('romanian-deadlift');
    expect(ids).not.toContain('bulgarian-split-squat');
    expect(ids).toEqual(expect.arrayContaining(['goblet-squat', 'hip-thrust']));
  });

  it('event_specific defaults to hybrid template', () => {
    const result = evaluateProgramGeneration({ ...BASE, goals: ['event_specific'] });
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.structure.macro.name).toContain('Hybrid');
  });
});
