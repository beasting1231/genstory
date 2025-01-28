import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  readingLevel: text("reading_level").notNull(),
  wordCount: integer("word_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vocabulary = pgTable("vocabulary", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  translation: text("translation").notNull(),
  partOfSpeech: text("part_of_speech").notNull(),
  context: text("context"),
  userId: integer("user_id"), // For future auth integration
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStorySchema = createInsertSchema(stories);
export const selectStorySchema = createSelectSchema(stories);
export type InsertStory = typeof stories.$inferInsert;
export type SelectStory = typeof stories.$inferSelect;

export const insertVocabSchema = createInsertSchema(vocabulary);
export const selectVocabSchema = createSelectSchema(vocabulary);
export type InsertVocab = typeof vocabulary.$inferInsert;
export type SelectVocab = typeof vocabulary.$inferSelect;