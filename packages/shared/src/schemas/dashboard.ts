import { z } from 'zod';

export const WIDGET_TYPES = [
  'stat_card',
  'line_trend',
  'bars_vs_target',
  'ring',
  'segmented_ring',
  'zone_bar',
  'heatmap',
  'table',
  'combo_load_readiness',
  'radar_hybrid',
  'gauge',
  'streak',
  'coach_tip',
  'photo_slider',
] as const;

export const DATA_SOURCES = [
  'weight',
  'waist',
  'bodyfat',
  'protein_daily',
  'kcal_daily',
  'sleep',
  'rhr',
  'readiness',
  'weekly_load',
  'acr',
  'est_1rm',
  'z2_pace',
  'run_volume',
  'zone_distribution',
  'hybrid_score',
  'trek_readiness',
  'consistency',
  'streak_mobility',
  'pr_list',
  'habit_week',
] as const;

export const WidgetInstance = z.object({
  id: z.string(),
  type: z.enum(WIDGET_TYPES),
  dataSource: z.enum(DATA_SOURCES).nullable(),
  title: z.string(),
  options: z.record(z.string(), z.unknown()).default({}),
  grid: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
});

export const DashboardConfig = z.object({
  version: z.literal(1),
  widgets: z.array(WidgetInstance).max(24),
});

export type WidgetInstance = z.infer<typeof WidgetInstance>;
export type DashboardConfig = z.infer<typeof DashboardConfig>;
