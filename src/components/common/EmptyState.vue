<template>
  <div class="flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm my-4">
    <div class="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 shadow-inner">
      <slot name="icon">
        <Sparkles class="w-7 h-7" />
      </slot>
    </div>
    <h3 class="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
      {{ title }}
    </h3>
    <p class="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-4">
      {{ description }}
    </p>
    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next';

defineProps<{
  title: string;
  description: string;
}>();
</script>
