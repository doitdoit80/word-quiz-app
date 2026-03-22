'use client';

import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';
import type { AppData, Word, TestRecord } from '@/lib/types';
import { loadData, saveData, loadCache, saveCache } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { useAuth } from './AuthContext';

type Action =
  | { type: 'LOAD'; data: AppData }
  | { type: 'ADD_WORDBOOK'; name: string }
  | { type: 'DELETE_WORDBOOK'; id: string }
  | { type: 'ADD_WORD'; wordBookId: string; word: Omit<Word, 'id'> }
  | { type: 'UPDATE_WORD'; wordBookId: string; word: Word }
  | { type: 'DELETE_WORD'; wordBookId: string; wordId: string }
  | { type: 'IMPORT_WORDS'; wordBookId: string; words: Omit<Word, 'id'>[] }
  | { type: 'UPDATE_STATS'; stats: Record<string, { correct: number; wrong: number }> }
  | { type: 'RESET_WORD_STAT'; wordId: string }
  | { type: 'RESET_WORDBOOK_STATS'; wordIds: string[] }
  | {
      type: 'RECORD_TEST';
      record: Omit<TestRecord, 'id'>;
      stats: Record<string, { correct: number; wrong: number }>;
    }
  | { type: 'REORDER_WORDBOOKS'; ids: string[] }
  | { type: 'RENAME_WORDBOOK'; id: string; name: string }
  | { type: 'ADD_WORDBOOK_WITH_WORDS'; name: string; words: Omit<Word, 'id'>[]; isPreset?: boolean }
  | { type: 'RESET_CONQUERED_PRESET'; name: string };

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'LOAD':
      return action.data;

    case 'ADD_WORDBOOK':
      return {
        ...state,
        wordBooks: [
          ...state.wordBooks,
          {
            id: generateId(),
            name: action.name,
            words: [],
            createdAt: new Date().toISOString(),
          },
        ],
      };

    case 'DELETE_WORDBOOK':
      return {
        ...state,
        wordBooks: state.wordBooks.filter((wb) => wb.id !== action.id),
      };

    case 'ADD_WORD':
      return {
        ...state,
        wordBooks: state.wordBooks.map((wb) =>
          wb.id === action.wordBookId
            ? wb.words.length >= 100
              ? wb
              : { ...wb, words: [...wb.words, { ...action.word, id: generateId() }] }
            : wb
        ),
      };

    case 'UPDATE_WORD':
      return {
        ...state,
        wordBooks: state.wordBooks.map((wb) =>
          wb.id === action.wordBookId
            ? { ...wb, words: wb.words.map((w) => (w.id === action.word.id ? action.word : w)) }
            : wb
        ),
      };

    case 'DELETE_WORD':
      return {
        ...state,
        wordBooks: state.wordBooks.map((wb) =>
          wb.id === action.wordBookId
            ? { ...wb, words: wb.words.filter((w) => w.id !== action.wordId) }
            : wb
        ),
      };

    case 'IMPORT_WORDS':
      return {
        ...state,
        wordBooks: state.wordBooks.map((wb) => {
          if (wb.id !== action.wordBookId) return wb;
          const remaining = 100 - wb.words.length;
          if (remaining <= 0) return wb;
          const toAdd = action.words.slice(0, remaining);
          return { ...wb, words: [...wb.words, ...toAdd.map((w) => ({ ...w, id: generateId() }))] };
        }),
      };

    case 'RESET_WORD_STAT': {
      const updatedStats = { ...state.wordStats };
      delete updatedStats[action.wordId];
      return { ...state, wordStats: updatedStats };
    }

    case 'RESET_WORDBOOK_STATS': {
      const updatedStats = { ...state.wordStats };
      for (const wordId of action.wordIds) delete updatedStats[wordId];
      return { ...state, wordStats: updatedStats };
    }

    case 'UPDATE_STATS': {
      const now = new Date().toISOString();
      const updatedStats = { ...state.wordStats };
      for (const [wordId, stat] of Object.entries(action.stats)) {
        const existing = updatedStats[wordId] ?? { correct: 0, wrong: 0 };
        updatedStats[wordId] = {
          correct: existing.correct + stat.correct,
          wrong: existing.wrong + stat.wrong,
          lastTested: now,
        };
      }
      return { ...state, wordStats: updatedStats };
    }

    case 'RECORD_TEST': {
      const now = new Date().toISOString();
      const updatedStats = { ...state.wordStats };
      for (const [wordId, stat] of Object.entries(action.stats)) {
        const existing = updatedStats[wordId] ?? { correct: 0, wrong: 0 };
        updatedStats[wordId] = {
          correct: existing.correct + stat.correct,
          wrong: existing.wrong + stat.wrong,
          lastTested: now,
        };
      }
      const wb = state.wordBooks.find((w) => w.id === action.record.wordBookId);
      const conquered = [...state.conqueredPresets];
      if (
        wb?.isPreset &&
        action.record.total > 0 &&
        action.record.score / action.record.total >= 0.9 &&
        !conquered.includes(wb.name)
      ) {
        conquered.push(wb.name);
      }
      return {
        ...state,
        testHistory: [{ ...action.record, id: generateId() }, ...state.testHistory],
        wordStats: updatedStats,
        conqueredPresets: conquered,
      };
    }

    case 'RENAME_WORDBOOK':
      return {
        ...state,
        wordBooks: state.wordBooks.map((wb) =>
          wb.id === action.id ? { ...wb, name: action.name } : wb
        ),
      };

    case 'ADD_WORDBOOK_WITH_WORDS':
      return {
        ...state,
        wordBooks: [
          ...state.wordBooks,
          {
            id: generateId(),
            name: action.name,
            words: action.words.map((w) => ({ ...w, id: generateId() })),
            createdAt: new Date().toISOString(),
            isPreset: action.isPreset,
          },
        ],
      };

    case 'RESET_CONQUERED_PRESET':
      return {
        ...state,
        conqueredPresets: state.conqueredPresets.filter((n) => n !== action.name),
      };

    case 'REORDER_WORDBOOKS':
      return {
        ...state,
        wordBooks: action.ids
          .map((id) => state.wordBooks.find((wb) => wb.id === id))
          .filter((wb): wb is NonNullable<typeof wb> => wb != null),
      };

    default:
      return state;
  }
}

