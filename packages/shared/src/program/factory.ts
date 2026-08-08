import type { SessionType, PlannedSession } from '../schemas/common.js';
import { PlannedSessionSchema } from '../schemas/common.js';

export const DELOAD_WEEKS = [4, 8, 12] as const;
export const TOTAL_WEEKS = 12;
export const DELOAD_VOLUME_MULTIPLIER = 0.6;
export const DELOAD_RPE_CAP = 7;

export interface Mesocycle {
  id: string;
  name: string;
  startWeek: number;
  endWeek: number;
  deloadWeek: number;
  focus: string;
}

export interface WeeklySlot {
  dayOffset: number;
  type: SessionType;
  title: string;
  templateKey: string;
}

export interface ProgramStructure {
  version: 1;
  macro: { name: string; totalWeeks: number };
  mesocycles: Mesocycle[];
  weeklyTemplate: WeeklySlot[];
  sessionTemplates: Record<string, PlannedSession>;
  deloadRules: { volumeMultiplier: number; intensityCapRpe: number };
}

export interface WeekSessionSeed {
  date: string;
  type: SessionType;
  title: string;
  planned: PlannedSession;
  weekNumber: number;
  isDeload: boolean;
}

function scalePlanned(planned: PlannedSession, multiplier: number, rpeCap: number): PlannedSession {
  const parsed = PlannedSessionSchema.parse(planned);
  return {
    ...parsed,
    exercises: parsed.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((set) => ({
        ...set,
        reps: set.reps !== null ? Math.max(1, Math.round(set.reps * multiplier)) : null,
        rpe:
          set.rpe !== null ? Math.min(rpeCap, Math.max(1, set.rpe - (multiplier < 1 ? 1 : 0))) : null,
      })),
    })),
    run: parsed.run
      ? {
          ...parsed.run,
          distanceM:
            parsed.run.distanceM !== null
              ? Math.round(parsed.run.distanceM * multiplier)
              : null,
          durationS:
            parsed.run.durationS !== null
              ? Math.round(parsed.run.durationS * multiplier)
              : null,
        }
      : undefined,
  };
}

