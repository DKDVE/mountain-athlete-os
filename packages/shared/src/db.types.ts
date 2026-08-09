// Generated from Supabase project wcwwuegdfdkfnzekifmr
// Regenerate: pnpm --filter @maos/shared gen:types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.15';
  };
  public: {
    Tables: {
      achievements: TableDef<{
        badge_key: string;
        earned_at: string;
        id: string;
        tier: string;
        user_id: string;
      }>;
      body_photos: TableDef<{
        date: string;
        id: string;
        pose: string;
        storage_ref: string;
        user_id: string;
      }>;
      checkins: TableDef<{
        date: string;
        energy: number | null;
        id: string;
        quality: number | null;
        rhr: number | null;
        sleep_h: number | null;
        soreness: Json;
        stress: number | null;
        user_id: string;
      }>;
      coach_messages: TableDef<{
        actions: Json | null;
        applied_event_id: string | null;
        content: string;
        created_at: string;
        id: string;
        role: string;
        user_id: string;
      }>;
      daily_metrics: TableDef<{
        acr: number | null;
        date: string;
        hybrid: Json | null;
        load: number | null;
        readiness: number | null;
        trek_readiness: number | null;
        user_id: string;
      }>;
      dashboards: TableDef<{
        config: Json;
        id: string;
        is_default: boolean;
        name: string;
        updated_at: string;
        user_id: string;
      }>;
      exercises: TableDef<{
        cues: Json;
        equipment: string[];
        id: string;
        media_url: string | null;
        name: string;
        pain_safe_for: string[];
        pattern: string;
        substitutions: Json;
        user_id: string | null;
      }>;
      foods: TableDef<{
        id: string;
        is_staple: boolean;
        kcal: number;
        name: string;
        protein_g: number;
        sort: number;
        unit_label: string;
        user_id: string | null;
      }>;
      goals: TableDef<{
        deadline: string | null;
        id: string;
        status: string;
        target: Json;
        type: string;
        user_id: string;
      }>;
      habit_logs: TableDef<{
        date: string;
        done: boolean;
        habit_id: string;
        id: string;
        paused: boolean;
        user_id: string;
      }>;
      habits: TableDef<{
        id: string;
        name: string;
        schedule: Json;
        sort: number;
        user_id: string;
      }>;
      meals: TableDef<{
        client_id: string | null;
        food_id: string;
        id: string;
        kcal: number;
        portions: number;
        protein_g: number;
        ts: string;
        user_id: string;
      }>;
      measurements: TableDef<{
        date: string;
        id: string;
        site: string;
        user_id: string;
        value_cm: number;
      }>;
      plan_events: TableDef<{
        diff: Json;
        id: string;
        reverted: boolean;
        source: string;
        ts: string;
        user_id: string;
      }>;
      profiles: TableDef<{
        created_at: string;
        display_name: string | null;
        flags: Json;
        id: string;
        identity_line: string | null;
        settings: Json;
        targets: Json;
        units: Json;
      }>;
      athlete_profiles: TableDef<{
        created_at: string;
        profile: Json;
        updated_at: string;
        user_id: string;
        version: number;
      }>;
      programs: TableDef<{
        active: boolean;
        created_at: string;
        id: string;
        name: string;
        start_date: string;
        structure: Json;
        user_id: string;
      }>;
      runs: TableDef<{
        avg_hr: number | null;
        cadence: number | null;
        client_id: string | null;
        created_at: string;
        date: string;
        distance_m: number | null;
        duration_s: number | null;
        elev_gain_m: number | null;
        gps_ref: string | null;
        id: string;
        max_hr: number | null;
        note: string | null;
        rpe: number | null;
        shoe_id: string | null;
        splits: Json | null;
        type: string;
        user_id: string;
        weather: Json | null;
        zones: Json | null;
      }>;
      sessions: TableDef<{
        client_id: string | null;
        created_at: string;
        date: string;
        energy: number | null;
        finished_at: string | null;
        id: string;
        note: string | null;
        planned: Json;
        program_id: string | null;
        pump: number | null;
        session_rpe: number | null;
        started_at: string | null;
        status: string;
        title: string;
        type: string;
        user_id: string;
      }>;
      set_logs: TableDef<{
        client_id: string | null;
        exercise_id: string;
        id: string;
        is_dropset: boolean;
        is_warmup: boolean;
        logged_at: string;
        note: string | null;
        pain: Json | null;
        reps: number | null;
        rpe: number | null;
        session_id: string;
        set_no: number;
        tempo: string | null;
        user_id: string;
        weight_kg: number | null;
      }>;
      shoes: TableDef<{
        id: string;
        km_limit: number;
        km_used: number;
        name: string;
        retired: boolean;
        user_id: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type DefaultSchema = Database['public'];

export type Tables<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Update'];

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
