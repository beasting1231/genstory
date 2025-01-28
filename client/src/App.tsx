import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SavedStories from "@/pages/SavedStories";
import Settings from "@/pages/Settings";
import MyVocab from "@/pages/MyVocab";
import StudyDeck from "@/pages/StudyDeck";
import { Navigation } from "@/components/Navigation";

function Router() {
  return (
    <div>
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/saved" component={SavedStories} />
        <Route path="/vocab" component={MyVocab} />
        <Route path="/study/:deckId" component={StudyDeck} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;