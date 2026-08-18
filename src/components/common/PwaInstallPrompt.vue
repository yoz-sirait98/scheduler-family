<template>
  <div
    v-if="deferredPrompt && !isDismissed"
    class="mb-4 p-3.5 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200 border border-slate-800"
  >
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 font-bold text-sm shadow-md">
        YJS
      </div>
      <div>
        <h4 class="text-xs font-bold">Install YJS Scheduler App</h4>
        <p class="text-[11px] text-slate-300">Fast offline access on your home screen</p>
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
        @click="installPwa"
        class="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold shadow-xs"
      >
        Install
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { X } from 'lucide-vue-next';

const deferredPrompt = ref<any>(null);
const isDismissed = ref(false);

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt.value = e;
  });
});

async function installPwa() {
  if (!deferredPrompt.value) return;
  deferredPrompt.value.prompt();
  const { outcome } = await deferredPrompt.value.userChoice;
  if (outcome === 'accepted') {
    deferredPrompt.value = null;
  }
}

function dismiss() {
  isDismissed.value = true;
}
</script>
