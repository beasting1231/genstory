import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectStory } from "@db/schema";
import { format } from "date-fns";
import { useLocation } from "wouter";

export default function SavedStories() {
  const [, setLocation] = useLocation();
  const { data: stories, isLoading, error } = useQuery<SelectStory[]>({
    queryKey: ["/api/stories"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Loading stories...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-red-500">
            Error loading stories
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Saved Stories</h1>
        <div className="space-y-6">
          {stories?.map((story) => (
            <Card 
              key={story.id} 
              className="shadow-md cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setLocation(`/story/${story.id}`)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">{story.title}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(story.createdAt), "PP")}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Reading Level: {story.readingLevel} • {story.wordCount} words
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none relative">
                  <div className="max-h-32 overflow-hidden relative">
                    {story.content.split("\n").map((paragraph, index) => (
                      <p key={index} className="mb-4">
                        {paragraph}
                      </p>
                    ))}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}