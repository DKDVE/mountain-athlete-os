import type { AthleteGoal, AthleteProfile } from '../schemas/athlete-profile.js';
import { programGenerationBlocked } from '../schemas/athlete-profile.js';
import type { SessionType, PlannedSession } from '../schemas/common.js';
import { PlannedSessionSchema } from '../schemas/common.js';
import { excludedExerciseIds, resolveExerciseId } from './contraindications.js';

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
  primaryGoal?: AthleteGoal;
}

export interface WeekSessionSeed {
  date: string;
  type: SessionType;
  title: string;
  planned: PlannedSession;
  weekNumber: number;
  isDeload: boolean;
}

export type ProgramGenerationResult =
  | { status: 'ok'; structure: ProgramStructure }
  | { status: 'specialized'; message: string };

interface GoalScheme {
  compoundSets: number;
  accessorySets: number;
  compoundReps: number;
  accessoryReps: number;
  compoundRpe: number;
  accessoryRpe: number;
}

const GOAL_SCHEMES: Record<string, GoalScheme> = {
  strength: { compoundSets: 4, accessorySets: 3, compoundReps: 4, accessoryReps: 6, compoundRpe: 8, accessoryRpe: 7 },
  hypertrophy: { compoundSets: 4, accessorySets: 3, compoundReps: 10, accessoryReps: 12, compoundRpe: 8, accessoryRpe: 7 },
  endurance: { compoundSets: 3, accessorySets: 2, compoundReps: 15, accessoryReps: 15, compoundRpe: 7, accessoryRpe: 7 },
  fat_loss: { compoundSets: 4, accessorySets: 3, compoundReps: 5, accessoryReps: 8, compoundRpe: 8, accessoryRpe: 7 },
  recomposition: { compoundSets: 4, accessorySets: 3, compoundReps: 8, accessoryReps: 10, compoundRpe: 8, accessoryRpe: 7 },
  hybrid_performance: { compoundSets: 4, accessorySets: 3, compoundReps: 5, accessoryReps: 8, compoundRpe: 8, accessoryRpe: 7 },
  event_specific: { compoundSets: 4, accessorySets: 3, compoundReps: 5, accessoryReps: 8, compoundRpe: 8, accessoryRpe: 7 },
};

const GOAL_MACRO_NAMES: Record<string, string> = {
  strength: '12-Week Strength Ascent',
  hypertrophy: '12-Week Hypertrophy Ascent',
  endurance: '12-Week Endurance Ascent',
  fat_loss: '12-Week Fat Loss Ascent',
  recomposition: '12-Week Recomposition Ascent',
  hybrid_performance: '12-Week Hybrid Ascent',
  event_specific: '12-Week Event Prep Ascent',
};

function resolveGoal(profile?: AthleteProfile): AthleteGoal {
  if (!profile?.goals[0]) return 'hybrid_performance';
  const goal = profile.goals[0];
  if (goal === 'event_specific') return 'hybrid_performance';
  return goal;
}

function makeSets(count: number, reps: number, rpe: number, warmup = false) {
  return Array.from({ length: count }, (_, i) => ({
    setNo: i + 1,
    reps,
    weightKg: null as number | null,
    rpe: i === 0 && warmup ? Math.max(1, rpe - 1) : rpe,
    tempo: null as string | null,
    isWarmup: i === 0 && warmup,
    isDropset: false,
  }));
}

function buildSessionTemplates(scheme: GoalScheme, excluded: Set<string>): Record<string, PlannedSession> {
  const pick = (preferredId: string) => resolveExerciseId(preferredId, excluded);

  const exerciseEntry = (
    preferredId: string,
    sets: ReturnType<typeof makeSets>,
    supersetWith?: string,
  ) => {
    const exerciseId = pick(preferredId);
    if (!exerciseId) return null;
    const partnerId = supersetWith ? pick(supersetWith) : undefined;
    return {
      exerciseId,
      supersetWith: partnerId && partnerId !== exerciseId ? partnerId : undefined,
      sets,
    };
  };

  const lowerAExercises = [
    exerciseEntry('back-squat', makeSets(scheme.compoundSets, scheme.compoundReps, scheme.compoundRpe, true)),
    exerciseEntry('romanian-deadlift', makeSets(scheme.accessorySets, scheme.accessoryReps, scheme.accessoryRpe)),
    exerciseEntry('bulgarian-split-squat', makeSets(2, scheme.accessoryReps, scheme.accessoryRpe)),
  ].filter(Boolean) as PlannedSession['exercises'];

  const lowerBExercises = [
    exerciseEntry('front-squat', makeSets(scheme.compoundSets, scheme.compoundReps, scheme.compoundRpe)),
    exerciseEntry('hip-thrust', makeSets(scheme.accessorySets, scheme.accessoryReps, scheme.accessoryRpe)),
    exerciseEntry('calf-raise', makeSets(2, scheme.accessoryReps + 3, scheme.accessoryRpe)),
  ].filter(Boolean) as PlannedSession['exercises'];

  const upperExercises = [
    exerciseEntry(
      'bench-press',
      makeSets(scheme.compoundSets, scheme.compoundReps, scheme.compoundRpe, true),
      'barbell-row',
    ),
    exerciseEntry(
      'barbell-row',
      makeSets(scheme.accessorySets, scheme.accessoryReps, scheme.accessoryRpe),
      'bench-press',
    ),
    exerciseEntry('overhead-press', makeSets(scheme.accessorySets, scheme.accessoryReps, scheme.accessoryRpe)),
    exerciseEntry('pull-up', makeSets(2, scheme.accessoryReps, scheme.accessoryRpe)),
  ].filter(Boolean) as PlannedSession['exercises'];

  const mobility = ['hip-flexor-stretch', 'ankle-mobility', 'hamstring-stretch', 'shoulder-dislocates'].filter(
    (m) => !excluded.has(m),
  );

  return {
    lower_a: { exercises: lowerAExercises, mobility: mobility.slice(0, 2) },
    lower_b: { exercises: lowerBExercises, mobility: mobility.includes('hamstring-stretch') ? ['hamstring-stretch'] : [] },
    upper: { exercises: upperExercises, mobility: mobility.includes('shoulder-dislocates') ? ['shoulder-dislocates'] : [] },
    z2_run: {
      exercises: [],
      mobility: [],
      run: { type: 'z2' as const, distanceM: 8000, durationS: null, targetHrZone: 2, note: 'Easy conversational pace' },
    },
    long_run: {
      exercises: [],
      mobility: [],
      run: { type: 'long' as const, distanceM: 14000, durationS: null, targetHrZone: 2, note: 'Steady aerobic' },
    },
    mobility: { exercises: [], mobility },
    rest: { exercises: [], mobility: [] },
  };
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
            parsed.run.distanceM !== null ? Math.round(parsed.run.distanceM * multiplier) : null,
          durationS:
            parsed.run.durationS !== null ? Math.round(parsed.run.durationS * multiplier) : null,
        }
      : undefined,
  };
}

