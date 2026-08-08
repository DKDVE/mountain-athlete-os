import type { LoggedSetRow } from '@/lib/db';

export function tonnageKg(sets: LoggedSetRow[]): number {
  return sets
    .filter((s) => !s.isWarmup)
    .reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function roundKg(kg: number): number {
  return Math.round(kg * 2) / 2;
}

export function dropsetWeightKg(weightKg: number): number {
  return roundKg(weightKg * 0.8);
}

export interface ExerciseDelta {
  exerciseId: string;
  setsLogged: number;
  tonnageKg: number;
}

export function perExerciseDeltas(sets: LoggedSetRow[]): ExerciseDelta[] {
  const map = new Map<string, ExerciseDelta>();
  for (const s of sets) {
    const row = map.get(s.exerciseId) ?? {
      exerciseId: s.exerciseId,
      setsLogged: 0,
      tonnageKg: 0,
    };
    row.setsLogged += 1;
    if (!s.isWarmup) {
      row.tonnageKg += (s.weightKg ?? 0) * (s.reps ?? 0);
    }
    map.set(s.exerciseId, row);
  }
  return [...map.values()];
}
