import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { taskRepository } from '@/db/task.repository';
import { syncService } from '@/services/sync.service';
import { supabase, isSupabaseConfigured } from '@/services/supabase.service';
import { googleCalendarService } from '@/services/google-calendar.service';
import { useAuthStore } from './auth.store';
import { getTodayDateString, getCurrentTimeString, isTaskOverdue } from '@/utils/date';
import type { Task, TaskCreateInput, TaskUpdateInput, TaskFilterType, TaskSortOption } from '@/types/task';

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([]);
  const loading = ref<boolean>(false);
  const filter = ref<TaskFilterType>('all');
  const selectedCategoryId = ref<string | null>(null);
  const searchQuery = ref<string>('');
  const sortBy = ref<TaskSortOption>('time');

  const authStore = useAuthStore();

  // Filtered & Sorted Tasks
  const filteredTasks = computed(() => {
    const today = getTodayDateString();
    const query = searchQuery.value.toLowerCase().trim();

    const filtered = tasks.value.filter((task) => {
      // Category filter
      if (selectedCategoryId.value && task.category_id !== selectedCategoryId.value) {
        return false;
      }

      // Search query
      if (query) {
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchDesc = task.description?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }

      // Filter types
      switch (filter.value) {
        case 'today':
          return task.task_date === today && task.status !== 'completed';
        case 'upcoming':
          return task.task_date > today && task.status !== 'completed';
        case 'overdue':
          return isTaskOverdue(task.task_date, task.start_time, task.status === 'completed');
        case 'completed':
          return task.status === 'completed';
        case 'all':
        default:
          return true;
      }
    });

    return taskRepository.sortTasks(filtered, sortBy.value);
  });

  // Specific groups
  const todayTasks = computed(() => {
    const today = getTodayDateString();
    const list = tasks.value.filter((t) => t.task_date === today && !t.is_deleted);
    return taskRepository.sortTasks(list, 'time');
  });

  const overdueTasks = computed(() => {
    const list = tasks.value.filter((t) =>
      !t.is_deleted && isTaskOverdue(t.task_date, t.start_time, t.status === 'completed')
    );
    return taskRepository.sortTasks(list, 'time');
  });

  const upcomingTasks = computed(() => {
    const today = getTodayDateString();
    const list = tasks.value.filter((t) => !t.is_deleted && t.task_date > today && t.status !== 'completed');
    return taskRepository.sortTasks(list, 'time');
  });

  const completedTodayCount = computed(() => {
    const today = getTodayDateString();
    return tasks.value.filter((t) => t.task_date === today && t.status === 'completed').length;
  });

  // Next scheduled task for today
  const nextScheduledTask = computed(() => {
    const currentTime = getCurrentTimeString();

    // First look for today's pending tasks with start_time >= current time
    const upcomingToday = todayTasks.value
      .filter((t) => t.status === 'pending' && t.start_time && t.start_time >= currentTime);

    if (upcomingToday.length > 0) {
      return upcomingToday[0];
    }

    // Fallback to any pending task today
    const pendingToday = todayTasks.value.filter((t) => t.status === 'pending');
    if (pendingToday.length > 0) return pendingToday[0];

    // Fallback to first upcoming task
    if (upcomingTasks.value.length > 0) return upcomingTasks.value[0];

    return null;
  });

  async function loadTasks() {
    loading.value = true;
    try {
      tasks.value = await taskRepository.getAll(authStore.currentUserId);
    } finally {
      loading.value = false;
    }
  }

  async function addTask(input: TaskCreateInput): Promise<Task> {
    const activeUserId = authStore.user?.id || authStore.currentUserId;
    let task = await taskRepository.create(input, activeUserId);
    tasks.value.push(task);

    // Immediate Google Calendar push if external_provider is 'google' and account is connected
    if (task.external_provider === 'google') {
      const account = googleCalendarService.getSavedAccount();
      if (account && googleCalendarService.isTokenValid(account)) {
        try {
          const calId = task.external_calendar_id || googleCalendarService.getSelectedCalendarId();
          const eventPayload = googleCalendarService.taskToGoogleEventInput(task);
          const createdGoogleEvent = await googleCalendarService.createEvent(account.accessToken, calId, eventPayload);

          const updated = await taskRepository.update(task.id, {
            external_provider: 'google',
            external_calendar_id: calId,
            external_event_id: createdGoogleEvent.id,
            external_event_link: createdGoogleEvent.htmlLink || null,
            external_synced_at: new Date().toISOString(),
          });
          if (updated) {
            task = updated;
            const idx = tasks.value.findIndex((t) => t.id === task.id);
            if (idx !== -1) {
              tasks.value[idx] = updated;
            }
          }
        } catch (err: any) {
          console.warn('Immediate Google Calendar task export failed:', err);
        }
      }
    }

    // Direct Supabase upsert if authenticated and online
    if (authStore.user?.id && isSupabaseConfigured && supabase && navigator.onLine) {
      try {
        const payload = {
          id: task.id,
          user_id: authStore.user.id,
          category_id: task.category_id || null,
          title: task.title,
          description: task.description || null,
          task_date: task.task_date,
          start_time: task.start_time || null,
          end_time: task.end_time || null,
          is_all_day: task.is_all_day,
          priority: task.priority,
          status: task.status,
          external_provider: task.external_provider || null,
          external_calendar_id: task.external_calendar_id || null,
          external_event_id: task.external_event_id || null,
          external_event_link: task.external_event_link || null,
          external_synced_at: task.external_synced_at || null,
          is_deleted: false,
          created_at: task.created_at,
          updated_at: task.updated_at,
        };
        const { error } = await supabase.from('tasks').upsert(payload);
        if (error) {
          console.warn('Direct task upsert failed, enqueued for background sync:', error);
          await syncService.enqueue('tasks', 'create', task.id, task);
        }
      } catch {
        await syncService.enqueue('tasks', 'create', task.id, task);
      }
    } else {
      // Sync enqueue
      await syncService.enqueue('tasks', 'create', task.id, task);
    }

    return task;
  }

  async function updateTask(id: string, updates: TaskUpdateInput): Promise<void> {
    let updated = await taskRepository.update(id, updates);
    if (updated) {
      const idx = tasks.value.findIndex((t) => t.id === id);
      if (idx !== -1) {
        tasks.value[idx] = updated;
      }

      // Immediate Google Calendar push/update
      if (updated.external_provider === 'google') {
        const account = googleCalendarService.getSavedAccount();
        if (account && googleCalendarService.isTokenValid(account)) {
          try {
            const calId = updated.external_calendar_id || googleCalendarService.getSelectedCalendarId();
            const eventPayload = googleCalendarService.taskToGoogleEventInput(updated);
            if (updated.external_event_id) {
              await googleCalendarService.updateEvent(
                account.accessToken,
                calId,
                updated.external_event_id,
                eventPayload
              );
              await taskRepository.update(id, { external_synced_at: new Date().toISOString() });
            } else {
              const createdGoogleEvent = await googleCalendarService.createEvent(
                account.accessToken,
                calId,
                eventPayload
              );
              const synced = await taskRepository.update(id, {
                external_event_id: createdGoogleEvent.id,
                external_event_link: createdGoogleEvent.htmlLink || null,
                external_synced_at: new Date().toISOString(),
              });
              if (synced) {
                updated = synced;
                if (idx !== -1) tasks.value[idx] = synced;
              }
            }
          } catch (err: any) {
            console.warn('Immediate Google Calendar task update failed:', err);
          }
        }
      }

      if (authStore.user?.id && isSupabaseConfigured && supabase && navigator.onLine) {
        try {
          const payload = {
            id: updated.id,
            user_id: authStore.user.id,
            category_id: updated.category_id || null,
            title: updated.title,
            description: updated.description || null,
            task_date: updated.task_date,
            start_time: updated.start_time || null,
            end_time: updated.end_time || null,
            is_all_day: updated.is_all_day,
            priority: updated.priority,
            status: updated.status,
            external_provider: updated.external_provider || null,
            external_calendar_id: updated.external_calendar_id || null,
            external_event_id: updated.external_event_id || null,
            external_event_link: updated.external_event_link || null,
            external_synced_at: updated.external_synced_at || null,
            is_deleted: updated.is_deleted ?? false,
            created_at: updated.created_at,
            updated_at: updated.updated_at,
            completed_at: updated.completed_at || null,
          };
          const { error } = await supabase.from('tasks').upsert(payload);
          if (error) {
            await syncService.enqueue('tasks', 'update', id, updated);
          }
        } catch {
          await syncService.enqueue('tasks', 'update', id, updated);
        }
      } else {
        await syncService.enqueue('tasks', 'update', id, updated);
      }
    }
  }

  async function toggleTask(id: string): Promise<void> {
    const updated = await taskRepository.toggleComplete(id);
    if (updated) {
      const idx = tasks.value.findIndex((t) => t.id === id);
      if (idx !== -1) {
        tasks.value[idx] = updated;
      }

      if (authStore.user?.id && isSupabaseConfigured && supabase && navigator.onLine) {
        try {
          const { error } = await supabase.from('tasks').update({
            status: updated.status,
            completed_at: updated.completed_at || null,
            updated_at: updated.updated_at,
          }).eq('id', id);

          if (error) {
            await syncService.enqueue('tasks', 'update', id, updated);
          }
        } catch {
          await syncService.enqueue('tasks', 'update', id, updated);
        }
      } else {
        await syncService.enqueue('tasks', 'update', id, updated);
      }
    }
  }

  async function deleteTask(id: string): Promise<void> {
    const existing = tasks.value.find((t) => t.id === id);
    if (existing?.external_event_id && existing.external_provider === 'google') {
      const account = googleCalendarService.getSavedAccount();
      if (account && googleCalendarService.isTokenValid(account)) {
        try {
          const calId = existing.external_calendar_id || googleCalendarService.getSelectedCalendarId();
          await googleCalendarService.deleteEvent(account.accessToken, calId, existing.external_event_id);
        } catch (err: any) {
          console.warn('Immediate Google Calendar task deletion failed:', err);
        }
      }
    }

    await taskRepository.delete(id);
    tasks.value = tasks.value.filter((t) => t.id !== id);

    if (authStore.user?.id && isSupabaseConfigured && supabase && navigator.onLine) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) {
          await syncService.enqueue('tasks', 'delete', id, {});
        }
      } catch {
        await syncService.enqueue('tasks', 'delete', id, {});
      }
    } else {
      await syncService.enqueue('tasks', 'delete', id, {});
    }
  }

  return {
    tasks,
    loading,
    filter,
    selectedCategoryId,
    searchQuery,
    sortBy,
    filteredTasks,
    todayTasks,
    overdueTasks,
    upcomingTasks,
    completedTodayCount,
    nextScheduledTask,
    loadTasks,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  };
});
