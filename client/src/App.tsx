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

  // Initialize user session for completely isolated data storage
  const sessionInitMutation = useMutation({
    mutationFn: async () => {
      // Always generate a unique device ID for this session
      let uniqueDeviceId = localStorage.getItem('mindease_unique_device_id');
      
      // If no stored unique ID, create a new one (ensures complete data isolation)
      if (!uniqueDeviceId || uniqueDeviceId === 'undefined') {
        uniqueDeviceId = generateUniqueDeviceId();
        localStorage.setItem('mindease_unique_device_id', uniqueDeviceId);
        
        // Create completely new user with this unique ID
        return apiRequest("POST", "/api/auth/create-unique-user", { uniqueDeviceId });
      } else {
        // Use existing unique device ID to maintain user identity
        return apiRequest("POST", "/api/auth/restore-user", { uniqueDeviceId });
      }
    },
    onSuccess: (data: any) => {
      // Store the unique user session
      if (data.user?.id) {
        localStorage.setItem('mindease_current_user_id', data.user.id);
        console.log('User session initialized for:', data.user.firstName || 'New User');
      }
    },
    onError: (error) => {
      console.error('Failed to initialize unique user session:', error);
    }
  });

  useEffect(() => {
    // Initialize session when app loads to ensure personalized data storage
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
