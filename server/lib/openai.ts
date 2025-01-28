import type { StoryFormData, StoryResponse } from "@/lib/types";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is required");
}

export async function generateStory(data: StoryFormData): Promise<StoryResponse> {
  const prompt = `
    Create a story with the following parameters:
    - Setting: ${data.setting}
    - Main character: ${data.characterName}
    - Additional characters: ${data.additionalCharacters || "None"}
    - Reading level: ${data.readingLevel}
    - Target word count: ${data.wordCount}
    - Additional context: ${data.additionalContext || "None"}

    The story should be appropriate for the specified reading level (${data.readingLevel}):
    - A1: Very simple vocabulary and grammar
    - A2: Basic vocabulary and simple present tense
    - B1: Intermediate vocabulary and mixed tenses
    - B2: Advanced vocabulary and complex sentences
    - C1: Rich vocabulary and idiomatic expressions
    - C2: Native-level complexity

    Return a JSON object with exactly two fields:
    {
      "title": "The story title",
      "content": "The full story content"
    }
  `;

  try {
    console.log("Sending request to OpenRouter API...");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://github.com/openrouter-ai/openrouter-examples",
        "X-Title": "AI Graded Reader Generator"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1",
        messages: [
          {
            role: "system",
            content: "You are a creative writing assistant that creates engaging and level-appropriate stories based on user parameters. Always return stories in JSON format with 'title' and 'content' fields. Ensure the vocabulary and grammar complexity matches the requested reading level."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.7,
        format: "json"
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter API error response:", errorData);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log("OpenRouter API response:", JSON.stringify(result, null, 2));

    if (!result.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from OpenRouter API");
    }

    let parsedContent: StoryResponse;
    try {
      const content = result.choices[0].message.content;
      console.log("Attempting to parse content:", content);

      // If content is already an object, use it directly
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;

      if (!parsedContent.title || !parsedContent.content) {
        throw new Error("Missing required fields in story response");
      }
    } catch (error: any) {
      console.error("Parse error:", error);
      throw new Error("Failed to parse story response: " + error.message);
    }

    return parsedContent;
  } catch (error: any) {
    console.error("Error details:", error);
    throw error;
  }
}