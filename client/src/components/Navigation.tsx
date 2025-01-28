import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Menu, Book, Plus, Settings as SettingsIcon, BookOpen } from "lucide-react";

const NavigationLink = ({ href, icon: Icon, children, onNavigate }: { href: string, icon: any, children: React.ReactNode, onNavigate?: () => void }) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href}>
      <Button
        variant={isActive ? "default" : "ghost"}
        className="w-full justify-start text-lg"
        onClick={() => onNavigate?.()}
      >
        <Icon className="h-5 w-5 mr-2" />
        {children}
      </Button>
    </Link>
  );
};

export function Navigation() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b">
      <div className="h-16 flex items-center px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <nav className="flex flex-col gap-2 mt-4">
              <NavigationLink href="/" icon={Plus} onNavigate={() => setOpen(false)}>
                Create Story
              </NavigationLink>
              <NavigationLink href="/saved" icon={Book} onNavigate={() => setOpen(false)}>
                Saved Stories
              </NavigationLink>
              <NavigationLink href="/vocab" icon={BookOpen} onNavigate={() => setOpen(false)}>
                My Vocabulary
              </NavigationLink>
              <NavigationLink href="/settings" icon={SettingsIcon} onNavigate={() => setOpen(false)}>
                Settings
              </NavigationLink>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="hidden md:flex mx-auto max-w-4xl w-full justify-between items-center">
          <NavigationLink href="/" icon={Plus}>
            Create Story
          </NavigationLink>
          <div className="flex gap-2">
            <NavigationLink href="/saved" icon={Book}>
              Saved Stories
            </NavigationLink>
            <NavigationLink href="/vocab" icon={BookOpen}>
              My Vocabulary
            </NavigationLink>
            <NavigationLink href="/settings" icon={SettingsIcon}>
              Settings
            </NavigationLink>
          </div>
        </div>
      </div>
    </header>
  );
}