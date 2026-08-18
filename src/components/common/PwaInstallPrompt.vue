<template>
  <div>
    <!-- Android / Chrome / Edge Install Banner -->
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
          <p class="text-[11px] text-slate-300">Install as standalone app with offline alerts</p>
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
          class="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
        >
          Install
        </button>
      </div>
    </div>

    <!-- iOS Safari "Add to Home Screen" Instructions Banner -->
    <div
      v-if="isIosSafari && !isInStandaloneMode && !isDismissed"
      class="mb-4 p-3.5 rounded-2xl bg-indigo-900/95 text-white shadow-xl border border-indigo-700/60 animate-in slide-in-from-bottom duration-200"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-start gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 mt-0.5">
            <Share2 class="w-4 h-4" />
          </div>
          <div>
            <h4 class="text-xs font-bold">Install on iPhone (PWA)</h4>
            <p class="text-[11px] text-indigo-200 leading-snug mt-0.5">
              Tap <strong class="text-white">Share</strong> <span class="text-xs">⎋</span> at the bottom of Safari, then tap <strong class="text-white">"Add to Home Screen"</strong> <span class="text-xs">⊞</span> for full-screen offline mode!
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
import { ref, onMounted, computed } from 'vue';
import { X, Share2 } from 'lucide-vue-next';

const deferredPrompt = ref<any>(null);
const isDismissed = ref(false);

const isIosSafari = computed(() => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);
  return isIos && isSafari;
});

const isInStandaloneMode = computed(() => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
});

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
