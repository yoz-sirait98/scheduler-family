import { defineStore } from 'pinia';
import { ref } from 'vue';
import { categoryRepository } from '@/db/category.repository';
import { syncService } from '@/services/sync.service';
import { useAuthStore } from './auth.store';
import type { Category, CategoryCreateInput } from '@/types/category';

export const useCategoryStore = defineStore('categories', () => {
  const categories = ref<Category[]>([]);
  const loading = ref<boolean>(false);
  const authStore = useAuthStore();

  async function loadCategories() {
    loading.value = true;
    try {
      categories.value = await categoryRepository.getAll(authStore.currentUserId);
    } finally {
      loading.value = false;
    }
  }

  async function addCategory(input: CategoryCreateInput): Promise<Category> {
    const category = await categoryRepository.create(input, authStore.currentUserId);
    categories.value.push(category);

    // Sync enqueue
    await syncService.enqueue('categories', 'create', category.id, category);
    return category;
  }

  async function updateCategory(id: string, updates: Partial<CategoryCreateInput>): Promise<void> {
    const updated = await categoryRepository.update(id, updates);
    if (updated) {
      const idx = categories.value.findIndex((c) => c.id === id);
      if (idx !== -1) categories.value[idx] = updated;

      await syncService.enqueue('categories', 'update', id, updated);
    }
  }

  async function deleteCategory(id: string): Promise<void> {
    await categoryRepository.delete(id);
    categories.value = categories.value.filter((c) => c.id !== id);
    await syncService.enqueue('categories', 'delete', id, {});
  }

  return {
    categories,
    loading,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
});
