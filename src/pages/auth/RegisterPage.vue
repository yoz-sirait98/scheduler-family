<template>
  <div class="space-y-5">
    <div class="text-center">
      <h2 class="text-xl font-bold text-slate-900 dark:text-white">
        Create Your Account
      </h2>
      <p class="text-xs text-slate-500 mt-1">
        Start organizing personal & family tasks with cloud sync
      </p>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
      {{ errorMessage }}
    </div>

    <!-- Success Alert -->
    <div v-if="successMessage" class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-600 dark:text-emerald-400">
      {{ successMessage }}
    </div>

    <!-- Register Form -->
    <form @submit.prevent="handleRegister" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
          Your Name / Family Name
        </label>
        <input
          v-model="displayName"
          type="text"
          placeholder="e.g. Yosua & Family"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
          Email Address *
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
          Password *
        </label>
        <input
          v-model="password"
          type="password"
          required
          minlength="6"
          placeholder="At least 6 characters"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-500/25 active:scale-98 transition-all disabled:opacity-50"
      >
        {{ loading ? 'Creating account...' : 'Create Account' }}
      </button>
    </form>

    <!-- Sign In Link -->
    <div class="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
      <p class="text-xs text-slate-500">
        Already have an account?
        <router-link to="/login" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
          Sign In
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

const displayName = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

async function handleRegister() {
  errorMessage.value = '';
  successMessage.value = '';
  loading.value = true;

  const res = await authStore.register(email.value, password.value, displayName.value);
  loading.value = false;

  if (res.error) {
    errorMessage.value = res.error;
  } else {
    successMessage.value = 'Account created successfully! Redirecting...';
    setTimeout(() => {
      router.push('/dashboard');
    }, 1200);
  }
}
</script>
