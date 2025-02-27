import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { SelectDeck, SelectVocab } from "@db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyDeckProps {
  params: { deckId: string };
}

export default function StudyDeck({ params }: StudyDeckProps) {
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<null | "left" | "right">(null);

  const dragX = useMotionValue(0);
  const swipeProgress = useTransform(dragX, [-200, 0, 200], [-1, 0, 1]);

  // Transform for background color
  const cardBackground = useTransform(
    swipeProgress,
    [-1, -0.5, 0, 0.5, 1],
    [
      "rgba(239, 68, 68, 0.3)", // Full red
      "rgba(239, 68, 68, 0.2)", // Light red
      "rgba(255, 255, 255, 0)", // Neutral
      "rgba(34, 197, 94, 0.2)", // Light green
      "rgba(34, 197, 94, 0.3)", // Full green
    ]
  );

  // Transform for thumbs opacity
  const thumbsUpOpacity = useTransform(
    swipeProgress,
    [-0.1, 0, 0.5, 1],
    [0, 0, 0.5, 1]
  );

  const thumbsDownOpacity = useTransform(
    swipeProgress,
    [-1, -0.5, 0, 0.1],
    [1, 0.5, 0, 0]
  );

  const { data: decks } = useQuery<SelectDeck[]>({
    queryKey: ["/api/decks"],
  });

  const deck = decks?.find(d => d.id === parseInt(params.deckId));
  const vocabulary = deck?.vocabulary || [];
  const currentWord = vocabulary[currentIndex];
  const isDeckCompleted = currentIndex >= vocabulary.length;

  const onDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const swipe = info.offset.x;
    const velocity = Math.abs(info.velocity.x);

    if (Math.abs(swipe) > threshold || velocity > 800) {
      setDirection(swipe > 0 ? "right" : "left");
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
        setDirection(null);
      }, 200);
    } else {
      setDirection(null);
    }
  };

  if (!currentWord && !isDeckCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => setLocation("/vocab")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Decks
          </Button>
          <Card className="p-8 text-center">
            <p className="text-lg mb-4">No words in this deck!</p>
            <Button onClick={() => setLocation("/vocab")}>Return to Decks</Button>
          </Card>
        </div>
      </div>
    );
  }

  if (isDeckCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => setLocation("/vocab")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Decks
          </Button>
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">🎉 All Done!</h2>
            <p className="text-muted-foreground mb-6">
              You've completed studying all words in this deck.
            </p>
            <div className="space-y-4">
              <Button 
                onClick={() => {
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setDirection(null);
                }}
                className="w-full"
              >
                Study Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/vocab")}
                className="w-full"
              >
                Return to Decks
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/vocab")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Decks
          </Button>
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} / {vocabulary.length}
          </p>
        </div>

        <div className="relative h-[400px] w-full max-w-md mx-auto perspective-1000">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              style={{
                x: dragX,
                background: cardBackground,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: vocabulary.length - currentIndex,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              drag="x"
              dragElastic={0.7}
              onDragEnd={onDragEnd}
              dragConstraints={{ left: 0, right: 0 }}
              initial={{ opacity: 0, scale: 0.8, x: 0, y: 0 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0, transition: { duration: 0.3 }}}
              exit={{ 
                opacity: 0,
                x: direction === "left" ? -300 : 300,
                transition: { duration: 0.2 }
              }}
            >
              {/* Thumbs up/down overlay */}
              <motion.div 
                className="absolute inset-0 pointer-events-none"
                style={{ opacity: thumbsUpOpacity }}
              >
                <ThumbsUp className="absolute top-4 right-4 h-12 w-12 text-green-500" />
              </motion.div>
              <motion.div 
                className="absolute inset-0 pointer-events-none"
                style={{ opacity: thumbsDownOpacity }}
              >
                <ThumbsDown className="absolute top-4 left-4 h-12 w-12 text-red-500" />
              </motion.div>

              <div
                className="w-full h-full"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <motion.div
                  className="w-full h-full relative preserve-3d"
                  initial={false}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Front of card */}
                  <Card className={cn(
                    "absolute inset-0 p-8 flex flex-col items-center justify-center backface-hidden",
                    "bg-gradient-to-br from-background to-muted"
                  )}>
                    <p className="text-4xl font-bold mb-4">{currentWord.word}</p>
                    <p className="text-sm text-muted-foreground">Tap to flip</p>
                  </Card>

                  {/* Back of card */}
                  <Card className={cn(
                    "absolute inset-0 p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180",
                    "bg-gradient-to-br from-background to-muted"
                  )}>
                    <p className="text-2xl font-bold mb-4">{currentWord.translation}</p>
                    {currentWord.partOfSpeech && (
                      <p className="text-sm text-muted-foreground mb-2 capitalize">
                        {currentWord.partOfSpeech}
                      </p>
                    )}
                    {currentWord.context && (
                      <p className="text-sm text-center italic mt-4">
                        "{currentWord.context}"
                      </p>
                    )}
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <Button
            size="lg"
            variant="outline"
            className="w-32 bg-red-500/10 hover:bg-red-500/20"
            onClick={() => onDragEnd({} as any, { offset: { x: -150 }, velocity: { x: 1000 } } as PanInfo)}
          >
            <X className="h-6 w-6 mr-2" />
            Again
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-32 bg-green-500/10 hover:bg-green-500/20"
            onClick={() => onDragEnd({} as any, { offset: { x: 150 }, velocity: { x: 1000 } } as PanInfo)}
          >
            <Check className="h-6 w-6 mr-2" />
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}