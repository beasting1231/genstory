import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateStory, generateFormData, translateSentence } from "./lib/openai";
import { db } from "@db";
import { stories, vocabulary } from "@db/schema";
import { desc, eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  app.post("/api/word-info", async (req, res) => {
    try {
      const { word, context } = req.body;
      console.log("Processing word info request for:", word);

      // For Korean words, use OpenAI for both translation and part of speech
      const prompt = `Analyze this Korean word or character: "${word}"
      Consider the context: "${context}"

      If this is part of a larger word, try to identify the complete word and its meaning.

      Respond with a JSON object in this format:
      {
        "translation": "English translation",
        "partOfSpeech": "part of speech (noun, verb, adjective, particle, etc.)",
        "note": "Optional note about usage or if this is part of a larger word"
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
              content: "You are a Korean language expert. Provide accurate translations and grammatical analysis of Korean words and particles. You understand Korean word boundaries and can identify when a character is part of a larger word.",
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
        context,
        note: result.note
      });
    } catch (error) {
      console.error("Error analyzing word:", error);
      res.status(500).json({ message: "Failed to get word information" });
    }
  });

  // Keep existing routes unchanged
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