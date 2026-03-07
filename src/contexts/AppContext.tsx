'use client';

import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import type { AppData, Word, TestRecord } from '@/lib/types';
import { loadData, saveData } from '@/lib/storage';
import { generateId } from '@/lib/utils';

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
  | { type: 'RENAME_WORDBOOK'; id: string; name: string };

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
            ? { ...wb, words: [...wb.words, { ...action.word, id: generateId() }] }
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
        wordBooks: state.wordBooks.map((wb) =>
          wb.id === action.wordBookId
            ? {
                ...wb,
                words: [
                  ...wb.words,
                  ...action.words.map((w) => ({ ...w, id: generateId() })),
                ],
              }
            : wb
        ),
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
      return {
        ...state,
        testHistory: [{ ...action.record, id: generateId() }, ...state.testHistory],
        wordStats: updatedStats,
      };
    }

    case 'RENAME_WORDBOOK':
      return {
        ...state,
        wordBooks: state.wordBooks.map((wb) =>
          wb.id === action.id ? { ...wb, name: action.name } : wb
        ),
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

interface AppContextValue {
  data: AppData;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(reducer, {
    wordBooks: [],
    wordStats: {},
    testHistory: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    dispatch({ type: 'LOAD', data: loadData() });
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    saveData(data);
  }, [data, isLoaded]);

  return <AppContext.Provider value={{ data, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
