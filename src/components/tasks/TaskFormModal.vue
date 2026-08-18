<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
    <!-- Backdrop dismiss -->
    <div class="fixed inset-0" @click="handleClose"></div>

    <!-- Modal Content -->
    <div
      class="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 z-10 max-h-[90vh] overflow-y-auto transform transition-all pb-[env(safe-area-inset-bottom,20px)]"
    >
      <!-- Sheet Handle for Mobile Drag Affordance -->
      <div class="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4"></div>

      <!-- Header -->
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarPlus class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>{{ editingTask ? 'Edit Task' : 'Quick Add Task' }}</span>
        </h3>
        <button
          @click="handleClose"
          class="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Title Input -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
            Task Title *
          </label>
          <input
            v-model="form.title"
            type="text"
            required
            placeholder="e.g. Meeting HR, Buy milk, Dentist"
            class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm transition-all"
            autofocus
          />
        </div>

        <!-- Description (Optional) -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
            Description / Notes
          </label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Additional notes, links, or instructions..."
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-all resize-none"
          ></textarea>
        </div>

        <!-- Date & Time Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Date -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
              Date *
            </label>
            <input
              v-model="form.task_date"
              type="date"
              required
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <!-- All Day Toggle -->
          <div class="flex items-center justify-between sm:justify-center gap-3 pt-2 sm:pt-6">
            <span class="text-xs font-medium text-slate-700 dark:text-slate-300">All Day Task</span>
            <button
              type="button"
              @click="form.is_all_day = !form.is_all_day"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="form.is_all_day ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="form.is_all_day ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>
        </div>

        <!-- Start & End Time (if not all day) -->
        <div v-if="!form.is_all_day" class="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
          <div>
            <label class="block text-xs font-semibold text-indigo-950 dark:text-indigo-200 mb-1">
              Start Time
            </label>
            <input
              v-model="form.start_time"
              type="time"
              class="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-indigo-950 dark:text-indigo-200 mb-1">
              End Time (Optional)
            </label>
            <input
              v-model="form.end_time"
              type="time"
              class="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <!-- Category Picker -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Category
          </label>
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              @click="form.category_id = null"
              class="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all shrink-0"
              :class="!form.category_id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'"
            >
              No Category
            </button>
            <button
              v-for="cat in categoryStore.categories"
              :key="cat.id"
              type="button"
              @click="form.category_id = cat.id"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all shrink-0"
              :class="form.category_id === cat.id
                ? 'ring-2 ring-indigo-500 font-semibold'
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
        </div>

        <!-- Priority Selector -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Priority
          </label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="p in priorityOptions"
              :key="p.value"
              type="button"
              @click="form.priority = p.value"
              class="py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all"
              :class="form.priority === p.value ? p.activeClass : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <!-- Reminder Selector -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Bell class="w-3.5 h-3.5 text-indigo-500" />
            <span>Reminder & Alarm</span>
          </label>
          <select
            v-model="reminderMinutes"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option :value="-1">No Reminder</option>
            <option :value="0">At time of task</option>
            <option :value="5">5 minutes before</option>
            <option :value="10">10 minutes before</option>
            <option :value="15">15 minutes before</option>
            <option :value="30">30 minutes before</option>
            <option :value="60">1 hour before</option>
            <option :value="1440">1 day before</option>
          </select>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3 pt-3">
          <button
            type="button"
            @click="handleClose"
            class="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-md shadow-indigo-500/25 active:scale-98 transition-all"
          >
            {{ editingTask ? 'Save Changes' : 'Create Task' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, ref } from 'vue';
import { CalendarPlus, X, Bell } from 'lucide-vue-next';
import CategoryIcon from '@/components/common/CategoryIcon.vue';
import { useCategoryStore } from '@/stores/category.store';
import { getTodayDateString } from '@/utils/date';
import type { Task, TaskCreateInput, TaskPriority } from '@/types/task';

const props = defineProps<{
  isOpen: boolean;
  editingTask?: Task | null;
  defaultDate?: string;
  defaultTime?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: TaskCreateInput): void;
}>();

const categoryStore = useCategoryStore();

const priorityOptions: { label: string; value: TaskPriority; activeClass: string }[] = [
  { label: 'Low', value: 'low', activeClass: 'bg-slate-200 dark:bg-slate-700 border-slate-400 text-slate-900 dark:text-white font-semibold' },
  { label: 'Med', value: 'medium', activeClass: 'bg-indigo-100 dark:bg-indigo-900/60 border-indigo-400 text-indigo-900 dark:text-indigo-200 font-semibold' },
  { label: 'High', value: 'high', activeClass: 'bg-amber-100 dark:bg-amber-900/60 border-amber-400 text-amber-900 dark:text-amber-200 font-semibold' },
  { label: 'Urgent', value: 'urgent', activeClass: 'bg-rose-100 dark:bg-rose-900/60 border-rose-400 text-rose-900 dark:text-rose-200 font-semibold' },
];

const reminderMinutes = ref<number>(15);

const form = reactive({
  title: '',
  description: '',
  task_date: getTodayDateString(),
  start_time: '10:00',
  end_time: '',
  is_all_day: false,
  priority: 'medium' as TaskPriority,
  category_id: null as string | null,
});

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.editingTask) {
        form.title = props.editingTask.title;
        form.description = props.editingTask.description || '';
        form.task_date = props.editingTask.task_date;
        form.start_time = props.editingTask.start_time || '10:00';
        form.end_time = props.editingTask.end_time || '';
        form.is_all_day = props.editingTask.is_all_day;
        form.priority = props.editingTask.priority;
        form.category_id = props.editingTask.category_id || null;
        reminderMinutes.value = props.editingTask.reminders?.[0]?.minutes_before ?? 15;
      } else {
        form.title = '';
        form.description = '';
        form.task_date = props.defaultDate || getTodayDateString();
        form.start_time = props.defaultTime || '10:00';
        form.end_time = '';
        form.is_all_day = !props.defaultTime;
        form.priority = 'medium';
        form.category_id = null;
        reminderMinutes.value = 15;
      }
    }
  }
);

function handleClose() {
  emit('close');
}

function handleSubmit() {
  if (!form.title.trim()) return;

  const reminders = reminderMinutes.value >= 0
    ? [{ minutes_before: reminderMinutes.value, reminder_type: 'both' as const }]
    : [];

  emit('save', {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    task_date: form.task_date,
    start_time: form.is_all_day ? undefined : (form.start_time || undefined),
    end_time: form.is_all_day ? undefined : (form.end_time || undefined),
    is_all_day: form.is_all_day,
    priority: form.priority,
    category_id: form.category_id,
    reminders,
  });
}
</script>
