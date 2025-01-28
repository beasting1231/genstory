import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface WordModalProps {
  word: string;
  translation: string;
  partOfSpeech: string;
  context?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function WordModal({
  word,
  translation,
  partOfSpeech,
  context,
  isOpen,
  onClose,
}: WordModalProps) {
  const { toast } = useToast();

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
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save to vocabulary");
      }

      return response.json();
    },
    onSuccess: () => {
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
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{word}</DialogTitle>
          <DialogDescription className="space-y-2 pt-3">
            <div>
              <span className="font-medium">Translation:</span> {translation}
            </div>
            <div>
              <span className="font-medium">Part of Speech:</span> {partOfSpeech}
            </div>
            {context && (
              <div>
                <span className="font-medium">Context:</span>
                <p className="mt-1 text-sm italic">"{context}"</p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="default"
            onClick={() => saveToVocab.mutate()}
            disabled={saveToVocab.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save to My Vocabulary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
