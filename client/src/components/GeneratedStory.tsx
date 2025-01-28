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
  const [titleTranslationOpen, setTitleTranslationOpen] = useState(false);
  const [sentences, setSentences] = useState<SentenceTranslation[]>(() => {
    // Custom split that keeps quoted text together
    const matches = story.content.match(/[^.!?"]+[.!?"]+\s*(?:[^"\.!?]+[\.!?]+)?/g) || [];
    return matches.map(sentence => ({
      original: sentence.trim(),
      isOpen: false,
      translation: undefined,
    }));
  });

  // Create queries for sentence translations and title translation
  const translationQueries = useQueries({
    queries: [
      // Title translation query
      {
        queryKey: ['translation', story.title],
        queryFn: async () => {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sentence: story.title,
              targetLanguage: 'English'
            }),
          });
          if (!response.ok) throw new Error('Translation failed');
          const data = await response.json();
          return data.translation;
        },
        enabled: false,
      },
      // Sentence translations
      ...sentences.map((sentence) => ({
        queryKey: ['translation', sentence.original],
        queryFn: async () => {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sentence: sentence.original,
              targetLanguage: 'English'
            }),
          });
          if (!response.ok) throw new Error('Translation failed');
          const data = await response.json();
          return data.translation;
        },
        enabled: false,
      })),
    ],
  });

  const toggleTitleTranslation = async () => {
    setTitleTranslationOpen(!titleTranslationOpen);
    if (!titleTranslationOpen && !translationQueries[0].data) {
      try {
        translationQueries[0].refetch();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load title translation",
          variant: "destructive",
        });
      }
    }
  };

  const toggleTranslation = async (index: number) => {
    const newSentences = [...sentences];
    newSentences[index].isOpen = !newSentences[index].isOpen;

    if (newSentences[index].isOpen && !sentences[index].translation) {
      try {
        // Add 1 to index because the first query is for the title
        translationQueries[index + 1].refetch();
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 border-b pb-4">
            <h1 className="text-3xl font-bold flex-grow">{story.title}</h1>
            <Collapsible.Root open={titleTranslationOpen} onOpenChange={toggleTitleTranslation}>
              <Collapsible.Trigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  {titleTranslationOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </Collapsible.Trigger>
            </Collapsible.Root>
          </div>
          <Collapsible.Root open={titleTranslationOpen}>
            <Collapsible.Content className="pl-4 border-l-2 border-primary/20">
              {translationQueries[0].isPending ? (
                <p className="text-sm text-muted-foreground">Loading translation...</p>
              ) : translationQueries[0].error ? (
                <p className="text-sm text-destructive">Failed to load translation</p>
              ) : (
                <p className="text-sm italic">{translationQueries[0].data}</p>
              )}
            </Collapsible.Content>
          </Collapsible.Root>
        </div>

        <div className="space-y-6">
          {sentences.map((sentence, index) => (
            <div key={index}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-lg leading-relaxed flex-grow">{sentence.original}</p>
                <Collapsible.Root open={sentence.isOpen} onOpenChange={() => toggleTranslation(index)}>
                  <Collapsible.Trigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      {sentence.isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </Collapsible.Trigger>
                </Collapsible.Root>
              </div>
              <Collapsible.Root open={sentence.isOpen}>
                <Collapsible.Content className="pt-2 pl-4 border-l-2 border-primary/20">
                  {translationQueries[index + 1].isPending ? (
                    <p className="text-sm text-muted-foreground">Loading translation...</p>
                  ) : translationQueries[index + 1].error ? (
                    <p className="text-sm text-destructive">Failed to load translation</p>
                  ) : (
                    <p className="text-sm italic">{translationQueries[index + 1].data}</p>
                  )}
                </Collapsible.Content>
              </Collapsible.Root>
            </div>
          ))}
        </div>

        <Button 
          onClick={() => saveStory.mutate()} 
          className="w-full"
          disabled={saveStory.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Story
        </Button>
      </div>
    </div>
  );
}