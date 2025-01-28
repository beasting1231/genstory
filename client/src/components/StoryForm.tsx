import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { GeneratedStory } from "./GeneratedStory";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { StoryFormData, StoryResponse } from "@/lib/types";

const formSchema = z.object({
  setting: z.string().min(2, "Setting must be at least 2 characters"),
  characterName: z.string().min(1, "Character name is required"),
  additionalCharacters: z.string(),
  readingLevel: z.string().min(1, "Reading level is required"),
  wordCount: z.number().min(50).max(500),
  additionalContext: z.string(),
});

export function StoryForm() {
  const [story, setStory] = useState<StoryResponse | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      setting: "",
      characterName: "",
      additionalCharacters: "",
      readingLevel: "",
      wordCount: 250,
      additionalContext: "",
    },
  });

  const generateStory = useMutation({
    mutationFn: async (data: StoryFormData) => {
      const language = localStorage.getItem("storyLanguage") || "English";
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, language }),
      });

      if (!response.ok) {
        const text = await response.text();
        if (text.includes("rate limit exceeded")) {
          throw new Error("The AI service is temporarily unavailable due to high demand. Please try again in a few minutes.");
        }
        throw new Error("Failed to generate story");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setStory(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate story. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    generateStory.mutate(values);
  }

  if (story) {
    return (
      <div className="space-y-4">
        <GeneratedStory 
          story={story} 
          readingLevel={form.getValues("readingLevel")}
          wordCount={form.getValues("wordCount")}
        />
        <Button onClick={() => setStory(null)} variant="outline" className="w-full">
          Generate Another Story
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="setting"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Story Setting</FormLabel>
              <FormControl>
                <Input placeholder="e.g., A magical forest, A busy city..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="characterName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Main Character Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter character name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalCharacters"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Characters (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John, Sarah, Tom..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="readingLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reading Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reading level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="A1">A1 - Beginner</SelectItem>
                  <SelectItem value="A2">A2 - Elementary</SelectItem>
                  <SelectItem value="B1">B1 - Intermediate</SelectItem>
                  <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                  <SelectItem value="C1">C1 - Advanced</SelectItem>
                  <SelectItem value="C2">C2 - Mastery</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="wordCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Word Count: {field.value}</FormLabel>
              <FormControl>
                <Slider
                  min={50}
                  max={500}
                  step={50}
                  value={[field.value]}
                  onValueChange={(value) => field.onChange(value[0])}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalContext"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Context (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any specific instructions or context for the story..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={generateStory.isPending}>
          {generateStory.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Story...
            </>
          ) : (
            "Generate Story"
          )}
        </Button>
      </form>
    </Form>
  );
}