export function evaluateProgramGeneration(profile: AthleteProfile): ProgramGenerationResult {
  if (programGenerationBlocked(profile)) {
    return {
      status: 'specialized',
      message:
        'Specialized programming is not yet available for your profile. Please consult a qualified professional before starting training.',
    };
  }
  const goal = resolveGoal(profile);
  const scheme = GOAL_SCHEMES[goal] ?? GOAL_SCHEMES.hybrid_performance ?? {
    compoundSets: 4, accessorySets: 3, compoundReps: 5, accessoryReps: 8, compoundRpe: 8, accessoryRpe: 7,
  };
  const excluded = excludedExerciseIds(profile);
  const sessionTemplates = buildSessionTemplates(scheme, excluded);
  const macroName = GOAL_MACRO_NAMES[goal] ?? GOAL_MACRO_NAMES.hybrid_performance ?? '12-Week Hybrid Ascent';

  return {
    status: 'ok',
    structure: {
      version: 1,
      macro: { name: macroName, totalWeeks: TOTAL_WEEKS },
      mesocycles: [
        {
          id: 'meso-1',
          name: 'Rebuild',
          startWeek: 1,
          endWeek: 4,
          deloadWeek: 4,
          focus: 'Technique reset, aerobic base, joint tolerance for trek loads',
        },
        {
          id: 'meso-2',
          name: 'Build',
          startWeek: 5,
          endWeek: 8,
          deloadWeek: 8,
          focus: 'Progressive overload, run volume, strength for ascent',
        },
        {
          id: 'meso-3',
          name: 'Perform',
          startWeek: 9,
          endWeek: 12,
          deloadWeek: 12,
          focus: 'Trek readiness, intensity touches, peak hybrid output',
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
      sessionTemplates,
      deloadRules: { volumeMultiplier: DELOAD_VOLUME_MULTIPLIER, intensityCapRpe: DELOAD_RPE_CAP },
      primaryGoal: goal,
    },
  };
}

const DEFAULT_PROFILE: AthleteProfile = {
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

export function buildProgramStructure(profile?: AthleteProfile): ProgramStructure {
  const result = evaluateProgramGeneration(profile ?? DEFAULT_PROFILE);
  if (result.status !== 'ok') {
    const fallback = evaluateProgramGeneration(DEFAULT_PROFILE);
    if (fallback.status !== 'ok') throw new Error('Default program generation failed');
    return fallback.structure;
  }
  return result.structure;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekStartDate(startDate: string, weekNumber: number): string {
  return addDays(startDate, (weekNumber - 1) * 7);
}

export function weekNumberForDate(startDate: string, today: string): number {
  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${today}T12:00:00Z`);
  const days = Math.floor((end.getTime() - start.getTime()) / 86400000);
  if (days < 0) return 1;
  return Math.min(TOTAL_WEEKS, Math.floor(days / 7) + 1);
}

export function programContextForDate(
  structure: ProgramStructure,
  startDate: string,
  today: string,
) {
  const weekNumber = weekNumberForDate(startDate, today);
  const meso = mesocycleForWeek(weekNumber, structure);
  return {
    weekNumber,
    mesoName: meso.name,
    mesoFocus: meso.focus,
    isDeload: isDeloadWeek(weekNumber),
  };
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

export function buildWeekSessions(
  startDate: string,
  weekNumber: number,
  profile?: AthleteProfile,
): WeekSessionSeedWithMeta[] {
  const structure = buildProgramStructure(profile);
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

export type WeekSessionSeedWithMeta = WeekSessionSeed & { mesoName: string };
