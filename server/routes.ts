import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateStory, generateFormData, translateSentence } from "./lib/openai";
import { db } from "@db";
import { stories } from "@db/schema";

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
        orderBy: (stories, { desc }) => [desc(stories.createdAt)],
      });
      res.json(savedStories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}