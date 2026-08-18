<template>
  <div class="install-pwa-wrapper inline-flex items-center" v-if="showInstallPrompt">
    <!-- iOS Instructions Modal -->
    <div
      v-if="showIosModal"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      @click.self="showIosModal = false"
    >
      <div class="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 pb-[env(safe-area-inset-bottom,24px)] animate-in slide-in-from-bottom duration-200">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h5 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Install on iPhone</span>
          </h5>
          <button type="button" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" @click="showIosModal = false">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="py-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <p class="font-semibold text-slate-800 dark:text-slate-200">
            To install YJS Scheduler on your iPhone for the best full-screen native experience:
          </p>
          <div class="space-y-2.5">
            <div class="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
              <span class="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
              <p>Tap the <strong>Share</strong> button <span class="inline-block px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border text-indigo-600 font-bold mx-0.5">⎋</span> at the very bottom of Safari.</p>
            </div>
            <div class="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
              <span class="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
              <p>Scroll down and tap <strong>Add to Home Screen</strong> <span class="inline-block px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border text-slate-800 dark:text-white font-bold mx-0.5">⊞</span>.</p>
            </div>
            <div class="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
              <span class="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
              <p>Tap <strong>Add</strong> in the top-right corner to finish installing!</p>
            </div>
          </div>
        </div>

        <button
          class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
          @click="showIosModal = false"
        >
          Got it!
        </button>
      </div>
    </div>

    <!-- The actual Install Button (pulsing gradient) -->
    <button 
      class="install-btn inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
      @click="handleInstallClick"
      title="Install YJS Scheduler App"
    >
      <Download class="w-3.5 h-3.5" />
      <span class="hidden sm:inline">Install App</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Download, Smartphone, X } from 'lucide-vue-next';

const showInstallPrompt = ref(false);
const showIosModal = ref(false);
let deferredPrompt: any = null;

const isIos = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};

function handleInstallClick() {
  if (isIos()) {
    showIosModal.value = true;
  } else if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        showInstallPrompt.value = false;
      }
      deferredPrompt = null;
    });
  } else {
    // If deferredPrompt is null, alert/guide the user
    showIosModal.value = true;
  }
}

function handleBeforeInstallPrompt(e: Event) {
  // Prevent default banner to control triggering
  e.preventDefault();
  deferredPrompt = e;
  showInstallPrompt.value = true;

  // Auto-prompt dialog on first visit (matching Family Finance behavior)
  const hasAutoPrompted = sessionStorage.getItem('pwa_auto_prompt_done');
  if (!hasAutoPrompted && !isStandalone()) {
    sessionStorage.setItem('pwa_auto_prompt_done', 'true');
    setTimeout(() => {
      if (deferredPrompt) {
        deferredPrompt.prompt().catch(() => {});
      }
    }, 1200);
  }
}

onMounted(() => {
  if (isStandalone()) {
    showInstallPrompt.value = false;
    return;
  }

  if (isIos()) {
    showInstallPrompt.value = true;
  } else {
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    // If window already captured it globally:
    if ((window as any).__deferredPwaPrompt) {
      handleBeforeInstallPrompt((window as any).__deferredPwaPrompt);
    }
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }
});
</script>

<style scoped>
.install-btn {
  animation: pulse-glow 2s infinite;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.35);
}

@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.45); }
  70% { box-shadow: 0 0 0 7px rgba(99, 102, 241, 0); }
  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}
</style>
