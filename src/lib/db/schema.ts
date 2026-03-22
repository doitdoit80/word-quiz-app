import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull().default(''),
  role: text('role').notNull().default('user'),
  gems: integer('gems').notNull().default(10),
  wordbookLimit: integer('wordbook_limit').notNull().default(10),
  passwordResetAt: text('password_reset_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const wordbooks = sqliteTable('wordbooks', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  isPreset: integer('is_preset').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const words = sqliteTable('words', {
  id: text('id').primaryKey(),
  wordbookId: text('wordbook_id').notNull(),
  en: text('en').notNull(),
  ko: text('ko').notNull(),
  example: text('example'),
  mnemonic: text('mnemonic'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const wordStats = sqliteTable('word_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  wordId: text('word_id').notNull(),
  correct: integer('correct').notNull().default(0),
  wrong: integer('wrong').notNull().default(0),
  lastTested: text('last_tested'),
}, (table) => [
  uniqueIndex('word_stats_user_word_idx').on(table.userId, table.wordId),
]);

export const testRecords = sqliteTable('test_records', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull(),
  wordbookId: text('wordbook_id').notNull(),
  wordbookName: text('wordbook_name').notNull(),
  date: text('date').notNull(),
  score: integer('score').notNull(),
  total: integer('total').notNull(),
  wrongWordIds: text('wrong_word_ids').notNull().default('[]'),
});

export const conqueredPresets = sqliteTable('conquered_presets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  presetName: text('preset_name').notNull(),
}, (table) => [
  uniqueIndex('conquered_presets_user_preset_idx').on(table.userId, table.presetName),
]);
