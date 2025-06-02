import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Heart, ArrowRight, User, Target, Clock, Bell } from "lucide-react";
import { useLocation } from "wouter";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    preferredName: "",
    goals: [] as string[],
    experience: "",
    dailyReminderTime: "09:00",
    enableNotifications: true,
    personalNote: ""
  });

  const wellnessGoals = [
    { id: "stress", label: "Reduce Stress & Anxiety", icon: "🧘" },
    { id: "mood", label: "Improve Mood Tracking", icon: "😊" },
    { id: "mindfulness", label: "Build Mindfulness Habits", icon: "🌱" },
    { id: "sleep", label: "Better Sleep Quality", icon: "😴" },
    { id: "productivity", label: "Increase Focus & Productivity", icon: "🎯" },
    { id: "relationships", label: "Strengthen Relationships", icon: "💕" },
    { id: "gratitude", label: "Practice Daily Gratitude", icon: "🙏" },
    { id: "confidence", label: "Build Self-Confidence", icon: "✨" }
  ];

  const handleGoalToggle = (goalId: string) => {
    setUserData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(id => id !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!userData.firstName.trim()) {
        toast({
          title: "Name Required",
          description: "Please enter your first name to continue",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (currentStep === 2) {
      if (userData.goals.length === 0) {
        toast({
          title: "Select Goals",
          description: "Please select at least one wellness goal",
          variant: "destructive"
        });
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleFinish = async () => {
    setIsLoading(true);
    
    try {
      // Save user preferences and complete onboarding
      const displayName = userData.preferredName.trim() || userData.firstName;
      
      toast({
        title: `Welcome, ${displayName}!`,
        description: "Your personalized wellness journey begins now",
      });
      
      // Store user data in localStorage for demo purposes
      localStorage.setItem('mindease_user', JSON.stringify({
        ...userData,
        displayName,
        onboardingCompleted: true,
        joinedAt: new Date().toISOString()
      }));
      
      setTimeout(() => {
        setLocation("/");
      }, 1500);
      
    } catch (error) {
      toast({
        title: "Setup Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Let's Personalize Your Experience
          </CardTitle>
          <CardDescription>
            Step {currentStep} of 3 - Help us create the perfect wellness journey for you
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <User className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-xl font-semibold">Tell us about yourself</h3>
                <p className="text-muted-foreground">We'll use this to personalize your experience</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    value={userData.firstName}
                    onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    value={userData.lastName}
                    onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferredName">What should we call you? (Optional)</Label>
                <Input
                  id="preferredName"
                  placeholder="Nickname or preferred name"
                  value={userData.preferredName}
                  onChange={(e) => setUserData({ ...userData, preferredName: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Leave blank to use your first name
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="experience">Mental wellness experience</Label>
                <RadioGroup 
                  value={userData.experience} 
                  onValueChange={(value) => setUserData({ ...userData, experience: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="beginner" id="beginner" />
                    <Label htmlFor="beginner">I'm new to mental wellness practices</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="intermediate" id="intermediate" />
                    <Label htmlFor="intermediate">I have some experience with mindfulness</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="advanced" id="advanced" />
                    <Label htmlFor="advanced">I regularly practice wellness techniques</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
          
          {/* Step 2: Wellness Goals */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Target className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-xl font-semibold">What are your wellness goals?</h3>
                <p className="text-muted-foreground">Select all that apply - we'll customize your experience</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {wellnessGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      userData.goals.includes(goal.id)
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                    onClick={() => handleGoalToggle(goal.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{goal.icon}</span>
                      <div className="flex-1">
                        <Label className="cursor-pointer">{goal.label}</Label>
                      </div>
                      <Checkbox
                        checked={userData.goals.includes(goal.id)}
                        onChange={() => handleGoalToggle(goal.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 3: Preferences & Final Setup */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Clock className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-xl font-semibold">Final preferences</h3>
                <p className="text-muted-foreground">Set up notifications and personalization</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifications"
                    checked={userData.enableNotifications}
                    onCheckedChange={(checked) => 
                      setUserData({ ...userData, enableNotifications: checked as boolean })
                    }
                  />
                  <Label htmlFor="notifications" className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Enable wellness reminders and check-ins
                  </Label>
                </div>
                
                {userData.enableNotifications && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="reminderTime">Preferred reminder time</Label>
                    <Input
                      id="reminderTime"
                      type="time"
                      value={userData.dailyReminderTime}
                      onChange={(e) => setUserData({ ...userData, dailyReminderTime: e.target.value })}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="personalNote">Anything else you'd like us to know? (Optional)</Label>
                  <Textarea
                    id="personalNote"
                    placeholder="Share any specific concerns, preferences, or goals..."
                    value={userData.personalNote}
                    onChange={(e) => setUserData({ ...userData, personalNote: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Your personalized setup:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Name: {userData.preferredName || userData.firstName}</li>
                  <li>• Goals: {userData.goals.length} selected</li>
                  <li>• Experience: {userData.experience || 'Not specified'}</li>
                  <li>• Reminders: {userData.enableNotifications ? `Daily at ${userData.dailyReminderTime}` : 'Disabled'}</li>
                </ul>
              </div>
            </div>
          )}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isLoading ? "Setting up..." : "Complete Setup"}
                <Heart className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}