// Sync actions to server API. Returns true on success, false on failure.
async function syncToServer(action: Action, state: AppData): Promise<boolean> {
  try {
    switch (action.type) {
      case 'ADD_WORDBOOK': {
        const newWb = state.wordBooks[state.wordBooks.length - 1];
        await fetch('/api/wordbooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWb),
        });
        break;
      }
      case 'DELETE_WORDBOOK':
        await fetch(`/api/wordbooks/${action.id}`, { method: 'DELETE' });
        break;
      case 'ADD_WORD': {
        const wb = state.wordBooks.find((w) => w.id === action.wordBookId);
        const newWord = wb?.words[wb.words.length - 1];
        if (newWord) {
          await fetch(`/api/wordbooks/${action.wordBookId}/words`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newWord),
          });
        }
        break;
      }
      case 'UPDATE_WORD':
        await fetch(`/api/wordbooks/${action.wordBookId}/words/${action.word.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.word),
        });
        break;
      case 'DELETE_WORD':
        await fetch(`/api/wordbooks/${action.wordBookId}/words/${action.wordId}`, { method: 'DELETE' });
        break;
      case 'IMPORT_WORDS': {
        const targetWb = state.wordBooks.find((w) => w.id === action.wordBookId);
        if (targetWb) {
          // Get the newly added words (last N words)
          const newWords = targetWb.words.slice(-action.words.length);
          await fetch(`/api/wordbooks/${action.wordBookId}/words`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newWords),
          });
        }
        break;
      }
      case 'RENAME_WORDBOOK':
        await fetch(`/api/wordbooks/${action.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: action.name }),
        });
        break;
      case 'REORDER_WORDBOOKS':
        await fetch('/api/wordbooks/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: action.ids }),
        });
        break;
      case 'ADD_WORDBOOK_WITH_WORDS': {
        const addedWb = state.wordBooks[state.wordBooks.length - 1];
        await fetch('/api/wordbooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addedWb),
        });
        break;
      }
      case 'UPDATE_STATS': {
        // Build absolute stats to send
        const absStats: Record<string, { correct: number; wrong: number; lastTested?: string }> = {};
        for (const wordId of Object.keys(action.stats)) {
          if (state.wordStats[wordId]) {
            absStats[wordId] = state.wordStats[wordId];
          }
        }
        await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stats: absStats }),
        });
        break;
      }
      case 'RESET_WORD_STAT':
        await fetch('/api/stats', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wordIds: [action.wordId] }),
        });
        break;
      case 'RESET_WORDBOOK_STATS':
        await fetch('/api/stats', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wordIds: action.wordIds }),
        });
        break;
      case 'RECORD_TEST': {
        const record = state.testHistory[0]; // Most recent
        await fetch('/api/test-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        });
        // Sync stats
        const absStats: Record<string, { correct: number; wrong: number; lastTested?: string }> = {};
        for (const wordId of Object.keys(action.stats)) {
          if (state.wordStats[wordId]) {
            absStats[wordId] = state.wordStats[wordId];
          }
        }
        await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stats: absStats }),
        });
        // Check conquered preset
        const testWb = state.wordBooks.find((w) => w.id === action.record.wordBookId);
        if (
          testWb?.isPreset &&
          action.record.total > 0 &&
          action.record.score / action.record.total >= 0.9
        ) {
          await fetch('/api/conquered-presets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ presetName: testWb.name }),
          });
        }
        break;
      }
      case 'RESET_CONQUERED_PRESET':
        await fetch('/api/conquered-presets', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ presetName: action.name }),
        });
        break;
    }
    return true;
  } catch (err) {
    console.error('Failed to sync to server:', err);
    return false;
  }
}

