import { pgTable, text, serial, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  deckId: integer("deck_id").references(() => decks.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const decksRelations = relations(decks, ({ many }) => ({
  vocabulary: many(vocabulary),
}));

export const vocabularyRelations = relations(vocabulary, ({ one }) => ({
  deck: one(decks, {
    fields: [vocabulary.deckId],
    references: [decks.id],
  }),
}));

export const insertStorySchema = createInsertSchema(stories);
export const selectStorySchema = createSelectSchema(stories);
export type InsertStory = typeof stories.$inferInsert;
export type SelectStory = typeof stories.$inferSelect;

export const insertVocabSchema = createInsertSchema(vocabulary);
export const selectVocabSchema = createSelectSchema(vocabulary);
export type InsertVocab = typeof vocabulary.$inferInsert;
export type SelectVocab = typeof vocabulary.$inferSelect;

export const insertDeckSchema = createInsertSchema(decks);
export const selectDeckSchema = createSelectSchema(decks);
export type InsertDeck = typeof decks.$inferInsert;
export type SelectDeck = typeof decks.$inferSelect;