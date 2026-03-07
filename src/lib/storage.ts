import type { AppData } from './types';

const KEY = 'word-quiz-app';
const empty: AppData = { wordBooks: [], wordStats: {}, testHistory: [] };

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
    };
  } catch {
    return empty;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(data));
}
