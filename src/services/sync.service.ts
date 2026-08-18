import { db } from '@/db/database';
import { supabase, isSupabaseConfigured } from './supabase.service';
import type { SyncQueueItem, SyncEntity, SyncAction, SyncStatus } from '@/types/sync';
import type { Task } from '@/types/task';
import type { Category } from '@/types/category';

class SyncService {
  private isSyncing = false;
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();
  private currentStatus: SyncStatus = {
    state: 'idle',
    lastSyncedAt: null,
    pendingCount: 0,
    errorMessage: null,
  };

  constructor() {
    this.loadLastSyncTime();
    // Listen for online events to automatically trigger sync
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.triggerSync();
      });
    }
  }

  private async loadLastSyncTime(): Promise<void> {
    const setting = await db.settings.get('lastSyncedAt');
    if (setting) {
      this.currentStatus.lastSyncedAt = setting.value;
    }
    await this.updatePendingCount();
  }

  public getStatus(): SyncStatus {
    return { ...this.currentStatus };
  }

  public onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.getStatus());
    return () => this.statusListeners.delete(callback);
  }

  private emitStatus(updates: Partial<SyncStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...updates };
    this.statusListeners.forEach((cb) => cb(this.getStatus()));
  }

  public async updatePendingCount(): Promise<number> {
    const count = await db.syncQueue.count();
    this.emitStatus({ pendingCount: count });
    return count;
  }

  /**
   * Enqueue a local mutation for sync
   */
  async enqueue(entity: SyncEntity, action: SyncAction, recordId: string, payload: any): Promise<void> {
    const item: SyncQueueItem = {
      id: crypto.randomUUID(),
      entity,
      action,
      record_id: recordId,
      payload,
      timestamp: new Date().toISOString(),
      retries: 0,
    };

    await db.syncQueue.add(item);
    await this.updatePendingCount();

    // If online and configured, attempt sync immediately
    if (navigator.onLine && isSupabaseConfigured) {
      this.triggerSync();
    }
  }

  /**
   * Main sync function: push local queue then pull remote changes
   */
  async triggerSync(userId?: string): Promise<boolean> {
    if (this.isSyncing) return false;
    if (!navigator.onLine) {
      this.emitStatus({ state: 'offline' });
      return false;
    }
    if (!isSupabaseConfigured || !supabase) {
      this.emitStatus({ state: 'idle' });
      return false;
    }

    this.isSyncing = true;
    this.emitStatus({ state: 'syncing', errorMessage: null });

    try {
      // 1. Process sync queue (Push)
      await this.processQueue();

      // 2. Pull remote changes (Pull)
      if (userId) {
        await this.pullRemoteChanges(userId);
      }

      const now = new Date().toISOString();
      await db.settings.put({ key: 'lastSyncedAt', value: now });

      this.emitStatus({
        state: 'success',
        lastSyncedAt: now,
        errorMessage: null,
      });
      await this.updatePendingCount();
      return true;
    } catch (err: any) {
      console.error('Sync failed:', err);
      this.emitStatus({
        state: 'error',
        errorMessage: err.message || 'Synchronization failed',
      });
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pushes each queue item to Supabase
   */
  private async processQueue(): Promise<void> {
    if (!supabase) return;

    const queueItems = await db.syncQueue.orderBy('timestamp').toArray();

    for (const item of queueItems) {
      try {
        if (item.action === 'create' || item.action === 'update') {
          // Clean payload of transient fields
          const cleanPayload = { ...item.payload };
          delete cleanPayload.category;
          delete cleanPayload.reminders;
          delete cleanPayload.sync_status;

          const { error } = await supabase
            .from(item.entity)
            .upsert(cleanPayload);

          if (error) throw error;
        } else if (item.action === 'delete') {
          const { error } = await supabase
            .from(item.entity)
            .delete()
            .eq('id', item.record_id);

          if (error) throw error;
        }

        // Successfully synced item, remove from queue
        await db.syncQueue.delete(item.id);
      } catch (e: any) {
        console.warn(`Sync item failed (ID: ${item.id}):`, e);
        item.retries += 1;
        item.last_error = e.message;
        await db.syncQueue.put(item);
        // If 5+ retries failed, log and stop loop to avoid spam
        if (item.retries > 5) break;
      }
    }
  }

  /**
   * Pulls remote changes from Supabase and applies Last-Write-Wins to Dexie
   */
  private async pullRemoteChanges(userId: string): Promise<void> {
    if (!supabase) return;

    // Pull tasks
    const { data: remoteTasks, error: taskErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    if (taskErr) throw taskErr;

    if (remoteTasks && remoteTasks.length > 0) {
      for (const remote of remoteTasks as Task[]) {
        const local = await db.tasks.get(remote.id);
        if (!local || new Date(remote.updated_at) >= new Date(local.updated_at)) {
          await db.tasks.put(remote);
        }
      }
    }

    // Pull categories
    const { data: remoteCategories, error: catErr } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (catErr) throw catErr;

    if (remoteCategories && remoteCategories.length > 0) {
      for (const remote of remoteCategories as Category[]) {
        const local = await db.categories.get(remote.id);
        if (!local || new Date(remote.updated_at) >= new Date(local.updated_at)) {
          await db.categories.put(remote);
        }
      }
    }
  }
}

export const syncService = new SyncService();
