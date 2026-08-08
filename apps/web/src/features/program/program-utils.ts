import type { PlannedSession, ProgramStructure } from '@maos/shared';

export function localDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${String(y)}-${m}-${d}`;
}

export function addDaysLocal(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localDateString(d);
}

export function greetingForHour(hour = new Date().getHours()): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function isEvening(hour = new Date().getHours()): boolean {
  return hour >= 18;
}

/** ponytail: ~3 min per working set + mobility; run uses distance heuristic */
export function estimateDurationMinutes(planned: PlannedSession): number | null {
  if (planned.run?.durationS) return Math.round(planned.run.durationS / 60);
  if (planned.run?.distanceM) return Math.max(20, Math.round(planned.run.distanceM / 120));

  let workingSets = 0;
  for (const ex of planned.exercises) {
    workingSets += ex.sets.filter((s) => !s.isWarmup).length;
  }
  if (workingSets === 0 && planned.mobility.length === 0) return null;
  return Math.max(15, workingSets * 3 + planned.mobility.length * 2);
}

export function exercisePreview(planned: PlannedSession, limit = 3): string[] {
  return planned.exercises.slice(0, limit).map((ex) => ex.exerciseId.replace(/-/g, ' '));
}

export function parseProgramStructure(raw: unknown): ProgramStructure | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  if (candidate.version !== 1) return null;
  if (!candidate.macro || !Array.isArray(candidate.mesocycles)) return null;
  return raw as ProgramStructure;
}
