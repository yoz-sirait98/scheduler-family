<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
    <!-- Backdrop dismiss -->
    <div class="fixed inset-0" @click="handleClose"></div>

    <!-- Modal / Bottom Sheet Container -->
    <div
      class="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in fade-in slide-in-from-bottom-6 duration-200"
    >
      <!-- Sheet Handle for Mobile Drag Affordance -->
      <div class="sm:hidden pt-3 pb-1 flex justify-center">
        <div class="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
      </div>

      <!-- Pinned Header -->
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarPlus class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{{ editingTask ? 'Edit Task' : 'Quick Add Task' }}</span>
        </h3>
        <button
          @click="handleClose"
          class="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Scrollable Form Body -->
      <form @submit.prevent="handleSubmit" id="task-form" class="flex-1 overflow-y-auto px-5 py-4 space-y-4 touch-scroll">
        <!-- Title Input -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Task Title *
          </label>
          <input
            v-model="form.title"
            type="text"
            required
            placeholder="e.g. Doctor appointment, Groceries, Meeting"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm transition-all"
            autofocus
          />
        </div>

        <!-- Quick Date Chips & Date Picker -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Date *
            </label>
            <!-- Quick Date Chips -->
            <div class="flex items-center gap-1">
              <button
                type="button"
                @click="setQuickDate('today')"
                class="px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all"
                :class="form.task_date === todayStr ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'"
              >
                Today
              </button>
              <button
                type="button"
                @click="setQuickDate('tomorrow')"
                class="px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all"
                :class="form.task_date === tomorrowStr ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'"
              >
                Tomorrow
              </button>
            </div>
          </div>
          <input
            v-model="form.task_date"
            type="date"
            required
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
          />
        </div>

        <!-- All Day Toggle & Time Row -->
        <div class="space-y-2.5 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">All-Day Task</span>
            <button
              type="button"
              @click="form.is_all_day = !form.is_all_day"
              class="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              :class="form.is_all_day ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'"
            >
              <span
                class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out"
                :class="form.is_all_day ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>

          <!-- Start & End Time (if not all day) -->
          <div v-if="!form.is_all_day" class="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Start Time
              </label>
              <input
                v-model="form.start_time"
                type="time"
                class="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                End Time (Optional)
              </label>
              <input
                v-model="form.end_time"
                type="time"
                class="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <!-- Category Selector -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
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
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Priority
          </label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="p in priorityOptions"
              :key="p.value"
              type="button"
              @click="form.priority = p.value"
              class="py-1.5 px-2 rounded-xl text-xs font-semibold border text-center transition-all"
              :class="form.priority === p.value ? p.activeClass : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <!-- Reminder Selector -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Bell class="w-3.5 h-3.5 text-indigo-500" />
            <span>Reminder & Sound Chime</span>
          </label>
          <select
            v-model="reminderMinutes"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

        <!-- Description / Notes -->
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Notes (Optional)
          </label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Additional notes, links, or instructions..."
            class="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs transition-all resize-none font-sans"
          ></textarea>
        </div>
      </form>

      <!-- Pinned Action Buttons (Always Visible) -->
      <div class="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center gap-3 shrink-0 rounded-b-3xl pb-[env(safe-area-inset-bottom,16px)]">
        <button
          type="button"
          @click="handleClose"
          class="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="task-form"
          class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-md shadow-indigo-500/25 active:scale-95 transition-all"
        >
          {{ editingTask ? 'Save Changes' : 'Create Task' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, ref, computed } from 'vue';
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
  { label: 'Low', value: 'low', activeClass: 'bg-slate-200 dark:bg-slate-700 border-slate-400 text-slate-900 dark:text-white font-bold' },
  { label: 'Med', value: 'medium', activeClass: 'bg-indigo-100 dark:bg-indigo-900/70 border-indigo-400 text-indigo-900 dark:text-indigo-200 font-bold' },
  { label: 'High', value: 'high', activeClass: 'bg-amber-100 dark:bg-amber-900/70 border-amber-400 text-amber-900 dark:text-amber-200 font-bold' },
  { label: 'Urgent', value: 'urgent', activeClass: 'bg-rose-100 dark:bg-rose-900/70 border-rose-400 text-rose-900 dark:text-rose-200 font-bold' },
];

const reminderMinutes = ref<number>(15);

const todayStr = getTodayDateString();
const tomorrowStr = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
});

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

function setQuickDate(type: 'today' | 'tomorrow') {
  form.task_date = type === 'today' ? todayStr : tomorrowStr.value;
}

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
