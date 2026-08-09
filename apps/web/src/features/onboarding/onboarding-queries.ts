import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { fetchAthleteProfile } from '@/features/onboarding/onboarding-api';
import { supabase } from '@/lib/supabase';

async function hasActiveProgram(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('programs')
    .select('id')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export function useAthleteProfile() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['athlete_profile', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      return fetchAthleteProfile(userId);
    },
    staleTime: 30_000,
  });
}

export function useOnboardingComplete() {
  const userId = useAuthStore((s) => s.user?.id);
  const profileQuery = useAthleteProfile();
  const programQuery = useQuery({
    queryKey: ['onboarding_program_check', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return false;
      return hasActiveProgram(userId);
    },
    staleTime: 10_000,
  });
  const complete =
    Boolean(profileQuery.data?.profile?.goals.length) || Boolean(programQuery.data);
  return {
    ...profileQuery,
    complete,
    isLoading: profileQuery.isLoading || programQuery.isLoading,
  };
}
