import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectVocab, SelectDeck } from "@db/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateDeckModal } from "@/components/ui/create-deck-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MyVocab() {
  const [showCreateDeck, setShowCreateDeck] = useState(false);

  const { data: decks, isLoading: decksLoading, error: decksError } = useQuery<SelectDeck[]>({
    queryKey: ["/api/decks"],
  });

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
          <Button onClick={() => setShowCreateDeck(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Deck
          </Button>
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
          <Tabs defaultValue={decks?.[0]?.id?.toString()}>
            <div className="overflow-x-auto">
              <TabsList className="w-max min-w-full inline-flex justify-start mb-4 px-4">
                {decks?.map((deck) => (
                  <TabsTrigger key={deck.id} value={deck.id.toString()}>
                    {deck.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {decks?.map((deck) => (
              <TabsContent key={deck.id} value={deck.id.toString()}>
                <div className="grid gap-4 md:grid-cols-2">
                  {deck.vocabulary?.map((item) => (
                    <Card key={item.id} className="shadow-md">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl font-bold">{item.word}</CardTitle>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(item.createdAt), "PP")}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          <p>
                            <span className="font-medium">Translation:</span> {item.translation}
                          </p>
                          <p>
                            <span className="font-medium">Part of Speech:</span>{" "}
                            {item.partOfSpeech}
                          </p>
                          {item.context && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              "{item.context}"
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        <CreateDeckModal 
          open={showCreateDeck} 
          onOpenChange={setShowCreateDeck} 
        />
      </div>
    </div>
  );
}