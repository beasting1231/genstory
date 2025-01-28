import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { SelectDeck } from "@db/schema";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useState, useRef, TouchEvent } from "react";
import { CreateDeckModal } from "@/components/ui/create-deck-modal";
import { AddWordModal } from "@/components/ui/add-word-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmation {
  isOpen: boolean;
  deckId: number | null;
  vocabId: number | null;
}

export default function MyVocab() {
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [showAddWord, setShowAddWord] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    deckId: null,
    vocabId: null,
  });
  const touchStartX = useRef<number | null>(null);
  const [swipedCards, setSwipedCards] = useState<{ [key: number]: number }>({});
  const queryClient = useQueryClient();

  const { data: decks, isLoading: decksLoading, error: decksError } = useQuery<SelectDeck[]>({
    queryKey: ["/api/decks"],
  });

  const deleteVocab = useMutation({
    mutationFn: async ({ deckId, vocabId }: { deckId: number; vocabId: number }) => {
      const response = await fetch(`/api/vocabulary/${vocabId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete vocabulary item");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
    },
  });

  const handleTouchStart = (e: TouchEvent, vocabId: number) => {
    touchStartX.current = e.touches[0].clientX;
    setSwipedCards(prev => ({ ...prev, [vocabId]: 0 }));
  };

  const handleTouchMove = (e: TouchEvent, vocabId: number) => {
    if (touchStartX.current === null) return;

    const touchCurrentX = e.touches[0].clientX;
    const swipeDistance = touchStartX.current - touchCurrentX;

    // Limit swipe to maximum of 100px
    const limitedSwipeDistance = Math.min(Math.max(swipeDistance, 0), 100);

    setSwipedCards(prev => ({ ...prev, [vocabId]: limitedSwipeDistance }));
  };

  const handleTouchEnd = (e: TouchEvent, deckId: number, vocabId: number) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = touchStartX.current - touchEndX;

    if (swipeDistance > 50) {
      setDeleteConfirmation({
        isOpen: true,
        deckId,
        vocabId,
      });
    }

    // Reset swipe state
    setSwipedCards(prev => ({ ...prev, [vocabId]: 0 }));
    touchStartX.current = null;
  };

  if (decksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Loading vocabulary...</h1>
        </div>
      </div>
    );
  }

  if (decksError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-red-500">
            Error loading vocabulary
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">My Vocabulary</h1>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddWord(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Word
            </Button>
            <Button onClick={() => setShowCreateDeck(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Deck
            </Button>
          </div>
        </div>

        {decks?.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You don't have any vocabulary decks yet.
              </p>
              <Button onClick={() => setShowCreateDeck(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Deck
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <h2 className="text-lg font-medium mb-2">My Decks:</h2>
            <Tabs defaultValue={decks?.[0]?.id?.toString()}>
              <TabsList className="relative w-full mb-4 overflow-hidden">
                <div className="overflow-x-auto flex [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {decks?.map((deck) => (
                    <TabsTrigger 
                      key={deck.id} 
                      value={deck.id.toString()}
                      className="shrink-0"
                    >
                      {deck.name}
                    </TabsTrigger>
                  ))}
                </div>
              </TabsList>

              {decks?.map((deck) => (
                <TabsContent key={deck.id} value={deck.id.toString()}>
                  <div className="grid gap-4 md:grid-cols-3">
                    {deck.vocabulary?.map((item, index) => (
                      <div key={item.id} className="relative overflow-hidden rounded-lg">
                        <div
                          className="absolute inset-0 bg-red-500 flex items-center justify-end pr-4"
                        >
                          <Trash2 className="h-5 w-5 text-white" />
                        </div>
                        <Card 
                          className={cn(
                            "shadow-md transition-transform duration-200 touch-pan-y relative bg-background",
                            "transform transition-transform duration-200 ease-out"
                          )}
                          style={{
                            transform: `translateX(-${swipedCards[item.id] || 0}px)`,
                          }}
                          onTouchStart={(e) => handleTouchStart(e, item.id)}
                          onTouchMove={(e) => handleTouchMove(e, item.id)}
                          onTouchEnd={(e) => handleTouchEnd(e, deck.id, item.id)}
                        >
                          <CardContent className="pt-6 px-4">
                            <p className="text-xl font-bold text-left">
                              {index + 1}. {item.word}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.translation}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}

        <CreateDeckModal 
          open={showCreateDeck} 
          onOpenChange={setShowCreateDeck} 
        />

        <AddWordModal
          open={showAddWord}
          onOpenChange={setShowAddWord}
          decks={decks || []}
        />

        <AlertDialog 
          open={deleteConfirmation.isOpen}
          onOpenChange={(isOpen) => 
            setDeleteConfirmation(prev => ({ ...prev, isOpen }))
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Word</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this word? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteConfirmation.deckId && deleteConfirmation.vocabId) {
                    deleteVocab.mutate({
                      deckId: deleteConfirmation.deckId,
                      vocabId: deleteConfirmation.vocabId,
                    });
                  }
                  setDeleteConfirmation({ isOpen: false, deckId: null, vocabId: null });
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}