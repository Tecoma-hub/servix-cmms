// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// --- Set theme ASAP (after imports to satisfy ESLint) ---
(function applyInitialTheme() {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch {
    // ignore
  }
})();

// --- Mobile viewport height fix (iOS/Android browser chrome) ---
function setAppVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--app-vh', `${vh}px`);
}
setAppVh();
window.addEventListener('resize', setAppVh);
window.addEventListener('orientationchange', setAppVh);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional HMR cleanup (CRA uses module.hot)
if (module && module.hot) {
  module.hot.dispose(() => {
    window.removeEventListener('resize', setAppVh);
    window.removeEventListener('orientationchange', setAppVh);
  });
}
