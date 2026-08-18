import { db } from './database';
import type { Category, CategoryCreateInput } from '@/types/category';
import { DEFAULT_FAMILY_CATEGORIES } from '@/types/category';

export class CategoryRepository {
  /**
   * Initializes default categories if database is empty or migrates old non-UUID IDs
   */
  async ensureDefaults(userId?: string): Promise<Category[]> {
    const existing = await db.categories.toArray();

    // Clean up any legacy default-cat-X non-UUID ids if present
    const legacyItems = existing.filter((c) => c.id.startsWith('default-cat'));
    if (legacyItems.length > 0) {
      await db.categories.bulkDelete(legacyItems.map((c) => c.id));
    }

    const current = await db.categories.toArray();
    if (current.length === 0) {
      const now = new Date().toISOString();
      const defaultCats: Category[] = DEFAULT_FAMILY_CATEGORIES.map((cat) => ({
        id: crypto.randomUUID(), // Always a valid UUID
        user_id: userId || 'local-user',
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        is_default: true,
        created_at: now,
        updated_at: now,
      }));

      await db.categories.bulkAdd(defaultCats);
      return defaultCats;
    }
    return current;
  }

  async getAll(userId?: string): Promise<Category[]> {
    await this.ensureDefaults(userId);
    if (userId && userId !== 'guest-family-user' && userId !== 'local-user') {
      const userCats = await db.categories.filter((c) => !c.user_id || c.user_id === userId || c.user_id === 'local-user').toArray();
      return userCats;
    }
    return db.categories.toArray();
  }

  async getById(id: string): Promise<Category | undefined> {
    return db.categories.get(id);
  }

  async create(input: CategoryCreateInput, userId?: string): Promise<Category> {
    const now = new Date().toISOString();
    const newCategory: Category = {
      id: crypto.randomUUID(),
      user_id: userId || 'local-user',
      name: input.name.trim(),
      icon: input.icon || 'Folder',
      color: input.color || '#6366f1',
      is_default: false,
      created_at: now,
      updated_at: now,
    };

    await db.categories.add(newCategory);
    return newCategory;
  }

  async update(id: string, updates: Partial<CategoryCreateInput>): Promise<Category | undefined> {
    const existing = await db.categories.get(id);
    if (!existing) return undefined;

    const updated: Category = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await db.categories.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.categories.delete(id);
  }
}

export const categoryRepository = new CategoryRepository();
