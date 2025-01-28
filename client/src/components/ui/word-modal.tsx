import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { CreateDeckModal } from "./create-deck-modal";
import { SelectDeck } from "@db/schema";

interface WordModalProps {
  word: string;
  translation: string;
  partOfSpeech: string;
  context?: string;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export function WordModal({
  word,
  translation,
  partOfSpeech,
  context,
  isOpen,
  onClose,
  isLoading = false,
}: WordModalProps) {
  const { toast } = useToast();
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const queryClient = useQueryClient();

  const { data: decks } = useQuery<SelectDeck[]>({
    queryKey: ["/api/decks"],
  });

  const saveToVocab = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          translation,
          partOfSpeech,
          context,
          deckId: parseInt(selectedDeckId),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save to vocabulary");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Success",
        description: "Word saved to your vocabulary",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save word. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold capitalize">{word}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Button
              type="button"
              onClick={() => saveToVocab.mutate()}
              disabled={!selectedDeckId || saveToVocab.isPending || isLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save to My Vocab
            </Button>
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-2/3"></div>
              </div>
            ) : (
              <>
                <div>
                  <span className="font-medium">Translation:</span>
                  <p className="mt-1">{translation}</p>
                </div>
                <div>
                  <span className="font-medium">Part of Speech:</span>
                  <p className="mt-1 capitalize">{partOfSpeech}</p>
                </div>
                {context && (
                  <div>
                    <span className="font-medium">Context:</span>
                    <p className="mt-1 text-sm italic">"{context}"</p>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Select Deck</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateDeck(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Deck
                </Button>
              </div>
              <Select
                value={selectedDeckId}
                onValueChange={setSelectedDeckId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a deck" />
                </SelectTrigger>
                <SelectContent>
                  {decks?.map((deck) => (
                    <SelectItem key={deck.id} value={deck.id.toString()}>
                      {deck.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateDeckModal
        open={showCreateDeck}
        onOpenChange={setShowCreateDeck}
      />
    </>
  );
}