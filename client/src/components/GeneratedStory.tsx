import { Button } from "@/components/ui/button";
import { useMutation, useQueries } from "@tanstack/react-query";
import { StoryResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Save, ChevronDown, ChevronUp, RotateCw } from "lucide-react";
import { useState, useCallback } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { WordModal } from "@/components/ui/word-modal";

interface GeneratedStoryProps {
  story: StoryResponse;
  readingLevel: string;
  wordCount: number;
  hideActions?: boolean;
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

export function GeneratedStory({ story, readingLevel, wordCount, hideActions = false }: GeneratedStoryProps) {
  const { toast } = useToast();
  const [titleTranslationOpen, setTitleTranslationOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordInfo | null>(null);
  const [showWordModal, setShowWordModal] = useState(false);
  const [wordInfoLoading, setWordInfoLoading] = useState(false);
  const [refreshingIndex, setRefreshingIndex] = useState<number | null>(null);
  const [sentences, setSentences] = useState<SentenceTranslation[]>(() => {
    const matches = story.content.match(/(?:[^.!?"]+|"[^"]*"[^.!?]*)+[.!?]+/g) || [];
    return matches.map(sentence => ({
      original: sentence.trim(),
      isOpen: false,
      translation: undefined,
    }));
  });

  const translationQueries = useQueries({
    queries: [
      {
        queryKey: ['translation', story.title],
        queryFn: async () => {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sentence: story.title,
              targetLanguage: 'English' // Force English translations
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Translation failed');
          }

          const data = await response.json();
          return data.translation;
        },
        enabled: false,
        retry: 1,
      },
      ...sentences.map((sentence) => ({
        queryKey: ['translation', sentence.original],
        queryFn: async () => {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sentence: sentence.original,
              targetLanguage: 'English' // Force English translations
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Translation failed');
          }

          const data = await response.json();
          return data.translation;
        },
        enabled: false,
        retry: 1,
      })),
    ],
  });

  const retranslate = useCallback(async (index: number) => {
    try {
      setRefreshingIndex(index);
      const query = translationQueries[index];
      await query.refetch();
      setRefreshingIndex(null);

      toast({
        title: "Success",
        description: "Translation updated",
      });
    } catch (error) {
      console.error('Retranslation error:', error);
      setRefreshingIndex(null);
      toast({
        title: "Error",
        description: "Failed to update translation. Please try again.",
        variant: "destructive",
      });
    }
  }, [translationQueries, toast]);

  const handleWordClick = useCallback((word: string, context: string) => {
    const cleanWord = word.replace(/[^\p{L}']/gu, '').trim();
    if (cleanWord) {
      setWordInfoLoading(true);
      setSelectedWord({
        word: cleanWord,
        translation: '',
        partOfSpeech: '',
        context: context
      });
      setShowWordModal(true);
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
      setWordInfoLoading(false);
    },
    onError: () => {
      setWordInfoLoading(false);
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
        <div className="border-b pb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{story.title}</h1>
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
              <Collapsible.Content className="pl-4 border-l-2 border-primary/20 mt-2">
                {translationQueries[0].isPending || refreshingIndex === 0 ? (
                  <p className="text-sm text-muted-foreground">Loading translation...</p>
                ) : translationQueries[0].error ? (
                  <p className="text-sm text-destructive">
                    {translationQueries[0].error instanceof Error
                      ? translationQueries[0].error.message
                      : 'Failed to load translation'}
                  </p>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <p className="text-sm italic">{translationQueries[0].data}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 ml-2"
                      disabled={translationQueries[0].isPending || refreshingIndex === 0}
                      onClick={() => retranslate(0)}
                    >
                      <RotateCw className={`h-4 w-4 ${(translationQueries[0].isPending || refreshingIndex === 0) ? 'animate-spin' : ''}`} />
                      <span className="sr-only">Retranslate title</span>
                    </Button>
                  </div>
                )}
              </Collapsible.Content>
            </Collapsible.Root>
          </div>
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
                <div className="flex flex-col gap-2">
                  {translationQueries[index + 1].isPending || refreshingIndex === index + 1 ? (
                    <p className="text-sm text-muted-foreground">Loading translation...</p>
                  ) : translationQueries[index + 1].error ? (
                    <p className="text-sm text-destructive">
                      {translationQueries[index + 1].error instanceof Error
                        ? translationQueries[index + 1].error.message
                        : 'Failed to load translation'}
                    </p>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <p className="text-sm italic">{translationQueries[index + 1].data}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 ml-2"
                        disabled={translationQueries[index + 1].isPending || refreshingIndex === index + 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          retranslate(index + 1);
                        }}
                      >
                        <RotateCw className={`h-4 w-4 ${(translationQueries[index + 1].isPending || refreshingIndex === index + 1) ? 'animate-spin' : ''}`} />
                        <span className="sr-only">Retranslate sentence</span>
                      </Button>
                    </div>
                  )}
                </div>
              </Collapsible.Content>
            </div>
          </Collapsible.Root>
        ))}
      </div>

      {!hideActions && (
        <Button
          onClick={() => saveStory.mutate()}
          className="w-full"
          disabled={saveStory.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Story
        </Button>
      )}

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
            setWordInfoLoading(false);
          }}
          isLoading={wordInfoLoading}
        />
      )}
    </div>
  );
}