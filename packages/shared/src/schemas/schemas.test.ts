import { describe, expect, it } from 'vitest';
import { CoachAction } from '../schemas/coach-action.js';
import { Checkin } from '../schemas/checkin.js';
import { DashboardConfig } from '../schemas/dashboard.js';
import { Goal } from '../schemas/goal.js';
import { Meal } from '../schemas/meal.js';
import { Measurement } from '../schemas/measurement.js';
import { Run } from '../schemas/run.js';
import { Session } from '../schemas/session.js';
import { SetLog } from '../schemas/set-log.js';
import { buildProgramStructure, buildWeekSessions } from '../program/factory.js';

describe('schema round-trips', () => {
  it('SetLog round-trips', () => {
    const raw = {
      clientId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      exerciseId: 'back-squat',
      setNo: 1,
      weightKg: 100,
      reps: 5,
      rpe: 8,
      tempo: null,
      isWarmup: false,
      isDropset: false,
      pain: null,
      note: null,
    };
    expect(SetLog.parse(SetLog.parse(raw))).toEqual(SetLog.parse(raw));
  });

  it('Session round-trips', () => {
    const raw = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      programId: null,
      date: '2026-08-11',
      type: 'lower',
      title: 'Lower A',
      planned: { exercises: [], mobility: [] },
      status: 'upcoming',
      sessionRpe: null,
      energy: null,
      pump: null,
      note: null,
      startedAt: null,
      finishedAt: null,
      clientId: null,
    };
    expect(Session.parse(Session.parse(raw))).toEqual(Session.parse(raw));
  });

  it('Run round-trips', () => {
    const raw = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      date: '2026-08-11',
      type: 'z2',
      distanceM: 8000,
      durationS: 3600,
      avgHr: 140,
      maxHr: 155,
      cadence: 170,
      elevGainM: 50,
      splits: null,
      zones: null,
      weather: null,
      gpsRef: null,
      shoeId: null,
      rpe: 6,
      note: null,
      clientId: null,
    };
    expect(Run.parse(Run.parse(raw))).toEqual(Run.parse(raw));
  });

  it('Meal round-trips', () => {
    const raw = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      ts: '2026-08-11T08:00:00Z',
      foodId: 'chicken-breast',
      portions: 1,
      proteinG: 28,
      kcal: 165,
      clientId: null,
    };
    expect(Meal.parse(Meal.parse(raw))).toEqual(Meal.parse(raw));
  });

  it('Checkin round-trips', () => {
    const raw = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      date: '2026-08-11',
      sleepH: 7.5,
      quality: 8,
      energy: 7,
      stress: 3,
      rhr: 52,
      soreness: [{ region: 'quad', severity: 2 }],
    };
    expect(Checkin.parse(Checkin.parse(raw))).toEqual(Checkin.parse(raw));
  });

  it('Measurement round-trips', () => {
    const raw = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      date: '2026-08-11',
      site: 'waist',
      valueCm: 82,
    };
    expect(Measurement.parse(Measurement.parse(raw))).toEqual(Measurement.parse(raw));
  });

  it('Goal round-trips', () => {
    const raw = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      type: 'waist',
      target: { cm: 80 },
      deadline: '2026-12-01',
      status: 'active',
    };
    expect(Goal.parse(Goal.parse(raw))).toEqual(Goal.parse(raw));
  });

  it('DashboardConfig round-trips', () => {
    const raw = {
      version: 1,
      widgets: [
        {
          id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
          type: 'stat_card',
          dataSource: 'readiness',
          title: 'Readiness',
          options: {},
          grid: { x: 0, y: 0, w: 3, h: 2 },
        },
      ],
    };
    expect(DashboardConfig.parse(DashboardConfig.parse(raw))).toEqual(DashboardConfig.parse(raw));
  });

  it('CoachAction round-trips', () => {
    const raw = {
      kind: 'message_only',
      payload: { text: 'Deload this week' },
      humanSummary: 'Coach suggests deload',
    };
    expect(CoachAction.parse(CoachAction.parse(raw))).toEqual(CoachAction.parse(raw));
  });
});

describe('program factory', () => {
  it('builds 12-week structure with deloads at 4/8/12', () => {
    const structure = buildProgramStructure();
    expect(structure.macro.totalWeeks).toBe(12);
    expect(structure.mesocycles.map((m) => m.deloadWeek)).toEqual([4, 8, 12]);
  });

  it('generates week-1 sessions from start date', () => {
    const sessions = buildWeekSessions('2026-08-11', 1);
    expect(sessions.length).toBe(7);
    expect(sessions[0]?.date).toBe('2026-08-11');
    expect(sessions.some((s) => s.type === 'lower')).toBe(true);
    expect(sessions.some((s) => s.type === 'run')).toBe(true);
  });

  it('scales deload week volume', () => {
    const normal = buildWeekSessions('2026-08-11', 3)[0]?.planned.exercises[0]?.sets[0]?.reps;
    const deload = buildWeekSessions('2026-08-11', 4)[0]?.planned.exercises[0]?.sets[0]?.reps;
    expect(normal).toBeDefined();
    expect(deload).toBeDefined();
    expect(deload).toBeLessThan(normal ?? 0);
  });
});
