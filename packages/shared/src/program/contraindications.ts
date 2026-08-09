import type { AthleteProfile } from '../schemas/athlete-profile.js';
import { EXERCISE_LIBRARY } from '../seed/exercises.js';
import type { ScreeningFlag } from '../schemas/athlete-profile.js';

const EXERCISE_BY_ID = new Map(EXERCISE_LIBRARY.map((e) => [e.id, e]));

/** Last-resort picks when preferred exercise and its substitutions are all excluded. */
const SLOT_FALLBACKS = [
  'goblet-squat',
  'hip-thrust',
  'face-pull',
  'plank',
  'pallof-press',
  'calf-raise',
] as const;

/** Exercises to exclude per screening flag (beyond injury-region logic). */
export const SCREENING_EXCLUSIONS: Partial<Record<ScreeningFlag, readonly string[]>> = {
  metabolic: ['back-squat', 'front-squat'],
  renal: ['back-squat', 'front-squat', 'romanian-deadlift'],
  recent_surgery: ['back-squat', 'front-squat', 'bench-press', 'overhead-press', 'pull-up'],
  uncontrolled_bp: ['overhead-press', 'back-squat', 'bench-press'],
  chronic_condition_other: [],
};

const EQUIPMENT_MAP: Record<string, string[]> = {
  'back-squat': ['barbell', 'rack'],
  'front-squat': ['barbell', 'rack'],
  'goblet-squat': ['dumbbell'],
  'romanian-deadlift': ['barbell'],
  'hip-thrust': ['barbell', 'bench'],
  'bulgarian-split-squat': ['dumbbell', 'bench'],
  'bench-press': ['barbell', 'bench'],
  'overhead-press': ['barbell'],
  'barbell-row': ['barbell'],
  'pull-up': ['pull-up-bar'],
  'face-pull': ['cable'],
  'calf-raise': ['machine'],
  plank: ['bodyweight'],
  'pallof-press': ['cable', 'band'],
};

function exerciseRequiresEquipment(exerciseId: string, available: Set<string>): boolean {
  const needed = EQUIPMENT_MAP[exerciseId];
  if (!needed) return true;
  return needed.every((eq) => {
    const normalized = eq === 'pull-up-bar' ? 'pull_up_bar' : eq;
    return available.has(normalized) || available.has(eq);
  });
}

/** Returns exercise IDs that must not appear in generated sessions. */
export function excludedExerciseIds(profile: AthleteProfile): Set<string> {
  const excluded = new Set<string>();
  const available = new Set(profile.constraints.equipment);

  for (const entry of profile.screening.flags) {
    if (entry.flag === 'current_injury' && entry.region) {
      for (const ex of EXERCISE_LIBRARY) {
        if (!ex.painSafeFor.includes(entry.region)) {
          excluded.add(ex.id);
        }
      }
    }
    const flagList = SCREENING_EXCLUSIONS[entry.flag];
    if (flagList) {
      for (const id of flagList) excluded.add(id);
    }
  }

  for (const id of profile.preferences.dislikedMovements) {
    excluded.add(id);
  }

  for (const ex of EXERCISE_LIBRARY) {
    if (!exerciseRequiresEquipment(ex.id, available)) {
      excluded.add(ex.id);
    }
  }

  return excluded;
}

/** Pick an exercise id, following substitution chain when the preferred lift is excluded. */
export function resolveExerciseId(
  preferredId: string,
  excluded: Set<string>,
  visited = new Set<string>(),
): string | null {
  if (visited.has(preferredId)) return null;
  visited.add(preferredId);

  if (!excluded.has(preferredId)) return preferredId;

  const preferred = EXERCISE_BY_ID.get(preferredId);
  if (preferred) {
    for (const sub of preferred.substitutions) {
      const resolved = resolveExerciseId(sub.id, excluded, visited);
      if (resolved) return resolved;
    }
  }

  for (const fallback of SLOT_FALLBACKS) {
    if (!excluded.has(fallback) && !visited.has(fallback)) return fallback;
  }
  return null;
}
