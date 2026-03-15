export interface Word {
  id: string;
  en: string;
  ko: string;
  example?: string;
  mnemonic?: string;
}

export interface WordBook {
  id: string;
  name: string;
  words: Word[];
  createdAt: string;
  isPreset?: boolean;
}

export interface WordStat {
  correct: number;
  wrong: number;
  lastTested?: string;
}

export interface TestRecord {
  id: string;
  wordBookId: string;
  wordBookName: string;
  date: string;
  score: number;
  total: number;
  wrongWordIds: string[];
}

export interface AppData {
  wordBooks: WordBook[];
  wordStats: Record<string, WordStat>;
  testHistory: TestRecord[];
  conqueredPresets: string[];
}
