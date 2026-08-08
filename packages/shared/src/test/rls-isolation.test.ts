import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../db.types.js';
import { EXERCISE_LIBRARY } from '../seed/exercises.js';

const USER_OWNED_TABLES = [
  'profiles',
  'programs',
  'sessions',
  'set_logs',
  'runs',
  'shoes',
  'meals',
  'checkins',
  'measurements',
  'body_photos',
  'habits',
  'habit_logs',
  'goals',
  'achievements',
  'daily_metrics',
  'dashboards',
  'plan_events',
  'coach_messages',
] as const;

const IS_CI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

function missingRlsEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.VITE_SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');
  return missing;
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function anonKey(): string {
  return env('VITE_SUPABASE_ANON_KEY');
}

function defineRlsSuite(): void {
  const missing = missingRlsEnv();

  if (IS_CI && missing.length > 0) {
    describe('RLS isolation (CI)', () => {
      it('requires encrypted Supabase secrets in GitHub Actions', () => {
        throw new Error(
          `CI RLS suite blocked: set repository secrets ${missing.join(', ')}. Skipping RLS tests in CI is not allowed.`,
        );
      });
    });
    return;
  }

  if (missing.length > 0) {
    describe.skip('RLS isolation', () => {
      it('skipped locally without Supabase credentials', () => undefined);
    });
    return;
  }

  describe('RLS isolation', () => {
    let admin: ReturnType<typeof createClient<Database>>;

    let userAId = '';
    let userBEmail = '';
    const password = 'rls-test-pass-123';

    beforeAll(async () => {
      admin = createClient<Database>(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      for (const ex of EXERCISE_LIBRARY) {
        await admin.from('exercises').upsert({
          id: ex.id,
          user_id: null,
          name: ex.name,
          pattern: ex.pattern,
          equipment: ex.equipment,
          cues: ex.cues,
          substitutions: ex.substitutions,
          pain_safe_for: ex.painSafeFor,
        });
      }
      await admin.from('foods').upsert({
        id: 'chicken-breast',
        user_id: null,
        name: 'Chicken breast',
        unit_label: 'katori',
        protein_g: 28,
        kcal: 165,
        is_staple: true,
        sort: 1,
      });

      const stamp = String(Date.now());
      const emailA = `rls-a-${stamp}@maos.test`;
      userBEmail = `rls-b-${stamp}@maos.test`;

      const a = await admin.auth.admin.createUser({ email: emailA, password, email_confirm: true });
      const b = await admin.auth.admin.createUser({ email: userBEmail, password, email_confirm: true });
      if (a.error) throw a.error;
      if (b.error) throw b.error;
      const userA = a.data.user as { id: string };
      const userB = b.data.user as { id: string };
      userAId = userA.id;

      await admin.from('profiles').upsert({ id: userA.id });
      await admin.from('profiles').upsert({ id: userB.id });

      await admin.from('programs').insert({
        user_id: userAId,
        name: 'RLS Test Program',
        start_date: '2026-08-11',
        structure: { version: 1 },
      });

      const session = await admin
        .from('sessions')
        .insert({
          user_id: userAId,
          date: '2026-08-11',
          type: 'lower',
          title: 'RLS Session',
          planned: { exercises: [] },
        })
        .select('id')
        .single();

      await admin.from('shoes').insert({ user_id: userAId, name: 'Test Shoe' });
      const habitInsert = await admin
        .from('habits')
        .insert({ user_id: userAId, name: 'Test Habit' })
        .select('id')
        .single();
      if (habitInsert.data) {
        await admin.from('habit_logs').insert({
          user_id: userAId,
          habit_id: habitInsert.data.id,
          date: '2026-08-11',
        });
      }

      await admin.from('goals').insert({ user_id: userAId, type: 'waist', target: { cm: 80 } });
      await admin.from('achievements').insert({
        user_id: userAId,
        badge_key: `test-badge-${stamp}`,
        tier: 'bronze',
      });
      await admin.from('daily_metrics').insert({
        user_id: userAId,
        date: '2026-08-11',
        readiness: 80,
      });
      await admin.from('dashboards').insert({
        user_id: userAId,
        config: { version: 1, widgets: [] },
      });
      await admin.from('plan_events').insert({
        user_id: userAId,
        source: 'user',
        diff: { op: 'test' },
      });
      await admin.from('coach_messages').insert({
        user_id: userAId,
        role: 'user',
        content: 'hello',
      });
      await admin.from('checkins').insert({ user_id: userAId, date: '2026-08-11' });
      await admin.from('measurements').insert({
        user_id: userAId,
        date: '2026-08-11',
        site: 'waist',
        value_cm: 82,
      });
      await admin.from('body_photos').insert({
        user_id: userAId,
        date: '2026-08-11',
        pose: 'front',
        storage_ref: 'test/ref',
      });
      await admin.from('runs').insert({ user_id: userAId, date: '2026-08-11', type: 'z2' });
      await admin.from('meals').insert({
        user_id: userAId,
        food_id: 'chicken-breast',
        protein_g: 28,
        kcal: 165,
      });

      if (session.data) {
        await admin.from('set_logs').insert({
          user_id: userAId,
          session_id: session.data.id,
          exercise_id: 'back-squat',
          set_no: 1,
        });
      }
    });

    afterAll(async () => {
      if (!userAId) return;
      await admin.auth.admin.deleteUser(userAId);
      const users = await admin.auth.admin.listUsers();
      const b = users.data.users.find((u) => u.email === userBEmail);
      if (b) await admin.auth.admin.deleteUser(b.id);
    });

    it.each(USER_OWNED_TABLES)('user B cannot read user A rows in %s', async (table) => {
      const anon = createClient<Database>(env('SUPABASE_URL'), anonKey());
      const login = await anon.auth.signInWithPassword({ email: userBEmail, password });
      if (login.error) throw login.error;
      const session = login.data.session as { access_token: string };

      const userClient = createClient<Database>(env('SUPABASE_URL'), anonKey(), {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } },
      });

      const { data, error } = await userClient.from(table).select('*');
      expect(error).toBeNull();
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      const leaked = rows.filter((row) => {
        if ('user_id' in row) return row.user_id === userAId;
        if (table === 'profiles' && 'id' in row) return row.id === userAId;
        return false;
      });
      expect(leaked).toHaveLength(0);
    });
  });
}

defineRlsSuite();
