import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Makes game progress saving work outside Claude (uses your browser's storage instead)
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: async (key) => {
      try {
        const value = localStorage.getItem(key);
        return value !== null ? { key, value, shared: false } : null;
      } catch (e) { return null; }
    },
    set: async (key, value) => {
      try {
        localStorage.setItem(key, value);
        return { key, value, shared: false };
      } catch (e) { return null; }
    },
    delete: async (key) => {
      try {
        localStorage.removeItem(key);
        return { key, deleted: true, shared: false };
      } catch (e) { return null; }
    },
    list: async (prefix = '') => {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) keys.push(k);
        }
        return { keys, prefix, shared: false };
      } catch (e) { return null; }
    },
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// --- Service Worker Registration ---
// Register SW with feature detection; skip silently if unsupported (Requirement 4.6)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Listen for SW update messages (Requirement 4.5)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
            showUpdateToast();
          }
        });
      })
      .catch(() => {
        // Registration failed — skip silently
      });
  });
}

// --- Update Toast ---
// Display a non-blocking banner prompting refresh when SW update is available (Requirement 4.5)
function showUpdateToast() {
  // Avoid duplicate toasts
  if (document.getElementById('sw-update-toast')) return;

  const toast = document.createElement('div');
  toast.id = 'sw-update-toast';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = `
    position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
    z-index: 9999; background: linear-gradient(135deg, #06b6d4, #8b5cf6);
    color: white; padding: 12px 20px; border-radius: 12px;
    font-family: system-ui, sans-serif; font-size: 14px; font-weight: 600;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 12px;
    max-width: 90vw;
  `;

  const text = document.createElement('span');
  text.textContent = 'A new version is available!';

  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = 'Refresh';
  refreshBtn.style.cssText = `
    background: white; color: #1e1b4b; border: none; padding: 6px 14px;
    border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;
  `;
  refreshBtn.onclick = () => window.location.reload();

  const dismissBtn = document.createElement('button');
  dismissBtn.textContent = '✕';
  dismissBtn.setAttribute('aria-label', 'Dismiss update notification');
  dismissBtn.style.cssText = `
    background: transparent; color: white; border: none; font-size: 18px;
    cursor: pointer; padding: 4px 8px; opacity: 0.8;
  `;
  dismissBtn.onclick = () => toast.remove();

  toast.appendChild(text);
  toast.appendChild(refreshBtn);
  toast.appendChild(dismissBtn);
  document.body.appendChild(toast);
}

// --- beforeinstallprompt ---
// Store the install prompt event globally so the MenuScreen can use it (Requirement 4.8)
window.__pwaInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
  // Dispatch a custom event so React components can react to it
  window.dispatchEvent(new CustomEvent('pwainstallready'));
});
