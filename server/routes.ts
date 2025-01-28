import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateStory, generateFormData, translateSentence } from "./lib/openai";
import { db } from "@db";
import { stories, vocabulary, decks } from "@db/schema";
import { desc, eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Deck routes
  app.post("/api/decks", async (req, res) => {
    try {
      const deck = await db.insert(decks)
        .values(req.body)
        .returning();
      res.json(deck[0]);
    } catch (error) {
      console.error("Error creating deck:", error);
      res.status(500).json({ message: "Failed to create deck" });
    }
  });

  app.get("/api/decks", async (_req, res) => {
    try {
      const deckList = await db.query.decks.findMany({
        orderBy: [desc(decks.createdAt)],
        with: {
          vocabulary: true,
        },
      });
      res.json(deckList);
    } catch (error) {
      console.error("Error fetching decks:", error);
      res.status(500).json({ message: "Failed to fetch decks" });
    }
  });

  // Word info route
  app.post("/api/word-info", async (req, res) => {
    try {
      const { word } = req.body;
      console.log("Processing word info request for:", word);

      const prompt = `Analyze this Korean word: "${word}"
    Respond with a JSON object in this format:
    {
      "translation": "English translation",
      "partOfSpeech": "part of speech (noun, verb, adjective, etc.)",
      "context": "A simple, beginner-friendly Korean sentence using this word. Keep it very short (max 5 words)."
    }`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a Korean language expert. Always provide a very simple and short example sentence (max 5 words) that a beginner can understand. Focus on common, everyday usage.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze word");
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      console.log("Word analysis result:", result);

      res.json({
        word,
        translation: result.translation,
        partOfSpeech: result.partOfSpeech,
        context: result.context,
      });
    } catch (error) {
      console.error("Error analyzing word:", error);
      res.status(500).json({ message: "Failed to get word information" });
    }
  });

  // Other existing routes
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
        with: {
          deck: true,
        },
      });
      res.json(vocabItems);
    } catch (error) {
      console.error("Error fetching vocabulary:", error);
      res.status(500).json({ message: "Failed to fetch vocabulary" });
    }
  });

  app.delete("/api/vocabulary/:id", async (req, res) => {
    try {
      const vocabId = parseInt(req.params.id);
      await db.delete(vocabulary).where(eq(vocabulary.id, vocabId));
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting vocabulary:", error);
      res.status(500).json({ message: "Failed to delete vocabulary item" });
    }
  });

  app.put("/api/vocabulary/:id", async (req, res) => {
    try {
      const vocabId = parseInt(req.params.id);
      const vocabItem = await db.update(vocabulary)
        .set(req.body)
        .where(eq(vocabulary.id, vocabId))
        .returning();
      res.json(vocabItem[0]);
    } catch (error) {
      console.error("Error updating vocabulary:", error);
      res.status(500).json({ message: "Failed to update vocabulary item" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}