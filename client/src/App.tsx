import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SavedStories from "@/pages/SavedStories";
import Settings from "@/pages/Settings";
import { Button } from "@/components/ui/button";
import { Book, Plus, Settings as SettingsIcon } from "lucide-react";

function Navigation() {
  return (
    <nav className="bg-background border-b py-4 px-4 md:px-8">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <Link href="/">
          <Button variant="ghost" className="text-lg font-semibold">
            <Plus className="h-5 w-5 mr-2" />
            Create Story
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href="/saved">
            <Button variant="ghost" className="text-lg font-semibold">
              <Book className="h-5 w-5 mr-2" />
              Saved Stories
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" className="text-lg font-semibold">
              <SettingsIcon className="h-5 w-5 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div>
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/saved" component={SavedStories} />
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