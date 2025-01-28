import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { SelectStory } from "@db/schema";
import { GeneratedStory } from "@/components/GeneratedStory";

export default function StoryPage() {
  const [, params] = useRoute<{ id: string }>("/story/:id");
  const storyId = params?.id;

  const { data: story, isLoading, error } = useQuery<SelectStory>({
    queryKey: [`/api/stories/${storyId}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Loading story...</h1>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-red-500">
            Error loading story
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <GeneratedStory 
          story={{
            title: story.title,
            content: story.content
          }}
          readingLevel={story.readingLevel}
          wordCount={story.wordCount}
          hideActions={true}
        />
      </div>
    </div>
  );
}
