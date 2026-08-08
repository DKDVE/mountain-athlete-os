import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, TablesUpdate } from '@maos/shared';
import {
  listOutboxOldestFirst,
  removeOutboxEntry,
  refreshOutboxCount,
  type SyncTable,
} from '@/lib/sync/outbox';

const INSERT_TABLES: SyncTable[] = ['set_logs'];

export async function flushOutbox(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ flushed: number; failed: boolean }> {
  const entries = await listOutboxOldestFirst();
  let flushed = 0;

  for (const entry of entries) {
    try {
      if (entry.op === 'insert' && INSERT_TABLES.includes(entry.table as SyncTable)) {
        const { error } = await supabase
          .from('set_logs')
          .insert({ ...entry.payload, user_id: userId });
        if (error && error.code !== '23505') {
          return { flushed, failed: true };
        }
      } else if (entry.op === 'update' && entry.table === 'sessions') {
        const { id, ...patch } = entry.payload;
        if (typeof id !== 'string') return { flushed, failed: true };
        const { error } = await supabase
          .from('sessions')
          .update(patch as TablesUpdate<'sessions'>)
          .eq('id', id)
          .eq('user_id', userId);
        if (error) return { flushed, failed: true };
      } else {
        await removeOutboxEntry(entry.clientId);
        flushed += 1;
        continue;
      }
      await removeOutboxEntry(entry.clientId);
      flushed += 1;
    } catch {
      return { flushed, failed: true };
    }
  }

  await refreshOutboxCount();
  return { flushed, failed: false };
}
