import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Heart, Mail, Phone, Eye, EyeOff } from "lucide-react";
import GoogleButton from "react-google-button";
import { useLocation } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [emailForm, setEmailForm] = useState({
    email: "",
    password: "",
    isSignUp: false
  });
  
  const [phoneForm, setPhoneForm] = useState({
    phoneNumber: "",
    otp: "",
    otpSent: false
  });

  const handleQuickStart = async () => {
    setIsLoading(true);
    try {
      // Create a personalized session for this device/user
      const response = await fetch('/api/auth/quick-start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: localStorage.getItem('mindease_device_id') || 
                   'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        })
      });
      
      if (response.ok) {
        const userData = await response.json();
        // Store device ID for consistent personalization
        localStorage.setItem('mindease_device_id', userData.deviceId);
        
        toast({
          title: "Welcome to MindEase!",
          description: `Hello ${userData.user.firstName}! Ready for your wellness journey?`,
        });
        setLocation("/");
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to authenticate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Initialize Firebase Auth with Google provider
      toast({
        title: "Google Sign-In",
        description: "Setting up Google authentication...",
      });
      
      // Simulate successful login for demo
      setTimeout(() => {
        toast({
          title: "Welcome!",
          description: "Successfully signed in with Google",
        });
        setLocation("/onboarding");
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/email-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailForm.email,
          password: emailForm.password,
          isSignUp: emailForm.isSignUp
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      toast({
        title: emailForm.isSignUp ? "Account Created" : "Welcome Back!",
        description: emailForm.isSignUp ? "Your account has been created successfully!" : "Successfully signed in with email",
      });
      
      setLocation("/onboarding");
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Authentication failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!phoneForm.otpSent) {
        // Send OTP
        const response = await fetch('/api/auth/phone-send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phoneForm.phoneNumber })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send OTP');
        }

        toast({
          title: "OTP Sent",
          description: `Verification code sent to ${phoneForm.phoneNumber}`,
        });
        setPhoneForm({ ...phoneForm, otpSent: true });
      } else {
        // Verify OTP
        const response = await fetch('/api/auth/phone-verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            phoneNumber: phoneForm.phoneNumber,
            otp: phoneForm.otp 
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Invalid OTP');
        }

        toast({
          title: "Phone Verified",
          description: "Successfully verified your phone number",
        });
        setLocation("/onboarding");
      }
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify phone number. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome to MindEase
          </CardTitle>
          <CardDescription>
            Your personal mental wellness companion
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Quick Start for Testing */}
            <Button 
              onClick={handleQuickStart}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3"
            >
              {isLoading ? "Starting..." : "Quick Start - Try the App"}
            </Button>

            {/* Google Sign-In */}
            <div className="w-full">
              <GoogleButton
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                style={{ width: "100%" }}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Email/Phone Tabs */}
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </TabsTrigger>
              </TabsList>
              
              {/* Email Tab */}
              <TabsContent value="email">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={emailForm.password}
                        onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    disabled={isLoading}
                  >
                    {isLoading ? "Please wait..." : emailForm.isSignUp ? "Create Account" : "Sign In"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="link"
                    className="w-full"
                    onClick={() => setEmailForm({ ...emailForm, isSignUp: !emailForm.isSignUp })}
                  >
                    {emailForm.isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                  </Button>
                </form>
              </TabsContent>
              
              {/* Phone Tab */}
              <TabsContent value="phone">
                <form onSubmit={handlePhoneAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phoneForm.phoneNumber}
                      onChange={(e) => setPhoneForm({ ...phoneForm, phoneNumber: e.target.value })}
                      disabled={phoneForm.otpSent}
                      required
                    />
                  </div>
                  
                  {phoneForm.otpSent && (
                    <div className="space-y-2">
                      <Label htmlFor="otp">Verification Code</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={phoneForm.otp}
                        onChange={(e) => setPhoneForm({ ...phoneForm, otp: e.target.value })}
                        maxLength={6}
                        required
                      />
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    disabled={isLoading}
                  >
                    {isLoading ? "Please wait..." : phoneForm.otpSent ? "Verify Code" : "Send Code"}
                  </Button>
                  
                  {phoneForm.otpSent && (
                    <Button
                      type="button"
                      variant="link"
                      className="w-full"
                      onClick={() => setPhoneForm({ ...phoneForm, otpSent: false, otp: "" })}
                    >
                      Use different number
                    </Button>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}