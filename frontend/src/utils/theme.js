// frontend/src/utils/theme.js

const KEY = 'servix-theme';

export function getInitialTheme() {
  // 1) saved
  const saved = localStorage.getItem(KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  // 2) system preference
  const prefersDark = typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export function persistTheme(theme) {
  localStorage.setItem(KEY, theme);
}
