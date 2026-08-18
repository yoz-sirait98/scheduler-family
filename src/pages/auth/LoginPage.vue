<template>
  <div class="space-y-5">
    <div class="text-center">
      <h2 class="text-xl font-bold text-slate-900 dark:text-white">
        Welcome Back
      </h2>
      <p class="text-xs text-slate-500 mt-1">
        Sign in to sync your family tasks across all devices
      </p>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
      {{ errorMessage }}
    </div>

    <!-- Login Form -->
    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
          Email Address
        </label>
        <input
          v-model="email"
          type="email"
          required
          placeholder="family@example.com"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
          Password
        </label>
        <input
          v-model="password"
          type="password"
          required
          placeholder="••••••••"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-500/25 active:scale-98 transition-all disabled:opacity-50"
      >
        {{ loading ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>

    <!-- Guest Mode Option -->
    <div class="pt-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
      <button
        @click="continueAsGuest"
        class="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
      >
        Continue as Guest (Offline Mode)
      </button>

      <p class="text-xs text-slate-500">
        Don't have an account?
        <router-link to="/register" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
          Sign Up
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

async function handleLogin() {
  errorMessage.value = '';
  loading.value = true;
  const res = await authStore.login(email.value, password.value);
  loading.value = false;

  if (res.error) {
    errorMessage.value = res.error;
  } else {
    router.push('/dashboard');
  }
}

function continueAsGuest() {
  authStore.enterGuestMode();
  router.push('/dashboard');
}
</script>
