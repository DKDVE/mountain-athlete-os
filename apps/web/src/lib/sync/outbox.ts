import { ulid } from '@maos/shared';
import { maosDb } from '@/lib/db';
import { useConnectivityStore } from '@/stores/connectivity-store';

export type SyncTable = 'set_logs' | 'sessions';

export async function refreshOutboxCount() {
  const count = await maosDb.outbox.count();
  useConnectivityStore.getState().setOutboxCount(count);
}

export async function enqueueInsert(table: SyncTable, payload: Record<string, unknown>) {
  const clientId = (payload.client_id as string | undefined) ?? ulid();
  const row = {
    clientId,
    table,
    op: 'insert' as const,
    payload: { ...payload, client_id: clientId },
    ts: Date.now(),
  };
  await maosDb.outbox.put(row);
  await refreshOutboxCount();
  return clientId;
}

export async function enqueueUpdate(table: 'sessions', payload: Record<string, unknown>) {
  const clientId = ulid();
  const row = {
    clientId,
    table,
    op: 'update' as const,
    payload,
    ts: Date.now(),
  };
  await maosDb.outbox.put(row);
  await refreshOutboxCount();
  return clientId;
}

export async function listOutboxOldestFirst() {
  return maosDb.outbox.orderBy('ts').toArray();
}

export async function removeOutboxEntry(clientId: string) {
  await maosDb.outbox.delete(clientId);
  await refreshOutboxCount();
}
