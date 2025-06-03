import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trophy, Target, Clock, CheckCircle, Star, Calendar, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navigation from "@/components/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Challenges() {
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const { toast } = useToast();

  const { data: activeChallenges = [] } = useQuery<any[]>({
    queryKey: ['/api/challenges/active'],
  });

  const { data: availableChallenges = [] } = useQuery<any[]>({
    queryKey: ['/api/challenges/available'],
  });

  const { data: completedChallenges = [] } = useQuery<any[]>({
    queryKey: ['/api/challenges/completed'],
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await apiRequest("POST", "/api/challenges/join", { challengeId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/available'] });
      toast({
        title: "Challenge started!",
        description: "Good luck on your wellness journey!",
      });
    },
    onError: () => {
      toast({
        title: "Failed to start challenge",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeChallengeeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await apiRequest("POST", "/api/challenges/progress", {
        challengeId,
        completed: true,
        date: new Date().toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/completed'] });
      toast({
        title: "Great job!",
        description: "You've completed today's challenge!",
      });
    },
    onError: () => {
      toast({
        title: "Failed to mark as complete",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ challengeId, completed }: { challengeId: string; completed: boolean }) => {
      const response = await apiRequest("POST", "/api/challenges/progress", { 
        challengeId, 
        completed,
        date: new Date().toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/completed'] });
      toast({
        title: "Progress updated!",
        description: "Keep up the great work!",
      });
    },
  });

  const predefinedChallenges = [
    {
      id: "mindful-week",
      title: "7-Day Mindfulness Challenge",
      description: "Practice 5 minutes of mindful breathing daily for one week",
      duration: 7,
      type: "breathing",
      difficulty: "Beginner",
      points: 50,
      icon: "🧘‍♀️",
      benefits: ["Reduced stress", "Better focus", "Improved sleep"]
    },
    {
      id: "gratitude-streak",
      title: "14-Day Gratitude Streak",
      description: "Write 3 things you're grateful for every day for 2 weeks",
      duration: 14,
      type: "gratitude",
      difficulty: "Easy",
      points: 70,
      icon: "🙏",
      benefits: ["Increased happiness", "Better relationships", "Positive mindset"]
    },
    {
      id: "mood-tracker",
      title: "21-Day Mood Awareness",
      description: "Log your mood twice daily and reflect on patterns",
      duration: 21,
      type: "mood",
      difficulty: "Easy",
      points: 80,
      icon: "😊",
      benefits: ["Self-awareness", "Emotional regulation", "Pattern recognition"]
    },
    {
      id: "stress-buster",
      title: "10-Day Stress Relief",
      description: "Use stress management tools daily when feeling overwhelmed",
      duration: 10,
      type: "wellness",
      difficulty: "Intermediate",
      points: 60,
      icon: "🌟",
      benefits: ["Stress reduction", "Coping skills", "Resilience building"]
    },
    {
      id: "self-compassion",
      title: "30-Day Self-Compassion Journey",
      description: "Practice daily self-compassion exercises and positive affirmations",
      duration: 30,
      type: "selfcare",
      difficulty: "Advanced",
      points: 150,
      icon: "💝",
      benefits: ["Self-acceptance", "Reduced self-criticism", "Inner peace"]
    },
    {
      id: "digital-detox",
      title: "Weekend Digital Detox",
      description: "Reduce screen time and practice mindful activities for 48 hours",
      duration: 2,
      type: "lifestyle",
      difficulty: "Intermediate",
      points: 40,
      icon: "📱",
      benefits: ["Better focus", "Real connections", "Mental clarity"]
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Beginner': return 'bg-blue-100 text-blue-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (challenge: any) => {
    if (!challenge.progress) return 0;
    return Math.round((challenge.progress.completed / challenge.duration) * 100);
  };

  const getTotalPoints = () => {
    return (completedChallenges as any[]).reduce((total: number, challenge: any) => total + challenge.points, 0);
  };

  return (
    <div className="pb-20 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 min-h-screen">
      <Navigation />
      
      <main className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-500 to-green-600 text-white border-0 shadow-lg">
          <CardHeader className="text-center p-4 md:p-6">
            <CardTitle className="text-xl md:text-2xl font-bold flex items-center justify-center space-x-2">
              <Trophy className="w-5 h-5 md:w-6 md:h-6" />
              <span>Wellness Challenges</span>
            </CardTitle>
            <p className="text-blue-100 text-sm md:text-base mt-2">
              Build healthy habits through fun, achievable goals
            </p>
          </CardHeader>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-blue-600">{(activeChallenges as any[]).length}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-green-600">{(completedChallenges as any[]).length}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-purple-600">{getTotalPoints()}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Total Points</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-orange-600">
                {(activeChallenges as any[]).filter((c: any) => getProgressPercentage(c) > 75).length}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">Near Completion</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Challenges */}
        {(activeChallenges as any[]).length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
                <Flame className="w-5 h-5 text-orange-500" />
                <span>Active Challenges</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
              {(activeChallenges as any[]).map((challenge: any, index: number) => (
                <div key={`active-${challenge.challengeId || challenge.id}-${index}`} className="border rounded-xl p-3 md:p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-2 md:space-x-3 flex-1 min-w-0">
                      <span className="text-xl md:text-2xl flex-shrink-0">{challenge.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base truncate">{challenge.title}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>
                      </div>
                    </div>
                    <Badge className={`${getDifficultyColor(challenge.difficulty)} text-xs flex-shrink-0 ml-2`}>
                      {challenge.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span>Progress: {challenge.progress?.completed || 0}/{challenge.duration} days</span>
                      <span className="font-medium">{getProgressPercentage(challenge)}%</span>
                    </div>
                    <Progress value={getProgressPercentage(challenge)} className="h-2 md:h-3" />
                  </div>

                  <div className="space-y-3 mt-3">
                    {(challenge.progress?.completed || 0) > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 md:p-3 rounded-lg">
                        <p className="text-xs md:text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                          <Flame className="w-3 h-3 md:w-4 md:h-4" />
                          Current streak: {challenge.progress?.completed || 0} day{(challenge.progress?.completed || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div className="flex items-center space-x-2 text-xs md:text-sm text-muted-foreground">
                        <Star className="w-3 h-3 md:w-4 md:h-4" />
                        <span>{challenge.points} points</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => completeChallengeeMutation.mutate(challenge.challengeId)}
                        disabled={completeChallengeeMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-xs md:text-sm px-3 md:px-4 py-2 w-full sm:w-auto"
                      >
                        {completeChallengeeMutation.isPending ? "Completing..." : "Complete Today"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Available Challenges */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
              <Target className="w-5 h-5 text-blue-500" />
              <span>Available Challenges</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {predefinedChallenges.map((challenge) => (
                <Card key={challenge.id} className="hover:shadow-md transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-2 flex-1 min-w-0">
                        <span className="text-lg md:text-xl flex-shrink-0">{challenge.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-1">{challenge.title}</h3>
                          <div className="flex flex-wrap gap-1 md:gap-2">
                            <Badge variant="outline" className="text-xs">
                              {challenge.duration} days
                            </Badge>
                            <Badge className={`text-xs ${getDifficultyColor(challenge.difficulty)}`}>
                              {challenge.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">{challenge.description}</p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="text-xs font-medium">Benefits:</div>
                      <div className="flex flex-wrap gap-1">
                        {challenge.benefits.slice(0, 3).map((benefit, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                        {challenge.benefits.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{challenge.benefits.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div className="flex items-center space-x-1 text-xs md:text-sm text-muted-foreground">
                        <Star className="w-3 h-3 md:w-4 md:h-4" />
                        <span>{challenge.points} points</span>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedChallenge(challenge)}
                            className="text-xs md:text-sm px-3 md:px-4 py-2 w-full sm:w-auto"
                          >
                            Start Challenge
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <span>{challenge.icon}</span>
                              <span>{challenge.title}</span>
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>{challenge.description}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Duration:</span> {challenge.duration} days
                              </div>
                              <div>
                                <span className="font-medium">Difficulty:</span> {challenge.difficulty}
                              </div>
                              <div>
                                <span className="font-medium">Points:</span> {challenge.points}
                              </div>
                              <div>
                                <span className="font-medium">Type:</span> {challenge.type}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium mb-2">Benefits:</div>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {challenge.benefits.map((benefit, index) => (
                                  <li key={index}>{benefit}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline">Cancel</Button>
                              <Button 
                                onClick={() => joinChallengeMutation.mutate(challenge.id)}
                                disabled={joinChallengeMutation.isPending}
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                {joinChallengeMutation.isPending ? 'Starting...' : 'Start Challenge'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Completed Challenges */}
        {(completedChallenges as any[]).length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Completed Challenges</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="space-y-3">
                {(completedChallenges as any[]).map((challenge: any, index: number) => (
                  <div key={`completed-${challenge.id}-${index}`} className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl border border-green-200 dark:border-green-800 shadow-sm">
                    <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                      <span className="text-lg md:text-xl flex-shrink-0">{challenge.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm md:text-base truncate">{challenge.title}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">
                          Completed on {new Date(challenge.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-shrink-0">
                      <Badge className="bg-green-600 text-white text-xs">
                        +{challenge.points} points
                      </Badge>
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 hidden sm:block" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}