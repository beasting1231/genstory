import { Button } from "@/components/ui/button";
import { useMutation, useQueries } from "@tanstack/react-query";
import { StoryResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Save, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { WordModal } from "@/components/ui/word-modal";

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

interface WordInfo {
  word: string;
  translation: string;
  partOfSpeech: string;
  context: string;
}

export function GeneratedStory({ story, readingLevel, wordCount }: GeneratedStoryProps) {
  const { toast } = useToast();
  const [titleTranslationOpen, setTitleTranslationOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordInfo | null>(null);
  const [sentences, setSentences] = useState<SentenceTranslation[]>(() => {
    const matches = story.content.match(/(?:[^.!?"]+|"[^"]*"[^.!?]*)+[.!?]+/g) || [];
    return matches.map(sentence => ({
      original: sentence.trim(),
      isOpen: false,
      translation: undefined,
    }));
  });

  // Translation queries setup
  const translationQueries = useQueries({
    queries: [
      {
        queryKey: ['translation', story.title],
        queryFn: async () => {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sentence: story.title }),
          });
          if (!response.ok) throw new Error('Translation failed');
          const data = await response.json();
          return data.translation;
        },
        enabled: false,
      },
      ...sentences.map((sentence) => ({
        queryKey: ['translation', sentence.original],
        queryFn: async () => {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sentence: sentence.original }),
          });
          if (!response.ok) throw new Error('Translation failed');
          const data = await response.json();
          return data.translation;
        },
        enabled: false,
      })),
    ],
  });

  const getWordInfo = useMutation({
    mutationFn: async ({ word, context }: { word: string; context: string }) => {
      const response = await fetch("/api/word-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, context }),
      });

      if (!response.ok) {
        throw new Error("Failed to get word information");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setSelectedWord(data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get word information",
        variant: "destructive",
      });
    },
  });

  const handleWordClick = (word: string, context: string) => {
    // Clean the word by removing any punctuation
    const cleanWord = word.replace(/[^a-zA-Z']/g, '').toLowerCase();
    if (cleanWord) {
      getWordInfo.mutate({ word: cleanWord, context });
    }
  };

  const toggleTitleTranslation = async () => {
    setTitleTranslationOpen(!titleTranslationOpen);
    if (!titleTranslationOpen && !translationQueries[0].data) {
      translationQueries[0].refetch();
    }
  };

  const toggleTranslation = async (index: number) => {
    setSentences(prev => {
      const newSentences = [...prev];
      newSentences[index].isOpen = !newSentences[index].isOpen;
      return newSentences;
    });

    if (!sentences[index].isOpen && !translationQueries[index + 1].data) {
      translationQueries[index + 1].refetch();
    }
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
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 border-b pb-4">
          <h1 className="text-3xl font-bold flex-grow">{story.title}</h1>
          <Collapsible.Root open={titleTranslationOpen} onOpenChange={toggleTitleTranslation}>
            <Collapsible.Trigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg leading-relaxed flex-grow">
                {sentence.original.split(/(\s+|[,.!?;:()]|\b)/).map((part, i) => {
                  // If the part is just whitespace or punctuation, render it directly
                  if (!part.trim() || /^[,.!?;:()]+$/.test(part)) {
                    return part;
                  }
                  // If it's a word, make it clickable
                  if (/^[A-Za-z']+$/.test(part)) {
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleWordClick(part, sentence.original);
                        }}
                        className="hover:text-primary hover:underline focus:outline-none focus:text-primary focus:underline cursor-pointer px-0.5 inline-block"
                      >
                        {part}
                      </button>
                    );
                  }
                  return part;
                })}
              </p>
              <Collapsible.Root open={sentence.isOpen} onOpenChange={() => toggleTranslation(index)}>
                <Collapsible.Trigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
              <Collapsible.Content className="pl-4 border-l-2 border-primary/20">
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

      {selectedWord && (
        <WordModal
          word={selectedWord.word}
          translation={selectedWord.translation}
          partOfSpeech={selectedWord.partOfSpeech}
          context={selectedWord.context}
          isOpen={true}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}