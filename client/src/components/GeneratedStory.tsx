import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQueries } from "@tanstack/react-query";
import { StoryResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Save, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";

interface GeneratedStoryProps {
  story: StoryResponse;
  readingLevel: string;
  wordCount: number;
}

interface SentenceTranslation {
  original: string;
  isOpen: boolean;
  translation?: string;
}

export function GeneratedStory({ story, readingLevel, wordCount }: GeneratedStoryProps) {
  const { toast } = useToast();
  const [sentences, setSentences] = useState<SentenceTranslation[]>(() => {
    // Split content into sentences (basic splitting by . ! ?)
    return story.content
      .match(/[^.!?]+[.!?]+/g)
      ?.map(sentence => ({
        original: sentence.trim(),
        isOpen: false,
        translation: undefined,
      })) || [];
  });

  // Create multiple queries for translations
  const translationQueries = useQueries({
    queries: sentences.map((sentence, index) => ({
      queryKey: ['translation', sentence.original],
      queryFn: async () => {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sentence: sentence.original,
            targetLanguage: localStorage.getItem('targetLanguage') || 'Spanish'
          }),
        });
        if (!response.ok) throw new Error('Translation failed');
        const data = await response.json();
        return data.translation;
      },
      enabled: false, // Don't fetch automatically
    })),
  });

  const toggleTranslation = async (index: number) => {
    const newSentences = [...sentences];
    newSentences[index].isOpen = !newSentences[index].isOpen;

    // If opening and translation not loaded yet, fetch it
    if (newSentences[index].isOpen && !sentences[index].translation) {
      try {
        translationQueries[index].refetch();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load translation",
          variant: "destructive",
        });
      }
    }

    setSentences(newSentences);
  };

  const saveStory = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: story.title,
          content: story.content,
          readingLevel,
          wordCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save story");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Story saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save story. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{story.title}</CardTitle>
          <Button 
            onClick={() => saveStory.mutate()} 
            variant="outline" 
            size="sm"
            disabled={saveStory.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Story
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sentences.map((sentence, index) => (
            <div key={index} className="space-y-2">
              <p className="text-lg leading-relaxed">{sentence.original}</p>
              <Collapsible.Root open={sentence.isOpen} onOpenChange={() => toggleTranslation(index)}>
                <Collapsible.Trigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {sentence.isOpen ? (
                      <ChevronUp className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    )}
                    {sentence.isOpen ? "Hide" : "Show"} Translation
                  </Button>
                </Collapsible.Trigger>
                <Collapsible.Content className="pt-2 pl-4 border-l-2 border-primary/20">
                  {translationQueries[index].isPending ? (
                    <p className="text-sm text-muted-foreground">Loading translation...</p>
                  ) : translationQueries[index].error ? (
                    <p className="text-sm text-destructive">Failed to load translation</p>
                  ) : (
                    <p className="text-sm italic">{translationQueries[index].data}</p>
                  )}
                </Collapsible.Content>
              </Collapsible.Root>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}