<template>
  <div class="space-y-4 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Tasks & To-Dos
        </h1>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Manage, search, and filter personal & family tasks
        </p>
      </div>

      <button
        @click="$emit('open-add')"
        class="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 shrink-0"
      >
        <Plus class="w-4 h-4 stroke-[2.5]" />
        <span>New Task</span>
      </button>
    </div>

    <!-- Search Bar & Sort Dropdown -->
    <div class="flex flex-col sm:flex-row items-center gap-2">
      <!-- Search -->
      <div class="relative w-full flex-1">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="taskStore.searchQuery"
          type="text"
          placeholder="Search tasks by title or notes..."
          class="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-2xs font-medium"
        />
        <button
          v-if="taskStore.searchQuery"
          @click="taskStore.searchQuery = ''"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Sort Option -->
      <div class="flex items-center gap-1.5 self-end sm:self-auto shrink-0 w-full sm:w-auto">
        <ArrowDownUp class="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        <select
          v-model="taskStore.sortBy"
          class="w-full sm:w-auto px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="time">Sort by Date & Time</option>
          <option value="priority">Sort by Priority (Urgent first)</option>
          <option value="created">Sort by Recently Created</option>
          <option value="title">Sort by Title (A-Z)</option>
        </select>
      </div>
    </div>

    <!-- Filter Status Tabs -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      <button
        v-for="tab in filterTabs"
        :key="tab.value"
        @click="taskStore.filter = tab.value"
        class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0"
        :class="taskStore.filter === tab.value
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Category Filter Chips -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      <button
        @click="taskStore.selectedCategoryId = null"
        class="px-3 py-1 rounded-full text-xs font-semibold border transition-all shrink-0"
        :class="!taskStore.selectedCategoryId
          ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'"
      >
        All Categories
      </button>

      <button
        v-for="cat in categoryStore.categories"
        :key="cat.id"
        @click="taskStore.selectedCategoryId = taskStore.selectedCategoryId === cat.id ? null : cat.id"
        class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all shrink-0"
        :class="taskStore.selectedCategoryId === cat.id
          ? 'ring-2 ring-indigo-500 font-bold'
          : 'opacity-70 hover:opacity-100'"
        :style="{
          backgroundColor: `${cat.color}15`,
          color: cat.color,
          borderColor: cat.color
        }"
      >
        <CategoryIcon :name="cat.icon" size="sm" />
        <span>{{ cat.name }}</span>
      </button>
    </div>

    <!-- Task List -->
    <div>
      <EmptyState
        v-if="taskStore.filteredTasks.length === 0"
        title="No tasks found"
        description="Try adjusting your search query or filter, or create a new task."
      >
        <template #action>
          <button
            @click="$emit('open-add')"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
          >
            + Create New Task
          </button>
        </template>
      </EmptyState>

      <div v-else class="space-y-2">
        <TaskCard
          v-for="task in taskStore.filteredTasks"
          :key="task.id"
          :task="task"
          @select="selectedTask = $event"
          @toggle="taskStore.toggleTask"
        />
      </div>
    </div>

    <!-- Task Detail Modal -->
    <TaskDetailModal
      :task="selectedTask"
      @close="selectedTask = null"
      @edit="handleEdit"
      @toggle="taskStore.toggleTask"
      @delete="taskStore.deleteTask"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Plus, Search, X, ArrowDownUp } from 'lucide-vue-next';
import TaskCard from '@/components/tasks/TaskCard.vue';
import TaskDetailModal from '@/components/tasks/TaskDetailModal.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import CategoryIcon from '@/components/common/CategoryIcon.vue';
import { useTaskStore } from '@/stores/task.store';
import { useCategoryStore } from '@/stores/category.store';
import type { Task, TaskFilterType } from '@/types/task';

const emit = defineEmits<{
  (e: 'open-add', options?: { task?: Task; date?: string; time?: string }): void;
}>();

const taskStore = useTaskStore();
const categoryStore = useCategoryStore();
const selectedTask = ref<Task | null>(null);

const filterTabs: { label: string; value: TaskFilterType }[] = [
  { label: 'All Tasks', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Completed', value: 'completed' },
];

function handleEdit(task: Task) {
  selectedTask.value = null;
  emit('open-add', { task });
}
</script>
