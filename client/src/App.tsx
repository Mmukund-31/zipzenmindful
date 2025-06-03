import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";

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
  // Create a unique device fingerprint for persistent user identity
  const generateDeviceFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('MindEase', 10, 10);
    const canvasFingerprint = canvas.toDataURL();
    
    const fingerprint = btoa(JSON.stringify({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`,
      canvas: canvasFingerprint.slice(-50), // Last 50 chars for uniqueness
    })).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    
    return `user_device_${fingerprint}_${Date.now()}`;
  };

  // Initialize user session for personalized data storage
  const sessionInitMutation = useMutation({
    mutationFn: async () => {
      // Check if we have a stored session ID to restore
      let storedSessionId = localStorage.getItem('mindease_session_id');
      
      // If no stored session, create one based on device fingerprint
      if (!storedSessionId || storedSessionId === 'undefined') {
        // Check if we have a device-specific ID
        let deviceId = localStorage.getItem('mindease_device_id');
        if (!deviceId) {
          deviceId = generateDeviceFingerprint();
          localStorage.setItem('mindease_device_id', deviceId);
        }
        
        // Try to find existing user with this device ID
        return apiRequest("POST", "/api/auth/device-login", { deviceId });
      } else {
        // Validate existing session
        return apiRequest("POST", "/api/auth/init", { sessionId: storedSessionId });
      }
    },
    onSuccess: (data: any) => {
      // Store session ID for persistence across page refreshes
      if (data.sessionId && data.sessionId !== 'undefined') {
        localStorage.setItem('mindease_session_id', data.sessionId);
        console.log('User session restored:', data.user.firstName, data.user.lastName);
      }
    },
    onError: (error) => {
      console.error('Failed to initialize session:', error);
    }
  });

  useEffect(() => {
    // Initialize session when app loads to ensure personalized data storage
    sessionInitMutation.mutate();
  }, []);

  // Check if user has completed onboarding
  const hasCompletedOnboarding = localStorage.getItem('wellness_onboarding_complete') === 'true';

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
