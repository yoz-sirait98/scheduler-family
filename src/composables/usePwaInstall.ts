import { ref, computed } from 'vue';

const deferredPrompt = ref<any>(null);
const isInstalled = ref(false);
const isDismissed = ref(false);
const showIosModal = ref(false);

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};

// Listen globally at script load time so beforeinstallprompt is never missed
if (typeof window !== 'undefined') {
  if (isStandalone()) {
    isInstalled.value = true;
  }

  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredPrompt.value = e;

    // Auto-prompt on initial visit after 1.5s delay if not already in standalone mode
    const hasAutoPrompted = sessionStorage.getItem('pwa_autoprompt_done');
    if (!hasAutoPrompted && !isStandalone()) {
      sessionStorage.setItem('pwa_autoprompt_done', 'true');
      setTimeout(() => {
        if (deferredPrompt.value) {
          deferredPrompt.value.prompt().catch(() => {});
        }
      }, 1500);
    }
  });

  window.addEventListener('appinstalled', () => {
    isInstalled.value = true;
    deferredPrompt.value = null;
  });
}

export function usePwaInstall() {
  const isIos = computed(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  });

  const isStandaloneMode = computed(() => isStandalone());

  const canInstall = computed(() => {
    if (isStandaloneMode.value || isInstalled.value) return false;
    return Boolean(deferredPrompt.value) || isIos.value;
  });

  async function promptInstall(): Promise<boolean> {
    if (deferredPrompt.value) {
      try {
        deferredPrompt.value.prompt();
        const { outcome } = await deferredPrompt.value.userChoice;
        if (outcome === 'accepted') {
          deferredPrompt.value = null;
          isInstalled.value = true;
          return true;
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
      return false;
    }

    if (isIos.value) {
      showIosModal.value = true;
      return true;
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
    showIosModal,
    isIos,
    isStandalone: isStandaloneMode,
    canInstall,
    promptInstall,
    dismiss,
  };
}
