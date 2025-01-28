import { Button } from "@/components/ui/button";
import { useMutation, useQueries } from "@tanstack/react-query";
import { StoryResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Save, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useCallback } from "react";
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
  const [showWordModal, setShowWordModal] = useState(false);
  const [sentences, setSentences] = useState<SentenceTranslation[]>(() => {
    const matches = story.content.match(/(?:[^.!?"]+|"[^"]*"[^.!?]*)+[.!?]+/g) || [];
    return matches.map(sentence => ({
      original: sentence.trim(),
      isOpen: false,
      translation: undefined,
    }));
  });

  const storedLanguage = localStorage.getItem("storyLanguage") || "English";

  const translationQueries = useQueries({
    queries: [
      {
        queryKey: ['translation', story.title],
        queryFn: async () => {
          console.log('Translating title:', story.title);
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sentence: story.title,
              targetLanguage: storedLanguage
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Translation error:', errorText);
            throw new Error(errorText || 'Translation failed');
          }

          const data = await response.json();
          console.log('Translation response:', data);
          return data.translation;
        },
        enabled: false,
        retry: 1,
      },
      ...sentences.map((sentence) => ({
        queryKey: ['translation', sentence.original],
        queryFn: async () => {
          console.log('Translating sentence:', sentence.original);
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sentence: sentence.original,
              targetLanguage: storedLanguage
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Translation error:', errorText);
            throw new Error(errorText || 'Translation failed');
          }

          const data = await response.json();
          console.log('Translation response:', data);
          return data.translation;
        },
        enabled: false,
        retry: 1,
      })),
    ],
  });

  const handleWordClick = useCallback((word: string, context: string) => {
    const cleanWord = word.replace(/[^\p{L}']/gu, '').trim();
    if (cleanWord) {
      console.log('Clicked word:', cleanWord);
      getWordInfo.mutate({ word: cleanWord, context });
    }
  }, []);

  const toggleTitleTranslation = useCallback(async () => {
    setTitleTranslationOpen(prev => !prev);
    if (!titleTranslationOpen) {
      console.log('Triggering title translation');
      await translationQueries[0].refetch();
    }
  }, [titleTranslationOpen, translationQueries]);

  const toggleTranslation = useCallback(async (index: number) => {
    setSentences(prev => {
      const newSentences = [...prev];
      newSentences[index] = {
        ...newSentences[index],
        isOpen: !newSentences[index].isOpen,
      };
      return newSentences;
    });

    try {
      if (!sentences[index].isOpen) {
        console.log(`Triggering translation for sentence ${index}`);
        await translationQueries[index + 1].refetch();
      }
    } catch (error) {
      console.error(`Error toggling translation for sentence ${index}:`, error);
      toast({
        title: "Error",
        description: "Failed to load translation. Please try again.",
        variant: "destructive",
      });
    }
  }, [sentences, translationQueries, toast]);

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
      setShowWordModal(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get word information",
        variant: "destructive",
      });
    },
  });

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

  const renderWord = useCallback((word: string, context: string) => {
    if (!word.trim()) return " ";
    if (/^[,.!?;:()]+$/.test(word)) return word;

    return (
      <span
        onClick={() => handleWordClick(word, context)}
        className="cursor-pointer inline-block px-0.5 hover:bg-primary/10 hover:text-primary rounded"
        role="button"
        tabIndex={0}
      >
        {word}
      </span>
    );
  }, [handleWordClick]);

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
            <Collapsible.Content className="pl-4 border-l-2 border-primary/20">
              {translationQueries[0].isPending ? (
                <p className="text-sm text-muted-foreground">Loading translation...</p>
              ) : translationQueries[0].error ? (
                <p className="text-sm text-destructive">
                  {translationQueries[0].error instanceof Error 
                    ? translationQueries[0].error.message 
                    : 'Failed to load translation'}
                </p>
              ) : (
                <p className="text-sm italic">{translationQueries[0].data}</p>
              )}
            </Collapsible.Content>
          </Collapsible.Root>
        </div>
      </div>

      <div className="space-y-6">
        {sentences.map((sentence, index) => (
          <Collapsible.Root 
            key={index}
            open={sentence.isOpen}
            onOpenChange={() => toggleTranslation(index)}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-lg leading-relaxed flex-grow">
                  {sentence.original.split(/\s+/).map((word, wordIndex) => (
                    <span key={wordIndex}>
                      {renderWord(word, sentence.original)}
                      {wordIndex !== sentence.original.split(/\s+/).length - 1 && " "}
                    </span>
                  ))}
                </div>
                <Collapsible.Trigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {sentence.isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </Collapsible.Trigger>
              </div>
              <Collapsible.Content className="pl-4 border-l-2 border-primary/20">
                {translationQueries[index + 1].isPending ? (
                  <p className="text-sm text-muted-foreground">Loading translation...</p>
                ) : translationQueries[index + 1].error ? (
                  <p className="text-sm text-destructive">
                    {translationQueries[index + 1].error instanceof Error 
                      ? translationQueries[index + 1].error.message 
                      : 'Failed to load translation'}
                  </p>
                ) : (
                  <p className="text-sm italic">{translationQueries[index + 1].data}</p>
                )}
              </Collapsible.Content>
            </div>
          </Collapsible.Root>
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
          isOpen={showWordModal}
          onClose={() => {
            setShowWordModal(false);
            setSelectedWord(null);
          }}
        />
      )}
    </div>
  );
}