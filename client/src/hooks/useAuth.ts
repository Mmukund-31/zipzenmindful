import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Monitor Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync with backend when Firebase user changes
  const { data: backendUser } = useQuery({
    queryKey: ["/api/auth/sync", firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) return null;
      
      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          firstName: firebaseUser.displayName?.split(" ")[0] || "User",
          lastName: firebaseUser.displayName?.split(" ")[1] || "",
          profileImageUrl: firebaseUser.photoURL,
          phoneNumber: firebaseUser.phoneNumber,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!firebaseUser,
    retry: false,
  });

  return {
    user: backendUser?.user || backendUser,
    firebaseUser,
    isLoading,
    isAuthenticated: !!firebaseUser,
    needsOnboarding: backendUser?.needsOnboarding || false,
  };
}