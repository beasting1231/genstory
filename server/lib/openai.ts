import type { StoryFormData, StoryResponse } from "@/lib/types";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is required");
}

function stripMarkdownCodeBlock(content: string): string {
  // Remove markdown code block syntax if present
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return jsonMatch ? jsonMatch[1] : content;
}

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

    Structure your response in this exact JSON format:
    {
      "title": "A creative title for the story",
      "content": "The complete story text"
    }
  `;

  try {
    console.log("Sending request to OpenRouter API...");
    console.log("Request payload:", {
      model: "google/gemini-2.0-flash-thinking-exp:free",
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
      temperature: 0.8,
      max_tokens:2000
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://github.com/openrouter-ai/openrouter-examples",
        "X-Title": "AI Graded Reader Generator"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-thinking-exp:free",
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
        temperature: 0.8,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter API error response:", errorData);

      // Check for rate limit error
      if (response.status === 429) {
        throw new Error("API rate limit exceeded. Please try again in a few minutes.");
      }

      throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log("OpenRouter API raw response:", JSON.stringify(result, null, 2));

    // Check for error in the API response
    if (result.error) {
      console.error("OpenRouter API returned error:", result.error);
      if (result.error.code === 429) {
        throw new Error("API rate limit exceeded. Please try again in a few minutes.");
      }
      throw new Error(result.error.message || "Unknown API error occurred");
    }

    if (!result.choices?.[0]?.message?.content) {
      console.error("Invalid response structure:", result);
      throw new Error("Invalid response format from OpenRouter API");
    }

    let parsedContent: StoryResponse;
    try {
      const content = result.choices[0].message.content;
      console.log("Raw content from API:", content);

      // Strip markdown code block if present and then parse JSON
      const cleanContent = stripMarkdownCodeBlock(content);
      console.log("Cleaned content:", cleanContent);

      // Parse the cleaned content
      parsedContent = JSON.parse(cleanContent);

      if (!parsedContent.title || !parsedContent.content) {
        console.error("Missing required fields in response:", parsedContent);
        throw new Error("Missing required fields in story response");
      }

      console.log("Successfully parsed story:", {
        title: parsedContent.title,
        contentLength: parsedContent.content.length
      });
    } catch (error: any) {
      console.error("Parse error:", error, "Content:", result.choices[0].message.content);
      throw new Error("Failed to parse story response: " + error.message);
    }

    return parsedContent;
  } catch (error: any) {
    console.error("Error generating story:", error);
    throw error;
  }
}