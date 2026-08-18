import { defineStore } from 'pinia';
import { ref } from 'vue';
import { categoryRepository } from '@/db/category.repository';
import { syncService } from '@/services/sync.service';
import { supabase, isSupabaseConfigured } from '@/services/supabase.service';
import { useAuthStore } from './auth.store';
import type { Category, CategoryCreateInput } from '@/types/category';

export const useCategoryStore = defineStore('categories', () => {
  const categories = ref<Category[]>([]);
  const loading = ref<boolean>(false);
  const authStore = useAuthStore();

  async function loadCategories() {
    loading.value = true;
    try {
      // First load local Dexie
      categories.value = await categoryRepository.getAll(authStore.currentUserId);

      // If user is authenticated and online, also pull remote categories from Supabase
      if (authStore.user?.id && isSupabaseConfigured && supabase && navigator.onLine) {
        const { data: remoteCats, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', authStore.user.id);

        if (!error && remoteCats && remoteCats.length > 0) {
          categories.value = remoteCats;
        }
      }
    } finally {
      loading.value = false;
    }
  }

  async function addCategory(input: CategoryCreateInput): Promise<Category> {
    const activeUserId = authStore.user?.id || authStore.currentUserId;
    const category = await categoryRepository.create(input, activeUserId);
    categories.value.push(category);

    // Direct Supabase upsert if authenticated and online
    if (authStore.user?.id && isSupabaseConfigured && supabase && navigator.onLine) {
      try {
        const payload = {
          id: category.id,
          user_id: authStore.user.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          is_default: category.is_default ?? false,
          created_at: category.created_at,
          updated_at: category.updated_at,
        };
        const { error } = await supabase.from('categories').upsert(payload);
        if (error) {
          console.warn('Direct category upsert failed, enqueued for background sync:', error);
          await syncService.enqueue('categories', 'create', category.id, category);
        }
      } catch {
        await syncService.enqueue('categories', 'create', category.id, category);
      }
    } else {
      await syncService.enqueue('categories', 'create', category.id, category);
    }

    return category;
  }

  async function updateCategory(id: string, updates: Partial<CategoryCreateInput>): Promise<void> {
    const updated = await categoryRepository.update(id, updates);
    if (updated) {
      const idx = categories.value.findIndex((c) => c.id === id);
      if (idx !== -1) categories.value[idx] = updated;

      if (authStore.user?.id && isSupabaseConfigured && supabase && navigator.onLine) {
        try {
          const payload = {
            id: updated.id,
            user_id: authStore.user.id,
            name: updated.name,
            icon: updated.icon,
            color: updated.color,
            is_default: updated.is_default ?? false,
            created_at: updated.created_at,
            updated_at: updated.updated_at,
          };
          const { error } = await supabase.from('categories').upsert(payload);
          if (error) {
            await syncService.enqueue('categories', 'update', id, updated);
          }
        } catch {
          await syncService.enqueue('categories', 'update', id, updated);
        }
      } else {
        await syncService.enqueue('categories', 'update', id, updated);
      }
    }
  }

  async function deleteCategory(id: string): Promise<void> {
    await categoryRepository.delete(id);
    categories.value = categories.value.filter((c) => c.id !== id);

    if (authStore.user?.id && isSupabaseConfigured && supabase && navigator.onLine) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) {
          await syncService.enqueue('categories', 'delete', id, {});
        }
      } catch {
        await syncService.enqueue('categories', 'delete', id, {});
      }
    } else {
      await syncService.enqueue('categories', 'delete', id, {});
    }
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
