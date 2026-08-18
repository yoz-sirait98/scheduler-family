<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Categories & Tags
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Organize family and personal activities with custom colors and icons
        </p>
      </div>

      <button
        @click="openCategoryModal()"
        class="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-all active:scale-95"
      >
        <Plus class="w-4 h-4 stroke-[2.5]" />
        <span>Add Category</span>
      </button>
    </div>

    <!-- Category Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      <div
        v-for="cat in categoryStore.categories"
        :key="cat.id"
        class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center justify-between gap-3 group hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0"
            :style="{
              backgroundColor: `${cat.color}20`,
              color: cat.color,
            }"
          >
            <CategoryIcon :name="cat.icon" size="md" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-slate-900 dark:text-white">
              {{ cat.name }}
            </h4>
            <span class="text-[11px] text-slate-400">
              {{ getCategoryTaskCount(cat.id) }} task{{ getCategoryTaskCount(cat.id) === 1 ? '' : 's' }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100">
          <button
            @click="openCategoryModal(cat)"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Edit"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          <button
            v-if="!cat.is_default"
            @click="handleDelete(cat)"
            class="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Delete"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Category Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="fixed inset-0" @click="isModalOpen = false"></div>
      <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-bold text-slate-900 dark:text-white">
            {{ editingCategory ? 'Edit Category' : 'New Category' }}
          </h3>
          <button @click="isModalOpen = false" class="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveCategory" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
              Category Name *
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="e.g. Groceries, School, Fitness"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Color Presets -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Color Theme
            </label>
            <div class="flex items-center gap-2 flex-wrap">
              <button
                v-for="color in colorPalette"
                :key="color"
                type="button"
                @click="form.color = color"
                class="w-7 h-7 rounded-full transition-transform active:scale-90 flex items-center justify-center"
                :style="{ backgroundColor: color }"
              >
                <Check v-if="form.color === color" class="w-4 h-4 text-white stroke-[3]" />
              </button>
            </div>
          </div>

          <!-- Icon Selector -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Icon
            </label>
            <div class="grid grid-cols-6 gap-2">
              <button
                v-for="iconName in iconOptions"
                :key="iconName"
                type="button"
                @click="form.icon = iconName"
                class="p-2 rounded-xl border flex items-center justify-center transition-all"
                :class="form.icon === iconName ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'"
              >
                <CategoryIcon :name="iconName" size="md" />
              </button>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="button"
              @click="isModalOpen = false"
              class="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-vue-next';
import CategoryIcon from '@/components/common/CategoryIcon.vue';
import { useCategoryStore } from '@/stores/category.store';
import { useTaskStore } from '@/stores/task.store';
import type { Category } from '@/types/category';

const categoryStore = useCategoryStore();
const taskStore = useTaskStore();

const isModalOpen = ref(false);
const editingCategory = ref<Category | null>(null);

const colorPalette = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

const iconOptions = [
  'Users',
  'Home',
  'Briefcase',
  'DollarSign',
  'HeartPulse',
  'User',
  'Calendar',
  'Bell',
  'BookOpen',
  'ShoppingBag',
  'Utensils',
  'GraduationCap',
];

const form = reactive({
  name: '',
  color: '#6366f1',
  icon: 'Folder',
});

function getCategoryTaskCount(categoryId: string): number {
  return taskStore.tasks.filter((t) => t.category_id === categoryId && !t.is_deleted).length;
}

function openCategoryModal(cat?: Category) {
  if (cat) {
    editingCategory.value = cat;
    form.name = cat.name;
    form.color = cat.color;
    form.icon = cat.icon;
  } else {
    editingCategory.value = null;
    form.name = '';
    form.color = '#6366f1';
    form.icon = 'Folder';
  }
  isModalOpen.value = true;
}

async function saveCategory() {
  if (!form.name.trim()) return;

  if (editingCategory.value) {
    await categoryStore.updateCategory(editingCategory.value.id, {
      name: form.name.trim(),
      color: form.color,
      icon: form.icon,
    });
  } else {
    await categoryStore.addCategory({
      name: form.name.trim(),
      color: form.color,
      icon: form.icon,
    });
  }
  isModalOpen.value = false;
}

async function handleDelete(cat: Category) {
  if (confirm(`Delete category "${cat.name}"? Tasks with this category will become unassigned.`)) {
    await categoryStore.deleteCategory(cat.id);
  }
}
</script>
