import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SelectDeck, SelectVocab } from "@db/schema";
import { Wand2 } from "lucide-react";

interface AddWordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decks: SelectDeck[];
  wordToEdit?: SelectVocab | null;
}

export function AddWordModal({ open, onOpenChange, decks, wordToEdit }: AddWordModalProps) {
  const [word, setWord] = useState(wordToEdit?.word || "");
  const [translation, setTranslation] = useState(wordToEdit?.translation || "");
  const [partOfSpeech, setPartOfSpeech] = useState(wordToEdit?.partOfSpeech || "");
  const [context, setContext] = useState(wordToEdit?.context || "");
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    wordToEdit?.deckId.toString() || ""
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Effect to update form when wordToEdit changes
  useEffect(() => {
    if (wordToEdit) {
      setWord(wordToEdit.word);
      setTranslation(wordToEdit.translation);
      setPartOfSpeech(wordToEdit.partOfSpeech || "");
      setContext(wordToEdit.context || "");
      setSelectedDeckId(wordToEdit.deckId.toString());
    }
  }, [wordToEdit]);

  const addOrUpdateWord = useMutation({
    mutationFn: async () => {
      const method = wordToEdit ? "PUT" : "POST";
      const url = wordToEdit 
        ? `/api/vocabulary/${wordToEdit.id}` 
        : "/api/vocabulary";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          translation,
          ...(partOfSpeech && { partOfSpeech }),
          context,
          deckId: parseInt(selectedDeckId),
        }),
      });

      if (!response.ok) {
        throw new Error(wordToEdit ? "Failed to update word" : "Failed to add word");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Success",
        description: wordToEdit ? "Word updated successfully" : "Word added successfully",
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
        description: wordToEdit 
          ? "Failed to update word. Please try again." 
          : "Failed to add word. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{wordToEdit ? "Edit Word" : "Add New Word"}</DialogTitle>
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
              variant="secondary"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 text-white"
              onClick={() => autofillWord.mutate()}
              disabled={!word || autofillWord.isPending}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {autofillWord.isPending ? "Filling..." : "Autofill with AI"}
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
            <label className="text-sm font-medium">Part of Speech (optional)</label>
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
            <label className="text-sm font-medium">Example Sentence</label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Example sentence using this word"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => addOrUpdateWord.mutate()}
            disabled={!word || !translation || !selectedDeckId || addOrUpdateWord.isPending}
          >
            {addOrUpdateWord.isPending 
              ? "Saving..." 
              : wordToEdit ? "Update Word" : "Add Word"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}