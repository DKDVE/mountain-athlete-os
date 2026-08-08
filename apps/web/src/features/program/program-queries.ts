import { useQuery } from '@tanstack/react-query';
import { programContextForDate, type ProgramStructure, type Tables } from '@maos/shared';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { localDateString, parseProgramStructure } from '@/features/program/program-utils';

export interface ProgramRow {
  id: string;
  name: string;
  start_date: string;
  structure: ProgramStructure;
}

export interface SessionRow {
  id: string;
  program_id: string | null;
  date: string;
  type: string;
  title: string;
  planned: unknown;
  status: string;
}

type ProgramSelect = Pick<Tables<'programs'>, 'id' | 'name' | 'start_date' | 'structure'>;
type SessionSelect = Pick<
  Tables<'sessions'>,
  'id' | 'program_id' | 'date' | 'type' | 'title' | 'planned' | 'status'
>;
type DailyMetricsSelect = Pick<Tables<'daily_metrics'>, 'readiness' | 'load'>;
type MealProteinSelect = Pick<Tables<'meals'>, 'protein_g'>;
type SessionDateSelect = Pick<Tables<'sessions'>, 'date'>;

function assertUserId(userId: string | undefined): string {
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

async function fetchActiveProgram(userId: string): Promise<ProgramRow | null> {
  const { data, error } = await supabase
    .from('programs')
    .select('id, name, start_date, structure')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle<ProgramSelect>();
  if (error) throw error;
  if (!data) return null;
  const structure = parseProgramStructure(data.structure);
  if (!structure) throw new Error('Invalid program structure in DB');
  return {
    id: data.id,
    name: data.name,
    start_date: data.start_date,
    structure,
  };
}

async function fetchSessionsForDate(userId: string, date: string): Promise<SessionRow[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, program_id, date, type, title, planned, status')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: true })
    .overrideTypes<SessionSelect[], { merge: false }>();
  if (error) throw error;
  return data;
}

async function fetchDailyMetrics(userId: string, date: string): Promise<DailyMetricsSelect | null> {
  const { data, error } = await supabase
    .from('daily_metrics')
    .select('readiness, load')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle<DailyMetricsSelect>();
  if (error) throw error;
  return data;
}

async function fetchProteinToday(userId: string, date: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('meals')
    .select('protein_g')
    .eq('user_id', userId)
    .gte('ts', `${date}T00:00:00`)
    .lte('ts', `${date}T23:59:59`)
    .overrideTypes<MealProteinSelect[], { merge: false }>();
  if (error) throw error;
  if (data.length === 0) return null;
  return data.reduce((sum, row) => sum + row.protein_g, 0);
}

async function fetchWeeklyLoad(userId: string, endDate: string): Promise<number | null> {
  const start = new Date(`${endDate}T12:00:00`);
  start.setDate(start.getDate() - 6);
  const startStr = localDateString(start);
  const { data, error } = await supabase
    .from('daily_metrics')
    .select('load')
    .eq('user_id', userId)
    .gte('date', startStr)
    .lte('date', endDate)
    .overrideTypes<Pick<DailyMetricsSelect, 'load'>[], { merge: false }>();
  if (error) throw error;
  if (data.length === 0) return null;
  const total = data.reduce((sum, row) => sum + (row.load ?? 0), 0);
  return total > 0 ? total : null;
}

async function fetchTrainingStreak(userId: string, today: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('date')
    .eq('user_id', userId)
    .eq('status', 'done')
    .lte('date', today)
    .order('date', { ascending: false })
    .limit(30)
    .overrideTypes<SessionDateSelect[], { merge: false }>();
  if (error) throw error;
  if (data.length === 0) return null;

  const dates = new Set(data.map((row) => row.date));
  let streak = 0;
  const cursor = new Date(`${today}T12:00:00`);
  while (dates.has(localDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak > 0 ? streak : null;
}

export function useTodayDate() {
  return localDateString();
}

export function useActiveProgram() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['program', 'active', userId],
    enabled: Boolean(userId),
    queryFn: () => fetchActiveProgram(assertUserId(userId)),
    staleTime: 60_000,
  });
}

export function useProgramContext(program: ProgramRow | null | undefined, today: string) {
  if (!program) return null;
  return programContextForDate(program.structure, program.start_date, today);
}

export function useSessionsForDate(date: string, enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['sessions', userId, date],
    enabled: Boolean(userId) && enabled && Boolean(date),
    queryFn: () => fetchSessionsForDate(assertUserId(userId), date),
    staleTime: 30_000,
  });
}

export function useDailyMetrics(date: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['daily_metrics', userId, date],
    enabled: Boolean(userId),
    queryFn: () => fetchDailyMetrics(assertUserId(userId), date),
    staleTime: 60_000,
  });
}

export function useProteinToday(date: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['protein', userId, date],
    enabled: Boolean(userId),
    queryFn: () => fetchProteinToday(assertUserId(userId), date),
    staleTime: 30_000,
  });
}

export function useWeeklyLoad(date: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['weekly_load', userId, date],
    enabled: Boolean(userId),
    queryFn: () => fetchWeeklyLoad(assertUserId(userId), date),
    staleTime: 60_000,
  });
}

export function useTrainingStreak(date: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['streak', userId, date],
    enabled: Boolean(userId),
    queryFn: () => fetchTrainingStreak(assertUserId(userId), date),
    staleTime: 60_000,
  });
}
