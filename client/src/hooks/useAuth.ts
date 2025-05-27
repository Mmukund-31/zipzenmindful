import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function useAuth() {
  const [demoUser, setDemoUser] = useState<any>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(true);

  // Check for demo user in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('demo_user');
    if (storedUser) {
      try {
        setDemoUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing demo user:', error);
      }
    }
    setIsLoadingDemo(false);
  }, []);

  const { data: user, isLoading: isLoadingAPI } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !demoUser, // Only query API if no demo user
  });

  // Use demo user if available, otherwise use API user
  const currentUser = demoUser || user;
  const isLoading = isLoadingDemo || (isLoadingAPI && !demoUser);

  return {
    user: currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    isDemoMode: !!demoUser,
  };
}