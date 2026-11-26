import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'gtfc_theme';
const DEFAULT_THEME: Theme = 'dark';

type Listener = () => void;
const listeners = new Set<Listener>();

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* localStorage no disponible: se usa el tema por defecto */
  }
  return DEFAULT_THEME;
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

let currentTheme: Theme = readStoredTheme();
applyTheme(currentTheme);

function setTheme(theme: Theme) {
  currentTheme = theme;
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* sin persistencia: el cambio sigue valiendo para esta sesión */
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Tema claro/oscuro compartido por toda la app (store externo, sin Provider).
 * Cualquier componente que lo use se actualiza al cambiar el tema.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => currentTheme, () => DEFAULT_THEME);

  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme(currentTheme === 'dark' ? 'light' : 'dark'),
  };
}
