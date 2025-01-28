import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SelectDeck } from "@db/schema";
import { Wand2 } from "lucide-react";

interface AddWordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decks: SelectDeck[];
}

export function AddWordModal({ open, onOpenChange, decks }: AddWordModalProps) {
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [context, setContext] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const autofillWord = useMutation({
    mutationFn: async () => {
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
      setTranslation(data.translation);
      setPartOfSpeech(data.partOfSpeech.toLowerCase());
      toast({
        title: "Success",
        description: "Word information filled automatically",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get word information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addWord = useMutation({
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
        throw new Error("Failed to add word");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Success",
        description: "Word added successfully",
      });
      onOpenChange(false);
      // Reset form
      setWord("");
      setTranslation("");
      setPartOfSpeech("");
      setContext("");
      setSelectedDeckId("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add word. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Word</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Deck</label>
            <Select
              value={selectedDeckId}
              onValueChange={setSelectedDeckId}
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Word</label>
            <Input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Enter word"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => autofillWord.mutate()}
              disabled={!word || autofillWord.isPending}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Autofill with AI
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Translation</label>
            <Input
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="Enter translation"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Part of Speech</label>
            <Select
              value={partOfSpeech}
              onValueChange={setPartOfSpeech}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select part of speech" />
              </SelectTrigger>
              <SelectContent>
                {["noun", "verb", "adjective", "adverb", "particle"].map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos.charAt(0).toUpperCase() + pos.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Context (optional)</label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Enter example sentence or context"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => addWord.mutate()}
            disabled={!word || !translation || !partOfSpeech || !selectedDeckId || addWord.isPending}
          >
            Add Word
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}