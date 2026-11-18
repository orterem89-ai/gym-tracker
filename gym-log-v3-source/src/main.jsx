import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('sw.js');
      const reg = await navigator.serviceWorker.ready;
      const urls = performance.getEntriesByType('resource').map(r => r.name).filter(u => u.startsWith(location.origin));
      reg.active && reg.active.postMessage({ type: 'cache', urls });
    } catch { /* offline support is optional */ }
  });
  navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {});
}
