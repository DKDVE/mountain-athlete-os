import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import type { Tables } from '@maos/shared';

type SessionSelect = Pick<
  Tables<'sessions'>,
  'id' | 'date' | 'type' | 'title' | 'planned' | 'status' | 'program_id'
>;

export function useSession(sessionId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['session', sessionId, userId],
    enabled: Boolean(userId && sessionId),
    queryFn: async (): Promise<SessionSelect | null> => {
      if (!userId || !sessionId) return null;
      const { data, error } = await supabase
        .from('sessions')
        .select('id, date, type, title, planned, status, program_id')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .maybeSingle<SessionSelect>();
      if (error) throw error;
      return data;
    },
  });
}
