import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { taskRepository } from '@/db/task.repository';
import { syncService } from '@/services/sync.service';
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
    const task = await taskRepository.create(input, authStore.currentUserId);
    tasks.value.push(task);

    // Sync enqueue
    await syncService.enqueue('tasks', 'create', task.id, task);
    return task;
  }

  async function updateTask(id: string, updates: TaskUpdateInput): Promise<void> {
    const updated = await taskRepository.update(id, updates);
    if (updated) {
      const idx = tasks.value.findIndex((t) => t.id === id);
      if (idx !== -1) {
        tasks.value[idx] = updated;
      }
      await syncService.enqueue('tasks', 'update', id, updated);
    }
  }

  async function toggleTask(id: string): Promise<void> {
    const updated = await taskRepository.toggleComplete(id);
    if (updated) {
      const idx = tasks.value.findIndex((t) => t.id === id);
      if (idx !== -1) {
        tasks.value[idx] = updated;
      }
      await syncService.enqueue('tasks', 'update', id, updated);
    }
  }

  async function deleteTask(id: string): Promise<void> {
    await taskRepository.delete(id);
    tasks.value = tasks.value.filter((t) => t.id !== id);
    await syncService.enqueue('tasks', 'delete', id, {});
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
