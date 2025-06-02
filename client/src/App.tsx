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
import Login from "@/pages/login";
import Onboarding from "@/pages/onboarding";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [userData, setUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data from onboarding
    const storedUser = localStorage.getItem('mindease_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserData(parsed);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
    setUserLoading(false);
  }, []);

  // Show loading state while checking user data
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading your wellness journey...</p>
        </div>
      </div>
    );
  }

  // Determine authentication state
  const hasCompletedOnboarding = userData?.onboardingCompleted;
  const needsLogin = !userData;
  const needsOnboarding = userData && !hasCompletedOnboarding;

  return (
    <div className="max-w-md mx-auto bg-white shadow-2xl min-h-screen relative overflow-hidden">
      <Switch>
        {needsLogin ? (
          <>
            <Route path="/" component={Login} />
            <Route path="/login" component={Login} />
            <Route path="/onboarding" component={Onboarding} />
          </>
        ) : needsOnboarding ? (
          <>
            <Route path="/" component={Onboarding} />
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/login" component={Login} />
          </>
        ) : (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/chat" component={Chat} />
            <Route path="/talk" component={Talk} />
            <Route path="/memories" component={Memories} />
            <Route path="/insights" component={Insights} />
            <Route path="/wellness" component={Wellness} />
            <Route path="/gratitude" component={Gratitude} />
            <Route path="/challenges" component={Challenges} />
            <Route path="/settings" component={Settings} />
            <Route path="/login" component={Login} />
            <Route path="/onboarding" component={Onboarding} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      {hasCompletedOnboarding && <Navigation />}
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
