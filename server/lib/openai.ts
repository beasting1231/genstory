import OpenAI from "openai";
import type { StoryFormData, StoryResponse } from "@/lib/types";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateStory(data: StoryFormData): Promise<StoryResponse> {
  const prompt = `
    As a creative writing assistant, create a story with these parameters:
    - Setting: ${data.setting}
    - Main character: ${data.characterName}
    - Additional characters: ${data.additionalCharacters || "None"}
    - Reading level: ${data.readingLevel}
    - Target word count: ${data.wordCount}
    - Additional context: ${data.additionalContext || "None"}

    The story should be appropriate for reading level ${data.readingLevel}.

    Respond with a JSON object containing exactly two fields:
    {
      "title": "A creative title for the story",
      "content": "The complete story text"
    }
  `;

  try {
    console.log("Sending request to OpenAI API...");

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a creative writing assistant. Always respond with a JSON object containing exactly two fields: 'title' and 'content'. The title should be a creative name for the story, and the content should be the complete story text."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 2000
    });

    if (!response.choices[0].message.content) {
      throw new Error("No content in OpenAI response");
    }

    const result = JSON.parse(response.choices[0].message.content);

    if (!result.title || !result.content) {
      console.error("Missing required fields in response:", result);
      throw new Error("Missing required fields in story response");
    }

    console.log("Successfully generated story:", {
      title: result.title,
      contentLength: result.content.length
    });

    return result;
  } catch (error: any) {
    console.error("Error generating story:", error);

    // Check for specific OpenAI error types
    if (error?.error?.type === 'insufficient_quota') {
      throw new Error("OpenAI API quota exceeded. Please check your API key.");
    }
    if (error?.error?.type === 'rate_limit_exceeded') {
      throw new Error("API rate limit exceeded. Please try again in a few minutes.");
    }

    throw error;
  }
}