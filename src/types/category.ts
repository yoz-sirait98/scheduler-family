export interface Category {
  id: string;
  user_id?: string;
  name: string;
  icon: string; // Lucide icon identifier
  color: string; // HEX color code
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreateInput {
  name: string;
  icon?: string;
  color?: string;
}

export const DEFAULT_FAMILY_CATEGORIES: Omit<Category, 'id' | 'created_at' | 'updated_at'>[] = [
  { name: 'Family & Kids', icon: 'Users', color: '#ec4899', is_default: true },
  { name: 'Home & Chores', icon: 'Home', color: '#10b981', is_default: true },
  { name: 'Work', icon: 'Briefcase', color: '#3b82f6', is_default: true },
  { name: 'Finance', icon: 'DollarSign', color: '#f59e0b', is_default: true },
  { name: 'Health & Medical', icon: 'HeartPulse', color: '#ef4444', is_default: true },
  { name: 'Personal', icon: 'User', color: '#8b5cf6', is_default: true },
];
