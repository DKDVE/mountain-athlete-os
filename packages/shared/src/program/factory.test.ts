import { describe, expect, it } from 'vitest';
import {
  buildProgramStructure,
  buildWeekSessions,
  DELOAD_WEEKS,
  isDeloadWeek,
  mesocycleForWeek,
  programContextForDate,
  weekNumberForDate,
  TOTAL_WEEKS,
} from './factory.js';

const START = '2026-08-11'; // Monday

describe('program factory', () => {
  it('builds 12-week macro with deload weeks 4/8/12', () => {
    const structure = buildProgramStructure();

    expect(structure.macro.totalWeeks).toBe(TOTAL_WEEKS);
    expect(structure.mesocycles).toHaveLength(3);
    expect(structure.mesocycles.map((m) => m.deloadWeek)).toEqual([4, 8, 12]);

    for (let week = 1; week <= TOTAL_WEEKS; week++) {
      const meso = mesocycleForWeek(week, structure);
      expect(week).toBeGreaterThanOrEqual(meso.startWeek);
      expect(week).toBeLessThanOrEqual(meso.endWeek);
    }

    expect(DELOAD_WEEKS).toEqual([4, 8, 12]);
    expect([4, 8, 12].every((w) => isDeloadWeek(w))).toBe(true);
    expect([1, 2, 3, 5, 6, 7, 9, 10, 11].every((w) => !isDeloadWeek(w))).toBe(true);
  });

  it('week 1 matches Mon/Wed/Fri strength + 2 runs + Sat long run skeleton', () => {
    const sessions = buildWeekSessions(START, 1);

    expect(sessions).toHaveLength(7);
    expect(sessions.map((s) => s.date)).toEqual([
      '2026-08-11', // Mon
      '2026-08-12', // Tue
      '2026-08-13', // Wed
      '2026-08-14', // Thu
      '2026-08-15', // Fri
      '2026-08-16', // Sat
      '2026-08-17', // Sun
    ]);

    expect(sessions.map((s) => `${s.date} ${s.type} ${s.title}`)).toEqual([
      '2026-08-11 lower Lower A',
      '2026-08-12 run Z2 Run',
      '2026-08-13 upper Upper',
      '2026-08-14 mobility Mobility',
      '2026-08-15 lower Lower B',
      '2026-08-16 run Long Run',
      '2026-08-17 rest Rest',
    ]);

    const strength = sessions.filter((s) => s.type === 'lower' || s.type === 'upper');
    expect(strength.map((s) => s.date)).toEqual(['2026-08-11', '2026-08-13', '2026-08-15']);

    const runs = sessions.filter((s) => s.type === 'run');
    expect(runs).toHaveLength(2);
    expect(runs[0]?.planned.run?.type).toBe('z2');
    expect(runs[1]?.planned.run?.type).toBe('long');
    expect(runs[1]?.date).toBe('2026-08-16');

    expect(sessions.every((s) => !s.isDeload)).toBe(true);
    expect(sessions[0]?.mesoName).toBe('Rebuild');
  });

  it('flags deload weeks in session titles and scaling', () => {
    const deloadSessions = buildWeekSessions(START, 4);
    expect(deloadSessions.every((s) => s.isDeload)).toBe(true);
    expect(deloadSessions.map((s) => s.title)).toEqual([
      'Lower A (Deload)',
      'Z2 Run (Deload)',
      'Upper (Deload)',
      'Mobility (Deload)',
      'Lower B (Deload)',
      'Long Run (Deload)',
      'Rest (Deload)',
    ]);

    const normal = buildWeekSessions(START, 1)[0]?.planned.exercises[0]?.sets[1]?.reps;
    const deload = deloadSessions[0]?.planned.exercises[0]?.sets[1]?.reps;
    expect(deload).toBeLessThan(normal ?? 0);
  });

  it('derives week number and deload context from calendar date', () => {
    const structure = buildProgramStructure();
    expect(weekNumberForDate(START, START)).toBe(1);
    const ctx = programContextForDate(structure, START, '2026-09-01');
    expect(ctx.weekNumber).toBe(4);
    expect(ctx.isDeload).toBe(true);
    expect(ctx.mesoName).toBe('Rebuild');
  });
});
