import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";
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
import DatabaseAdmin from "@/pages/database-admin";
import NotFound from "@/pages/not-found";


function Router() {
  // Create a truly unique device fingerprint for complete data isolation
  const generateUniqueDeviceId = () => {
    // Generate a stable device fingerprint using consistent data only
    const deviceData = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages?.join(',') || '',
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      memory: (navigator as any).deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      touchSupport: 'ontouchstart' in window,
      // Use a stable canvas fingerprint
      canvasStable: 'mindease_stable_canvas'
    };
    
    // Create a unique hash from all device characteristics
    const deviceString = JSON.stringify(deviceData);
    const hash = btoa(deviceString).replace(/[^a-zA-Z0-9]/g, '');
    
    return `mindease_user_${hash.substring(0, 30)}`;
  };

  // Initialize user session with persistence for data storage - FIXED
  const sessionInitMutation = useMutation({
    mutationFn: async () => {
      // Check if user already exists in localStorage
      let existingUserId = localStorage.getItem('mindease_current_user_id');
      
      if (existingUserId) {
        console.log('=== RESTORING EXISTING USER ===');
        console.log('Found existing user ID:', existingUserId);
        
        // Restore existing user session
        return apiRequest("POST", "/api/auth/restore-user-session", { userId: existingUserId });
      } else {
        // Create new user only if none exists
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const uniqueDeviceId = `mindease_user_${timestamp}_${random}`;
        
        console.log('=== CREATING NEW USER ===');
        console.log('Generated unique ID:', uniqueDeviceId);
        
        localStorage.setItem('mindease_unique_device_id', uniqueDeviceId);
        
        return apiRequest("POST", "/api/auth/create-unique-user", { uniqueDeviceId });
      }
    },
    onSuccess: (data: any) => {
      // Store the user session for persistence
      if (data.user?.id) {
        localStorage.setItem('mindease_current_user_id', data.user.id);
        console.log('USER SESSION ESTABLISHED:', data.user.id);
      }
    },
    onError: (error) => {
      console.error('Failed to establish user session:', error);
    }
  });

  useEffect(() => {
    // Initialize session when app loads
    sessionInitMutation.mutate();
  }, []);

  // Check if user has completed onboarding (simplified logic)
  const hasCompletedOnboarding = localStorage.getItem('wellness_onboarding_complete') === 'true';

  // Redirect to onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-background">
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
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/admin/database" component={DatabaseAdmin} />
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
          <div className="max-w-md mx-auto bg-white shadow-2xl min-h-screen relative overflow-hidden">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
