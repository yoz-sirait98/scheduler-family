import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase, isSupabaseConfigured } from '@/services/supabase.service';
import type { UserProfile } from '@/types/user';
import type { User, Session } from '@supabase/supabase-js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const profile = ref<UserProfile | null>(null);
  const isGuestMode = ref<boolean>(false);
  const loading = ref<boolean>(true);

  const isAuthenticated = computed(() => !!user.value || isGuestMode.value);
  const currentUserId = computed(() => user.value?.id || (isGuestMode.value ? 'guest-family-user' : undefined));
  const userDisplayName = computed(() => profile.value?.display_name || user.value?.email?.split('@')[0] || 'Family Member');

  async function init() {
    loading.value = true;
    try {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        session.value = data.session;
        user.value = data.session?.user || null;

        if (user.value) {
          await loadProfile(user.value.id);
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (_event, newSession) => {
          session.value = newSession;
          user.value = newSession?.user || null;
          if (user.value) {
            await loadProfile(user.value.id);
          } else {
            profile.value = null;
          }
        });
      } else {
        // Default to local/guest mode when Supabase is not configured
        isGuestMode.value = true;
      }
    } catch (e) {
      console.error('Error initializing auth:', e);
      isGuestMode.value = true;
    } finally {
      loading.value = false;
    }
  }

  async function loadProfile(userId: string) {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        profile.value = data;
      }
    } catch (e) {
      console.warn('Could not load user profile:', e);
    }
  }

  async function login(email: string, password: string): Promise<{ error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase credentials are not configured. Please use Guest / Local Mode.' };
    }
    loading.value = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };

      user.value = data.user;
      session.value = data.session;
      isGuestMode.value = false;
      if (data.user) {
        await loadProfile(data.user.id);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    } finally {
      loading.value = false;
    }
  }

  async function register(email: string, password: string, displayName?: string): Promise<{ error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase credentials are not configured.' };
    }
    loading.value = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });
      if (error) return { error: error.message };

      user.value = data.user;
      session.value = data.session;
      isGuestMode.value = false;
      return {};
    } catch (err: any) {
      return { error: err.message || 'Registration failed' };
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    user.value = null;
    session.value = null;
    profile.value = null;
    isGuestMode.value = false;
  }

  function enterGuestMode() {
    isGuestMode.value = true;
    user.value = null;
    session.value = null;
  }

  return {
    user,
    session,
    profile,
    isGuestMode,
    loading,
    isAuthenticated,
    currentUserId,
    userDisplayName,
    init,
    login,
    register,
    logout,
    enterGuestMode,
  };
});
