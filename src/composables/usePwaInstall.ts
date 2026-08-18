import { ref, computed, onMounted } from 'vue';

const deferredPrompt = ref<any>(null);
const isInstalled = ref(false);
const isDismissed = ref(false);

export function usePwaInstall() {
  const isIos = computed(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  });

  const isStandalone = computed(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  });

  const canInstall = computed(() => {
    return !isStandalone.value && (Boolean(deferredPrompt.value) || isIos.value);
  });

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        deferredPrompt.value = e;
      });

      window.addEventListener('appinstalled', () => {
        isInstalled.value = true;
        deferredPrompt.value = null;
      });

      if (isStandalone.value) {
        isInstalled.value = true;
      }
    }
  });

  async function promptInstall(): Promise<boolean> {
    if (deferredPrompt.value) {
      deferredPrompt.value.prompt();
      const { outcome } = await deferredPrompt.value.userChoice;
      if (outcome === 'accepted') {
        deferredPrompt.value = null;
        isInstalled.value = true;
        return true;
      }
      return false;
    }
    return false;
  }

  function dismiss() {
    isDismissed.value = true;
  }

  return {
    deferredPrompt,
    isInstalled,
    isDismissed,
    isIos,
    isStandalone,
    canInstall,
    promptInstall,
    dismiss,
  };
}
