import { StoryForm } from "@/components/StoryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">
              AI Graded Reader Generator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StoryForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
