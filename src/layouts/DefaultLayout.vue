<template>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
    <!-- Top Navbar -->
    <Navbar />

    <!-- Main Container (Sidebar + Content) -->
    <div class="flex-1 flex max-w-7xl w-full mx-auto">
      <!-- Desktop Sidebar -->
      <Sidebar @open-add="openTaskForm()" />

      <!-- Main Page Outlet -->
      <main class="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
        <!-- Notification Permission Banner -->
        <NotificationBanner />

        <!-- PWA Install Banner -->
        <PwaInstallPrompt />

        <!-- Router Page -->
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" @open-add="openTaskForm" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- Mobile Bottom Navigation -->
    <BottomNav @open-add="openTaskForm()" />

    <!-- Global Quick Add / Edit Task Modal -->
    <TaskFormModal
      :is-open="isTaskModalOpen"
      :editing-task="editingTask"
      :default-date="defaultDate"
      :default-time="defaultTime"
      @close="closeTaskForm"
      @save="handleSaveTask"
    />

    <!-- Global Active Alarm Modal -->
    <AlarmModal />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Navbar from '@/components/common/Navbar.vue';
import Sidebar from '@/components/common/Sidebar.vue';
import BottomNav from '@/components/common/BottomNav.vue';
import TaskFormModal from '@/components/tasks/TaskFormModal.vue';
import AlarmModal from '@/components/notifications/AlarmModal.vue';
import NotificationBanner from '@/components/notifications/NotificationBanner.vue';
import PwaInstallPrompt from '@/components/common/PwaInstallPrompt.vue';
import { useTaskStore } from '@/stores/task.store';
import { useCategoryStore } from '@/stores/category.store';
import { useSettingsStore } from '@/stores/settings.store';
import { reminderService } from '@/services/reminder.service';
import type { Task, TaskCreateInput } from '@/types/task';

const taskStore = useTaskStore();
const categoryStore = useCategoryStore();
const settingsStore = useSettingsStore();

const isTaskModalOpen = ref(false);
const editingTask = ref<Task | null>(null);
const defaultDate = ref<string | undefined>(undefined);
const defaultTime = ref<string | undefined>(undefined);

onMounted(async () => {
  settingsStore.initTheme();
  await categoryStore.loadCategories();
  await taskStore.loadTasks();
  reminderService.start();
});

function openTaskForm(options?: { task?: Task; date?: string; time?: string }) {
  editingTask.value = options?.task || null;
  defaultDate.value = options?.date;
  defaultTime.value = options?.time;
  isTaskModalOpen.value = true;
}

function closeTaskForm() {
  isTaskModalOpen.value = false;
  editingTask.value = null;
  defaultDate.value = undefined;
  defaultTime.value = undefined;
}

async function handleSaveTask(payload: TaskCreateInput) {
  if (editingTask.value) {
    await taskStore.updateTask(editingTask.value.id, payload);
  } else {
    await taskStore.addTask(payload);
  }
  closeTaskForm();
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
