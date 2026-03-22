import type { AppData } from './types';

const KEY = 'word-quiz-app';
const CACHE_PREFIX = 'word-quiz-cache-';
const empty: AppData = { wordBooks: [], wordStats: {}, testHistory: [], conqueredPresets: [] };

// Guest mode: localStorage
export function loadData(): AppData {
  if (typeof window === 'undefined') return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const p = JSON.parse(raw) as Partial<AppData>;
    return {
      wordBooks: p.wordBooks ?? [],
      wordStats: p.wordStats ?? {},
      testHistory: p.testHistory ?? [],
      conqueredPresets: p.conqueredPresets ?? [],
    };
  } catch {
    return empty;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

// Server mode: local cache (per-user, separate from guest localStorage)
export function loadCache(userId: number): AppData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + userId);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<AppData>;
    return {
      wordBooks: p.wordBooks ?? [],
      wordStats: p.wordStats ?? {},
      testHistory: p.testHistory ?? [],
      conqueredPresets: p.conqueredPresets ?? [],
    };
  } catch {
    return null;
  }
}

export function saveCache(userId: number, data: AppData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(data));
}

export function clearCache(userId: number): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_PREFIX + userId);
}
