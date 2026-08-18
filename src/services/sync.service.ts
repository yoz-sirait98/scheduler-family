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
   * Migrate unassigned local tasks and categories to an authenticated user ID
   */
  async migrateLocalDataToUser(userId: string): Promise<void> {
    if (!userId || userId === 'local-user' || userId === 'guest-family-user') return;

    // Migrate local tasks
    const unassignedTasks = await db.tasks.filter((t) => !t.user_id || t.user_id === 'local-user' || t.user_id === 'guest-family-user').toArray();
    for (const task of unassignedTasks) {
      task.user_id = userId;
      await db.tasks.put(task);
      await this.enqueue('tasks', 'create', task.id, task);
    }

    // Migrate local categories
    const unassignedCategories = await db.categories.filter((c) => !c.user_id || c.user_id === 'local-user' || c.user_id === 'guest-family-user').toArray();
    for (const cat of unassignedCategories) {
      cat.user_id = userId;
      await db.categories.put(cat);
      if (!cat.is_default) {
        await this.enqueue('categories', 'create', cat.id, cat);
      }
    }
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
      // 1. Resolve current user ID from Supabase session if not passed
      let activeUserId = userId;
      if (!activeUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeUserId = sessionData?.session?.user?.id;
      }

      // 2. Process sync queue (Push)
      if (activeUserId) {
        await this.processQueue(activeUserId);
        // 3. Pull remote changes (Pull)
        await this.pullRemoteChanges(activeUserId);
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
  private async processQueue(activeUserId: string): Promise<void> {
    if (!supabase || !activeUserId) return;

    const queueItems = await db.syncQueue.orderBy('timestamp').toArray();

    for (const item of queueItems) {
      try {
        if (item.action === 'create' || item.action === 'update') {
          // Clean payload of transient fields and sanitize data types
          const cleanPayload = { ...item.payload };
          delete cleanPayload.category;
          delete cleanPayload.reminders;
          delete cleanPayload.sync_status;

          // Enforce valid user_id
          cleanPayload.user_id = activeUserId;

          // Sanitize category_id (must be UUID or null)
          if (!cleanPayload.category_id || cleanPayload.category_id.startsWith('default-cat') || cleanPayload.category_id === '') {
            cleanPayload.category_id = null;
          }

          // Sanitize time fields (empty string is not valid TIME in PostgreSQL)
          if (!cleanPayload.start_time || cleanPayload.start_time === '') {
            cleanPayload.start_time = null;
          }
          if (!cleanPayload.end_time || cleanPayload.end_time === '') {
            cleanPayload.end_time = null;
          }
          if (!cleanPayload.description || cleanPayload.description === '') {
            cleanPayload.description = null;
          }
          if (!cleanPayload.completed_at || cleanPayload.completed_at === '') {
            cleanPayload.completed_at = null;
          }

          const { error } = await supabase
            .from(item.entity)
            .upsert(cleanPayload);

          if (error) {
            console.error(`Supabase sync error on ${item.entity}:`, error);
            throw error;
          }
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
        if (item.retries > 5) break;
      }
    }
  }

  /**
   * Pulls remote changes from Supabase and applies Last-Write-Wins to Dexie
   */
  private async pullRemoteChanges(userId: string): Promise<void> {
    if (!supabase || !userId) return;

    // Pull tasks
    const { data: remoteTasks, error: taskErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    if (taskErr) {
      console.warn('Error pulling remote tasks:', taskErr);
    } else if (remoteTasks && remoteTasks.length > 0) {
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

    if (catErr) {
      console.warn('Error pulling remote categories:', catErr);
    } else if (remoteCategories && remoteCategories.length > 0) {
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
