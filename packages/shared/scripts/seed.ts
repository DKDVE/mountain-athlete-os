import { createClient } from '@supabase/supabase-js';
import { buildProgramStructure, buildWeekSessions } from '../src/program/factory.js';
import { EXERCISE_LIBRARY } from '../src/seed/exercises.js';
import { STAPLE_FOODS } from '../src/seed/foods.js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function assertSeedSafe(url: string) {
  const env = process.env.MAOS_SEED_ENV ?? 'dev';
  if (!['local', 'dev'].includes(env)) {
    throw new Error(`MAOS_SEED_ENV must be local or dev (got ${env})`);
  }
  if (url.includes('prod') && process.env.MAOS_SEED_CONFIRM !== 'yes') {
    throw new Error('Refusing prod seed without MAOS_SEED_CONFIRM=yes');
  }
}

export async function runSeed(startDate = process.env.MAOS_PROGRAM_START ?? '2026-08-11') {
  const url = requireEnv('SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  assertSeedSafe(url);

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = process.env.MAOS_SEED_EMAIL ?? 'seed@maos.local';
  const password = process.env.MAOS_SEED_PASSWORD ?? 'seedpass123';

  let userId: string;
  const existing = await admin.auth.admin.listUsers();
  const found = existing.data.users.find((u) => u.email === email);
  if (found) {
    userId = found.id;
  } else {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error || !created.data.user) {
      throw created.error ?? new Error('Failed to create seed user');
    }
    userId = created.data.user.id;
  }

  await admin.from('profiles').upsert({
    id: userId,
    display_name: 'Seed Athlete',
    targets: { kcal: 2250, protein_g: 130 },
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

  for (const food of STAPLE_FOODS) {
    await admin.from('foods').upsert({
      id: food.id,
      user_id: null,
      name: food.name,
      unit_label: food.unitLabel,
      protein_g: food.proteinG,
      kcal: food.kcal,
      is_staple: true,
      sort: food.sort,
    });
  }

  const structure = buildProgramStructure();

  await admin.from('athlete_profiles').upsert({
    user_id: userId,
    version: 1,
    profile: {
      goals: ['hybrid_performance'],
      experience: 'intermediate',
      constraints: {
        daysPerWeek: 4,
        sessionMinutes: 60,
        equipment: ['barbell', 'rack', 'bench', 'pull_up_bar', 'dumbbell', 'bodyweight', 'outdoor'],
      },
      screening: { flags: [] },
      preferences: { likedMovements: [], dislikedMovements: [] },
      metricsSnapshot: {},
    },
    updated_at: new Date().toISOString(),
  });

  const existingProgram = await admin
    .from('programs')
    .select('id')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();

  let programId: string;
  if (existingProgram.data?.id) {
    programId = existingProgram.data.id;
    await admin
      .from('programs')
      .update({
        name: structure.macro.name,
        start_date: startDate,
        structure,
        active: true,
      })
      .eq('id', programId);
    await admin.from('sessions').delete().eq('program_id', programId);
  } else {
    const inserted = await admin
      .from('programs')
      .insert({
        user_id: userId,
        name: structure.macro.name,
        start_date: startDate,
        structure,
        active: true,
      })
      .select('id')
      .single();
    if (inserted.error || !inserted.data) throw inserted.error ?? new Error('Program insert failed');
    programId = inserted.data.id;
  }

  const weekSessions = buildWeekSessions(startDate, 1);
  for (const session of weekSessions) {
    await admin.from('sessions').insert({
      user_id: userId,
      program_id: programId,
      date: session.date,
      type: session.type,
      title: session.title,
      planned: session.planned,
      status: 'upcoming',
    });
  }

  const summary = {
    userId,
    email,
    programId,
    startDate,
    exercises: EXERCISE_LIBRARY.length,
    foods: STAPLE_FOODS.length,
    week1Sessions: weekSessions.length,
    mesocycle: weekSessions[0]?.mesoName,
    deloadWeeks: [4, 8, 12],
    sessionTitles: weekSessions.map((s) => `${s.date}: ${s.title}`),
  };

  return summary;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed()
    .then((summary) => {
      console.log(JSON.stringify(summary, null, 2));
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
