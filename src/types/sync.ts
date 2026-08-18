export type SyncAction = 'create' | 'update' | 'delete';
export type SyncEntity = 'tasks' | 'categories' | 'task_reminders' | 'task_recurrences';

export interface SyncQueueItem {
  id: string; // UUID
  entity: SyncEntity;
  action: SyncAction;
  record_id: string;
  payload: any;
  timestamp: string; // ISO string
  retries: number;
  last_error?: string | null;
}

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error' | 'success';

export interface SyncStatus {
  state: SyncState;
  lastSyncedAt: string | null;
  pendingCount: number;
  errorMessage?: string | null;
}
