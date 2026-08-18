<template>
  <div class="space-y-6">
    <div v-if="groupedTasks.length === 0" class="p-8 text-center text-sm text-slate-400 border border-dashed rounded-2xl">
      No tasks scheduled in the upcoming agenda
    </div>

    <div
      v-for="group in groupedTasks"
      :key="group.date"
      class="space-y-2.5"
    >
      <!-- Date Header -->
      <div class="sticky top-14 z-10 py-1.5 px-3 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-between">
        <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar class="w-3.5 h-3.5 text-indigo-500" />
          <span>{{ group.formattedDate }}</span>
        </h4>
        <span class="text-[11px] font-medium text-slate-500">
          {{ group.tasks.length }} task{{ group.tasks.length > 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Task Items -->
      <div class="space-y-2">
        <TaskCard
          v-for="task in group.tasks"
          :key="task.id"
          :task="task"
          @select="$emit('select-task', $event)"
          @toggle="$emit('toggle-task', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Calendar } from 'lucide-vue-next';
import TaskCard from '@/components/tasks/TaskCard.vue';
import { formatDateLong } from '@/utils/date';
import type { Task } from '@/types/task';

const props = defineProps<{
  tasks: Task[];
}>();

defineEmits<{
  (e: 'select-task', task: Task): void;
  (e: 'toggle-task', taskId: string): void;
}>();

interface TaskGroup {
  date: string;
  formattedDate: string;
  tasks: Task[];
}

const groupedTasks = computed<TaskGroup[]>(() => {
  const groupsMap = new Map<string, Task[]>();

  // Sort tasks by date & time
  const sorted = [...props.tasks].sort((a, b) => a.task_date.localeCompare(b.task_date));

  for (const task of sorted) {
    if (!groupsMap.has(task.task_date)) {
      groupsMap.set(task.task_date, []);
    }
    groupsMap.get(task.task_date)!.push(task);
  }

  const result: TaskGroup[] = [];
  for (const [date, tasksList] of groupsMap.entries()) {
    result.push({
      date,
      formattedDate: formatDateLong(date),
      tasks: tasksList,
    });
  }

  return result;
});
</script>
