import { StoryForm } from "@/components/StoryForm";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <StoryForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}