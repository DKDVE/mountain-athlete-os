import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@maos/shared';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

type SetLogSelect = Pick<Tables<'set_logs'>, 'weight_kg' | 'reps' | 'rpe' | 'logged_at'>;

export interface ExerciseHistoryPoint {
  date: string;
  topWeightKg: number;
  topReps: number;
}

export function useExerciseHistory(exerciseId: string | null) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['exercise-history', userId, exerciseId],
    enabled: Boolean(userId && exerciseId),
    queryFn: async (): Promise<ExerciseHistoryPoint[]> => {
      if (!userId || !exerciseId) return [];
      const { data, error } = await supabase
        .from('set_logs')
        .select('weight_kg, reps, logged_at')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .eq('is_warmup', false)
        .order('logged_at', { ascending: true })
        .limit(40)
        .overrideTypes<SetLogSelect[], { merge: false }>();
      if (error) throw error;
      const byDate = new Map<string, ExerciseHistoryPoint>();
      for (const row of data) {
        const date = row.logged_at.slice(0, 10);
        const weight = row.weight_kg ?? 0;
        const reps = row.reps ?? 0;
        const prev = byDate.get(date);
        if (!prev || weight > prev.topWeightKg) {
          byDate.set(date, { date, topWeightKg: weight, topReps: reps });
        }
      }
      return [...byDate.values()];
    },
    staleTime: 60_000,
  });
}

export function useLastExerciseSet(exerciseId: string | null) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['last-set', userId, exerciseId],
    enabled: Boolean(userId && exerciseId),
    queryFn: async () => {
      if (!userId || !exerciseId) return null;
      const { data, error } = await supabase
        .from('set_logs')
        .select('weight_kg, reps, rpe, logged_at')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .eq('is_warmup', false)
        .order('logged_at', { ascending: false })
        .limit(1)
        .maybeSingle<SetLogSelect>();
      if (error) throw error;
      if (!data) return null;
      return {
        weightKg: data.weight_kg ?? 0,
        reps: data.reps ?? 0,
        rpe: data.rpe,
        date: data.logged_at.slice(0, 10),
      };
    },
    staleTime: 30_000,
  });
}
