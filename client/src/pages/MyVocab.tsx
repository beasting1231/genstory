import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectVocab } from "@db/schema";
import { format } from "date-fns";

export default function MyVocab() {
  const { data: vocabulary, isLoading, error } = useQuery<SelectVocab[]>({
    queryKey: ["/api/vocabulary"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Loading vocabulary...</h1>
        </div>
      </div>
    );
  }

  if (error) {
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
        <h1 className="text-2xl md:text-3xl font-bold mb-6">My Vocabulary</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {vocabulary?.map((item) => (
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
                    <span className="font-medium">Part of Speech:</span> {item.partOfSpeech}
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
      </div>
    </div>
  );
}
