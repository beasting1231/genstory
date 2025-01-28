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

    Provide the response in JSON format with a title and content field.
  `;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://github.com/openrouter-ai/openrouter-examples",
      "X-Title": "AI Graded Reader Generator"
    },
    body: JSON.stringify({
      model: "deepseek-ai/deepseek-llm-67b-chat",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const result = await response.json();
  const content = JSON.parse(result.choices[0].message.content || '{"title": "", "content": ""}');
  return content as StoryResponse;
}