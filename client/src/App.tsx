import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import Dashboard from "@/pages/dashboard";
import Chat from "@/pages/chat";
import Talk from "@/pages/talk";
import Memories from "@/pages/memories";
import Insights from "@/pages/insights";
import Wellness from "@/pages/wellness";
import Gratitude from "@/pages/gratitude";
import Challenges from "@/pages/challenges";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="max-w-md mx-auto bg-white shadow-2xl min-h-screen relative overflow-hidden">
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/chat" component={Chat} />
        <Route path="/talk" component={Talk} />
        <Route path="/memories" component={Memories} />
        <Route path="/insights" component={Insights} />
        <Route path="/wellness" component={Wellness} />
        <Route path="/gratitude" component={Gratitude} />
        <Route path="/challenges" component={Challenges} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      <Navigation />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="mindease-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background transition-colors">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
