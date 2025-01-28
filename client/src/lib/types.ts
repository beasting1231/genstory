export interface StoryFormData {
  setting: string;
  characterName: string;
  additionalCharacters: string;
  readingLevel: string;
  wordCount: number;
  additionalContext: string;
  language?: string;
}

export interface StoryResponse {
  title: string;
  content: string;
}