interface AppContextValue {
  data: AppData;
  dispatch: React.Dispatch<Action>;
  isServerMode: boolean;
  syncError: string | null;
  clearSyncError: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [data, rawDispatch] = useReducer(reducer, {
    wordBooks: [],
    wordStats: {},
    testHistory: [],
    conqueredPresets: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const isServerMode = !!user;
  const dataRef = useRef(data);
  dataRef.current = data;
  const clearSyncError = useCallback(() => setSyncError(null), []);

  // Auto-dismiss sync error after 5 seconds
  useEffect(() => {
    if (!syncError) return;
    const timer = setTimeout(() => setSyncError(null), 5000);
    return () => clearTimeout(timer);
  }, [syncError]);

  // Load data: cache-first for server mode, localStorage for guest mode
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      // 1) Show cached data instantly if available
      const cached = loadCache(user.id);
      if (cached) {
        rawDispatch({ type: 'LOAD', data: cached });
        setIsLoaded(true);
      }

      // 2) Fetch fresh data from server in background
      Promise.all([
        fetch('/api/wordbooks').then((r) => r.json()),
        fetch('/api/stats').then((r) => r.json()),
        fetch('/api/test-records').then((r) => r.json()),
        fetch('/api/conquered-presets').then((r) => r.json()),
      ])
        .then(([wbData, statsData, recordsData, conqueredData]) => {
          const serverData: AppData = {
            wordBooks: wbData.wordbooks || [],
            wordStats: statsData.stats || {},
            testHistory: recordsData.records || [],
            conqueredPresets: conqueredData.presets || [],
          };

          // If server is empty but localStorage has data, migrate
          const localData = loadData();
          if (
            serverData.wordBooks.length === 0 &&
            localData.wordBooks.length > 0
          ) {
            migrateToServer(localData).then(() => {
              rawDispatch({ type: 'LOAD', data: localData });
              saveCache(user.id, localData);
              setIsLoaded(true);
            });
          } else {
            rawDispatch({ type: 'LOAD', data: serverData });
            saveCache(user.id, serverData);
            setIsLoaded(true);
          }
        })
        .catch(() => {
          // Fallback: use cache if available, otherwise guest localStorage
          if (!cached) {
            rawDispatch({ type: 'LOAD', data: loadData() });
          }
          setIsLoaded(true);
        });
    } else {
      // Guest mode: use localStorage
      rawDispatch({ type: 'LOAD', data: loadData() });
      setIsLoaded(true);
    }
  }, [authLoading, user]);

  // Save to localStorage for guest mode
  useEffect(() => {
    if (!isLoaded || isServerMode) return;
    saveData(data);
  }, [data, isLoaded, isServerMode]);

  // Dispatch wrapper that syncs to server + updates cache
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;

  const dispatch = useCallback(
    (action: Action) => {
      rawDispatch(action);
      if (isServerMode && action.type !== 'LOAD') {
        // Use setTimeout to get updated state after reducer runs
        setTimeout(async () => {
          // Update local cache immediately
          if (userIdRef.current) {
            saveCache(userIdRef.current, dataRef.current);
          }
          // Then sync to server
          const ok = await syncToServer(action, dataRef.current);
          if (!ok) {
            setSyncError('서버 동기화에 실패했습니다. 네트워크 연결을 확인해주세요.');
          }
        }, 0);
      }
    },
    [isServerMode]
  );

  return (
    <AppContext.Provider value={{ data, dispatch, isServerMode, syncError, clearSyncError }}>
      {syncError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-2">
            <span>{syncError}</span>
            <button onClick={clearSyncError} className="text-red-400 hover:text-red-600 font-bold shrink-0">✕</button>
          </div>
        </div>
      )}
      {children}
    </AppContext.Provider>
  );
}

// Migrate localStorage data to server
async function migrateToServer(localData: AppData) {
  try {
    // Upload wordbooks with words
    for (let i = 0; i < localData.wordBooks.length; i++) {
      const wb = localData.wordBooks[i];
      await fetch('/api/wordbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...wb, sortOrder: i }),
      });
    }

    // Upload stats
    if (Object.keys(localData.wordStats).length > 0) {
      await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats: localData.wordStats }),
      });
    }

    // Upload test records
    for (const record of localData.testHistory) {
      await fetch('/api/test-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    }

    // Upload conquered presets
    for (const presetName of localData.conqueredPresets) {
      await fetch('/api/conquered-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetName }),
      });
    }

    // Clear localStorage after successful migration
    if (typeof window !== 'undefined') {
      localStorage.removeItem('word-quiz-app');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
