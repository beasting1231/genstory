import OpenAI from "openai";
import type { StoryFormData, StoryResponse } from "@/lib/types";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function generateFormData(): Promise<Partial<StoryFormData>> {
  const prompt = `
    Generate a story setup with these constraints:
    1. The setting must be modern/contemporary (no fantasy or historical settings)
    2. The setting must be 3 words or less
    3. The character names should be modern and realistic
    4. No supernatural or fantasy elements

    Respond with a JSON object in this format:
    {
      "setting": "string (max 3 words)",
      "characterName": "string",
      "additionalCharacters": "string (2-3 names)",
      "additionalContext": "string (1-2 sentences of context)"
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a writing assistant that generates contemporary story setups. Always use modern settings and realistic character names.",
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    if (!response.choices[0].message.content) {
      throw new Error("No content in OpenAI response");
    }

    return JSON.parse(response.choices[0].message.content);
  } catch (error: any) {
    console.error("Error generating form data:", error);
    throw error;
  }
}

export async function generateStory(data: StoryFormData): Promise<StoryResponse> {
  const prompt = `
    As a creative writing assistant, create a story in ${data.language || "English"} with these parameters:
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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

    return result;
  } catch (error: any) {
    console.error("Error generating story:", error);

    if (error?.error?.type === 'insufficient_quota') {
      throw new Error("OpenAI API quota exceeded. Please check your API key.");
    }
    if (error?.error?.type === 'rate_limit_exceeded') {
      throw new Error("API rate limit exceeded. Please try again in a few minutes.");
    }

    throw error;
  }
}