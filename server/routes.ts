import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateStory, generateFormData, translateSentence } from "./lib/openai";
import { db } from "@db";
import { stories, vocabulary } from "@db/schema";
import { desc, eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  app.post("/api/generate", async (req, res) => {
    try {
      const storyData = req.body;
      const story = await generateStory(storyData);
      res.json(story);
    } catch (error) {
      console.error("Error generating story:", error);
      res.status(500).json({ message: "Failed to generate story" });
    }
  });

  app.post("/api/generate-form", async (_req, res) => {
    try {
      const formData = await generateFormData();
      res.json(formData);
    } catch (error) {
      console.error("Error generating form data:", error);
      res.status(500).json({ message: "Failed to generate form data" });
    }
  });

  app.post("/api/translate", async (req, res) => {
    try {
      const { sentence, targetLanguage } = req.body;
      const translation = await translateSentence(sentence, targetLanguage);
      res.json({ translation });
    } catch (error) {
      console.error("Error translating sentence:", error);
      res.status(500).json({ message: "Failed to translate sentence" });
    }
  });

  app.post("/api/word-info", async (req, res) => {
    try {
      const { word, context } = req.body;
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch word information");
      }

      const data = await response.json();
      const meanings = data[0]?.meanings || [];
      const partOfSpeech = meanings[0]?.partOfSpeech || "unknown";

      // Get translation
      const translation = await translateSentence(word);

      res.json({
        word,
        translation,
        partOfSpeech,
        context,
      });
    } catch (error) {
      console.error("Error fetching word info:", error);
      res.status(500).json({ message: "Failed to get word information" });
    }
  });

  app.post("/api/stories", async (req, res) => {
    try {
      const { title, content, readingLevel, wordCount } = req.body;
      const story = await db.insert(stories).values({
        title,
        content,
        readingLevel,
        wordCount,
      }).returning();
      res.json(story[0]);
    } catch (error) {
      console.error("Error saving story:", error);
      res.status(500).json({ message: "Failed to save story" });
    }
  });

  app.get("/api/stories", async (_req, res) => {
    try {
      const savedStories = await db.query.stories.findMany({
        orderBy: [desc(stories.createdAt)],
      });
      res.json(savedStories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.post("/api/vocabulary", async (req, res) => {
    try {
      const vocabItem = await db.insert(vocabulary)
        .values(req.body)
        .returning();
      res.json(vocabItem[0]);
    } catch (error) {
      console.error("Error saving vocabulary:", error);
      res.status(500).json({ message: "Failed to save vocabulary item" });
    }
  });

  app.get("/api/vocabulary", async (_req, res) => {
    try {
      const vocabItems = await db.query.vocabulary.findMany({
        orderBy: [desc(vocabulary.createdAt)],
      });
      res.json(vocabItems);
    } catch (error) {
      console.error("Error fetching vocabulary:", error);
      res.status(500).json({ message: "Failed to fetch vocabulary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}