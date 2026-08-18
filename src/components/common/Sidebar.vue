<template>
  <aside class="hidden md:flex flex-col w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-4 min-h-[calc(100vh-3.5rem)]">
    <!-- Quick Add Button -->
    <button
      @click="$emit('open-add')"
      class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium shadow-md shadow-indigo-500/25 active:scale-98 transition-all mb-6"
    >
      <Plus class="w-5 h-5 stroke-[2.5]" />
      <span>New Task</span>
    </button>

    <!-- Main Navigation Links -->
    <div class="space-y-1.5 mb-8">
      <router-link
        to="/dashboard"
        class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        :class="isActive('/dashboard') ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
      >
        <div class="flex items-center gap-3">
          <Clock class="w-4 h-4" />
          <span>Today</span>
        </div>
        <span v-if="todayPendingCount > 0" class="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
          {{ todayPendingCount }}
        </span>
      </router-link>

      <router-link
        to="/calendar"
        class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        :class="isActive('/calendar') ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
      >
        <CalendarDays class="w-4 h-4" />
        <span>Calendar</span>
      </router-link>

      <router-link
        to="/tasks"
        class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        :class="isActive('/tasks') ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
      >
        <div class="flex items-center gap-3">
          <CheckSquare class="w-4 h-4" />
          <span>All Tasks</span>
        </div>
        <span v-if="overdueCount > 0" class="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
          {{ overdueCount }} overdue
        </span>
      </router-link>

      <router-link
        to="/categories"
        class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        :class="isActive('/categories') ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
      >
        <Folder class="w-4 h-4" />
        <span>Categories</span>
      </router-link>
    </div>

    <!-- Family / Category Shortcuts -->
    <div class="mb-auto">
      <div class="flex items-center justify-between px-3 mb-2">
        <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Categories
        </span>
        <router-link to="/categories" class="text-xs text-indigo-600 hover:underline">Manage</router-link>
      </div>
      <div class="space-y-1">
        <button
          v-for="cat in categoryStore.categories.slice(0, 6)"
          :key="cat.id"
          @click="selectCategoryFilter(cat.id)"
          class="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
        >
          <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: cat.color }"></span>
          <span class="truncate">{{ cat.name }}</span>
        </button>
      </div>
    </div>

    <!-- Bottom Settings & Profile Link -->
    <div class="pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
      <router-link
        to="/settings"
        class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        :class="isActive('/settings') ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
      >
        <Settings class="w-4 h-4" />
        <span>Settings</span>
      </router-link>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Clock, CalendarDays, CheckSquare, Folder, Settings, Plus } from 'lucide-vue-next';
import { useTaskStore } from '@/stores/task.store';
import { useCategoryStore } from '@/stores/category.store';

defineEmits<{
  (e: 'open-add'): void;
}>();

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const categoryStore = useCategoryStore();

const isActive = (path: string) => {
  if (path === '/dashboard' && route.path === '/') return true;
  return route.path.startsWith(path);
};

const todayPendingCount = computed(() => {
  return taskStore.todayTasks.filter((t) => t.status === 'pending').length;
});

const overdueCount = computed(() => {
  return taskStore.overdueTasks.length;
});

function selectCategoryFilter(catId: string) {
  taskStore.selectedCategoryId = catId;
  taskStore.filter = 'all';
  router.push('/tasks');
}
</script>