const SESSION_TEMPLATES: Record<string, PlannedSession> = {
  lower_a: {
    exercises: [
      {
        exerciseId: 'back-squat',
        sets: [
          { setNo: 1, reps: 5, weightKg: null, rpe: 7, tempo: null, isWarmup: true, isDropset: false },
          { setNo: 2, reps: 5, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
          { setNo: 3, reps: 5, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
          { setNo: 4, reps: 5, weightKg: null, rpe: 9, tempo: null, isWarmup: false, isDropset: false },
        ],
      },
      {
        exerciseId: 'romanian-deadlift',
        sets: [
          { setNo: 1, reps: 8, weightKg: null, rpe: 7, tempo: null, isWarmup: false, isDropset: false },
          { setNo: 2, reps: 8, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
          { setNo: 3, reps: 8, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
        ],
      },
      {
        exerciseId: 'bulgarian-split-squat',
        sets: [
          { setNo: 1, reps: 10, weightKg: null, rpe: 7, tempo: null, isWarmup: false, isDropset: false },
          { setNo: 2, reps: 10, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
        ],
      },
    ],
    mobility: ['hip-flexor-stretch', 'ankle-mobility'],
  },
  lower_b: {
    exercises: [
      {
        exerciseId: 'front-squat',
        sets: [
          { setNo: 1, reps: 6, weightKg: null, rpe: 7, tempo: null, isWarmup: false, isDropset: false },
          { setNo: 2, reps: 6, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
          { setNo: 3, reps: 6, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
        ],
      },
      {
        exerciseId: 'hip-thrust',
        sets: [
          { setNo: 1, reps: 10, weightKg: null, rpe: 7, tempo: null, isWarmup: false, isDropset: false },
          { setNo: 2, reps: 10, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
        ],
      },
      {
        exerciseId: 'calf-raise',
        sets: [
          { setNo: 1, reps: 15, weightKg: null, rpe: 7, tempo: null, isWarmup: false, isDropset: false },
          { setNo: 2, reps: 15, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
        ],
      },
    ],
    mobility: ['hamstring-stretch'],
  },
  upper: {
    exercises: [
      {
        exerciseId: 'bench-press',
        sets: [
          { setNo: 1, reps: 6, weightKg: null, rpe: 7, tempo: null, isWarmup: true, isDropset: false },
          { setNo: 2, reps: 6, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
          { setNo: 3, reps: 6, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
        ],
      },
      {
        exerciseId: 'barbell-row',
        sets: [
          { setNo: 1, reps: 8, weightKg: null, rpe: 7, tempo: null, isWarmup: false, isDropset: false },
          { setNo: 2, reps: 8, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
        ],
      },
      {
        exerciseId: 'overhead-press',
        sets: [
          { setNo: 1, reps: 8, weightKg: null, rpe: 7, tempo: null, isWarmup: false, isDropset: false },
          { setNo: 2, reps: 8, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
        ],
      },
      {
        exerciseId: 'pull-up',
        sets: [
          { setNo: 1, reps: 8, weightKg: null, rpe: 7, tempo: null, isWarmup: false, isDropset: false },
          { setNo: 2, reps: 8, weightKg: null, rpe: 8, tempo: null, isWarmup: false, isDropset: false },
        ],
      },
    ],
    mobility: ['shoulder-dislocates'],
  },
  z2_run: {
    exercises: [],
    mobility: [],
    run: { type: 'z2', distanceM: 8000, durationS: null, targetHrZone: 2, note: 'Easy conversational pace' },
  },
  long_run: {
    exercises: [],
    mobility: [],
    run: { type: 'long', distanceM: 14000, durationS: null, targetHrZone: 2, note: 'Steady aerobic' },
  },
  mobility: {
    exercises: [],
    mobility: ['hip-flexor-stretch', 'ankle-mobility', 'hamstring-stretch', 'shoulder-dislocates'],
  },
  rest: { exercises: [], mobility: [] },
};

export function buildProgramStructure(): ProgramStructure {
  return {
    version: 1,
    macro: { name: '12-Week Hybrid Ascent', totalWeeks: TOTAL_WEEKS },
    mesocycles: [
      {
        id: 'meso-1',
        name: 'Foundation',
        startWeek: 1,
        endWeek: 4,
        deloadWeek: 4,
        focus: 'Technique, aerobic base, joint tolerance',
      },
      {
        id: 'meso-2',
        name: 'Build',
        startWeek: 5,
        endWeek: 8,
        deloadWeek: 8,
        focus: 'Progressive overload, run volume',
      },
      {
        id: 'meso-3',
        name: 'Peak',
        startWeek: 9,
        endWeek: 12,
        deloadWeek: 12,
        focus: 'Race/trek readiness, intensity touches',
      },
    ],
    weeklyTemplate: [
      { dayOffset: 0, type: 'lower', title: 'Lower A', templateKey: 'lower_a' },
      { dayOffset: 1, type: 'run', title: 'Z2 Run', templateKey: 'z2_run' },
      { dayOffset: 2, type: 'upper', title: 'Upper', templateKey: 'upper' },
      { dayOffset: 3, type: 'mobility', title: 'Mobility', templateKey: 'mobility' },
      { dayOffset: 4, type: 'lower', title: 'Lower B', templateKey: 'lower_b' },
      { dayOffset: 5, type: 'run', title: 'Long Run', templateKey: 'long_run' },
      { dayOffset: 6, type: 'rest', title: 'Rest', templateKey: 'rest' },
    ],
    sessionTemplates: SESSION_TEMPLATES,
    deloadRules: { volumeMultiplier: DELOAD_VOLUME_MULTIPLIER, intensityCapRpe: DELOAD_RPE_CAP },
  };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekStartDate(startDate: string, weekNumber: number): string {
  return addDays(startDate, (weekNumber - 1) * 7);
}

export function isDeloadWeek(weekNumber: number): boolean {
  return DELOAD_WEEKS.includes(weekNumber as 4 | 8 | 12);
}

export function mesocycleForWeek(weekNumber: number, structure: ProgramStructure): Mesocycle {
  const meso = structure.mesocycles.find(
    (m) => weekNumber >= m.startWeek && weekNumber <= m.endWeek,
  );
  if (!meso) throw new Error(`No mesocycle for week ${String(weekNumber)}`);
  return meso;
}

export function buildWeekSessions(startDate: string, weekNumber: number): WeekSessionSeedWithMeta[] {
  const structure = buildProgramStructure();
  const isDeload = isDeloadWeek(weekNumber);
  const weekStart = weekStartDate(startDate, weekNumber);
  const meso = mesocycleForWeek(weekNumber, structure);

  return structure.weeklyTemplate.map((slot) => {
    const template = structure.sessionTemplates[slot.templateKey];
    if (!template) throw new Error(`Missing template ${slot.templateKey}`);

    let planned = PlannedSessionSchema.parse(template);
    if (isDeload) {
      planned = scalePlanned(
        planned,
        structure.deloadRules.volumeMultiplier,
        structure.deloadRules.intensityCapRpe,
      );
    }

    const title = isDeload ? `${slot.title} (Deload)` : slot.title;

    return {
      date: addDays(weekStart, slot.dayOffset),
      type: slot.type,
      title,
      planned,
      weekNumber,
      isDeload,
      mesoName: meso.name,
    };
  });
}

// ponytail: WeekSessionSeed includes mesoName for seed summary only
export type WeekSessionSeedWithMeta = WeekSessionSeed & { mesoName: string };
