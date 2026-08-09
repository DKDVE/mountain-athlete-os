import {
  AthleteProfile,
  buildWeekSessions,
  evaluateProgramGeneration,
  type AthleteProfile as AthleteProfileType,
  type Json,
} from '@maos/shared';
import { supabase } from '@/lib/supabase';
import { localDateString } from '@/features/program/program-utils';

export type OnboardingDraft = Partial<AthleteProfileType> & {
  goals?: AthleteProfileType['goals'];
};

export const EMPTY_DRAFT: OnboardingDraft = {
  goals: [],
  experience: 'intermediate',
  constraints: {
    daysPerWeek: 4,
    sessionMinutes: 60,
    equipment: ['barbell', 'rack', 'bench', 'pull_up_bar', 'dumbbell', 'bodyweight', 'outdoor'],
  },
  screening: { flags: [] },
  preferences: { likedMovements: [], dislikedMovements: [] },
  metricsSnapshot: {},
};

export async function fetchAthleteProfile(userId: string): Promise<{
  profile: AthleteProfileType | null;
  version: number;
} | null> {
  const { data, error } = await supabase
    .from('athlete_profiles')
    .select('profile, version')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const parsed = AthleteProfile.safeParse(data.profile);
  return {
    profile: parsed.success ? parsed.data : null,
    version: data.version,
  };
}

export async function saveAthleteProfileDraft(
  userId: string,
  draft: OnboardingDraft,
  version = 1,
): Promise<void> {
  const { error } = await supabase.from('athlete_profiles').upsert(
    {
      user_id: userId,
      profile: draft,
      version,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}

export async function saveAthleteProfile(
  userId: string,
  profile: AthleteProfileType,
  version: number,
): Promise<void> {
  const validated = AthleteProfile.parse(profile);
  const { error } = await supabase.from('athlete_profiles').upsert(
    {
      user_id: userId,
      profile: validated,
      version: version + 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}

export type ProgramGenerationOutcome =
  | { status: 'ok'; programId: string }
  | { status: 'specialized'; message: string };

export async function generateProgramForUser(
  userId: string,
  profile: AthleteProfileType,
): Promise<ProgramGenerationOutcome> {
  const result = evaluateProgramGeneration(profile);
  if (result.status === 'specialized') {
    return { status: 'specialized', message: result.message };
  }

  const startDate = localDateString();
  const structure = result.structure;

  await supabase.from('programs').update({ active: false }).eq('user_id', userId).eq('active', true);

  const { data: program, error: programError } = await supabase
    .from('programs')
    .insert({
      user_id: userId,
      name: structure.macro.name,
      start_date: startDate,
      structure: structure as unknown as Json,
      active: true,
    })
    .select('id')
    .single();
  if (programError) throw programError;

  const weekSessions = buildWeekSessions(startDate, 1, profile);
  for (const session of weekSessions) {
    const { error } = await supabase.from('sessions').insert({
      user_id: userId,
      program_id: program.id,
      date: session.date,
      type: session.type,
      title: session.title,
      planned: session.planned,
      status: 'upcoming',
    });
    if (error) throw error;
  }

  return { status: 'ok', programId: program.id };
}

export async function parseProfileWithAi(
  text: string,
  accessToken: string,
): Promise<{ ok: true; profile: AthleteProfileType } | { ok: false; message: string }> {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) return { ok: false, message: 'API not configured' };

  const res = await fetch(`${base}/onboarding/parse-profile`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  const body = (await res.json()) as {
    ok: boolean;
    data?: { profile: AthleteProfileType };
    error?: { message: string };
  };

  if (!body.ok || !body.data?.profile) {
    return { ok: false, message: body.error?.message ?? 'AI parse failed' };
  }

  const parsed = AthleteProfile.safeParse(body.data.profile);
  if (!parsed.success) return { ok: false, message: 'Invalid profile from AI' };
  return { ok: true, profile: parsed.data };
}
