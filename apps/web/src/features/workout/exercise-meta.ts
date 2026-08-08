import { EXERCISE_LIBRARY } from '@maos/shared';

export function exerciseName(exerciseId: string): string {
  return EXERCISE_LIBRARY.find((e) => e.id === exerciseId)?.name ?? exerciseId;
}

export function exerciseSeed(exerciseId: string) {
  return EXERCISE_LIBRARY.find((e) => e.id === exerciseId) ?? null;
}
