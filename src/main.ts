import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import './style.css';

// Capture beforeinstallprompt at top-level entry
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    (window as any).__deferredPwaPrompt = e;
  });
}

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount('#app');
