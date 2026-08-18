<template>
  <div v-if="!isStandalone && !isDismissed" class="mb-4">
    <!-- 1. Native Android / Chrome / Desktop Install Banner (when deferredPrompt is ready) -->
    <div
      v-if="deferredPrompt"
      class="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-xl flex items-center justify-between gap-3 border border-indigo-500/30 animate-in slide-in-from-bottom duration-200"
    >
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 font-bold text-sm shadow-md">
          <Download class="w-4 h-4" />
        </div>
        <div>
          <h4 class="text-xs font-bold">Install YJS Scheduler App</h4>
          <p class="text-[11px] text-indigo-200">1-tap install for full-screen offline access</p>
        </div>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <button
          @click="dismiss"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white"
          aria-label="Dismiss"
        >
          <X class="w-4 h-4" />
        </button>
        <button
          @click="handleInstall"
          class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
        >
          Install
        </button>
      </div>
    </div>

    <!-- 2. iOS Safari Install Guide Banner -->
    <div
      v-else-if="isIos"
      class="p-3.5 rounded-2xl bg-indigo-900/95 text-white shadow-xl border border-indigo-700/60 animate-in slide-in-from-bottom duration-200"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-start gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 mt-0.5">
            <Share2 class="w-4 h-4" />
          </div>
          <div>
            <h4 class="text-xs font-bold">Install on iPhone (PWA)</h4>
            <p class="text-[11px] text-indigo-200 leading-snug mt-0.5">
              Tap <strong class="text-white">Share</strong> <span class="text-xs">⎋</span> at bottom of Safari, then tap <strong class="text-white">"Add to Home Screen"</strong> <span class="text-xs">⊞</span>.
            </p>
          </div>
        </div>
        <button
          @click="dismiss"
          class="p-1 rounded-lg text-indigo-300 hover:text-white shrink-0"
          aria-label="Dismiss"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Download, X, Share2 } from 'lucide-vue-next';
import { usePwaInstall } from '@/composables/usePwaInstall';

const {
  deferredPrompt,
  isDismissed,
  isIos,
  isStandalone,
  promptInstall,
  dismiss,
} = usePwaInstall();

async function handleInstall() {
  await promptInstall();
}
</script>
