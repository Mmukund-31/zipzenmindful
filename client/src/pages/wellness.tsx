import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import BreathingExercise from "@/components/breathing-exercise";
import ThoughtInterruptor from "@/components/thought-interruptor";
import DailyWellnessTip from "@/components/daily-wellness-tip";
import { Brain, Heart, Mic, Wind, Zap, Star, CheckCircle } from "lucide-react";

export default function Wellness() {
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);

  const { data: recentMood } = useQuery({
    queryKey: ["/api/mood/recent"],
  });

  const handleActivityComplete = (activityId: string) => {
    setCompletedActivities(prev => [...prev, activityId]);
  };

  const wellnessTools = [
    {
      id: 'breathing',
      title: 'Breathing Exercise',
      description: 'Calm your mind with guided 4-7-8 breathing',
      icon: <Wind className="w-6 h-6" />,
      duration: '4-6 min',
      benefits: ['Reduces anxiety', 'Improves focus', 'Lowers stress'],
      color: 'blue'
    },
    {
      id: 'thoughts',
      title: 'Thought Interruption',
      description: 'Break the cycle of overthinking with proven techniques',
      icon: <Brain className="w-6 h-6" />,
      duration: '2-5 min',
      benefits: ['Stops negative spirals', 'Redirects focus', 'Builds resilience'],
      color: 'purple'
    },
    {
      id: 'voice',
      title: 'Voice Assistant',
      description: 'Talk with AI that responds to your current mood',
      icon: <Mic className="w-6 h-6" />,
      duration: 'Ongoing',
      benefits: ['Personalized support', 'Natural conversation', 'Mood-aware responses'],
      color: 'green'
    }
  ];

  const getMoodBasedRecommendation = () => {
    if (!recentMood?.mood) {
      return {
        title: "Welcome to your wellness toolkit!",
        description: "These tools are designed to help you manage stress and overthinking. Start with any technique that calls to you.",
        recommendedTool: null
      };
    }

    const mood = recentMood.mood.toLowerCase();
    
    switch (mood) {
      case 'anxious':
      case 'stressed':
        return {
          title: "Feeling anxious? Let's find some calm together.",
          description: "When anxiety strikes, breathing exercises can help regulate your nervous system and bring you back to the present moment.",
          recommendedTool: 'breathing'
        };
      case 'overwhelmed':
      case 'confused':
        return {
          title: "When thoughts feel overwhelming, interruption techniques work wonders.",
          description: "Breaking the cycle of overthinking can give your mind the space it needs to find clarity and peace.",
          recommendedTool: 'thoughts'
        };
      case 'lonely':
      case 'sad':
        return {
          title: "You don't have to face difficult emotions alone.",
          description: "Sometimes talking through feelings with an understanding voice can provide comfort and perspective.",
          recommendedTool: 'voice'
        };
      default:
        return {
          title: "Great to see you taking care of your mental health!",
          description: "Regular practice of these techniques builds emotional resilience for whatever life brings.",
          recommendedTool: null
        };
    }
  };

  const recommendation = getMoodBasedRecommendation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Wellness Toolkit</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Science-backed tools to help you manage stress, interrupt overthinking, and find your inner calm
          </p>
        </div>

        {/* Mood-based recommendation */}
        <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">{recommendation.title}</CardTitle>
            </div>
            <CardDescription className="text-base">
              {recommendation.description}
            </CardDescription>
            {recentMood?.mood && (
              <Badge variant="secondary" className="w-fit">
                Current mood: {recentMood.mood}
              </Badge>
            )}
          </CardHeader>
        </Card>

        {/* Tools overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {wellnessTools.map((tool) => (
            <Card 
              key={tool.id}
              className={`border-2 transition-all duration-200 ${
                recommendation.recommendedTool === tool.id 
                  ? 'border-blue-400 shadow-lg scale-105' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${
                completedActivities.includes(tool.id) ? 'bg-green-50' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-full ${
                    tool.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    tool.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {tool.icon}
                  </div>
                  {completedActivities.includes(tool.id) && (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <CardTitle className="text-xl">{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
                <Badge variant="outline">{tool.duration}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Benefits:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {tool.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Heart className="w-3 h-3 text-red-400" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Interactive tools */}
        <Tabs defaultValue="breathing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white border">
            <TabsTrigger value="breathing" className="flex items-center space-x-2">
              <Wind className="w-4 h-4" />
              <span>Breathing</span>
            </TabsTrigger>
            <TabsTrigger value="thoughts" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>Thoughts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="breathing">
            <BreathingExercise 
              onComplete={() => handleActivityComplete('breathing')}
            />
          </TabsContent>

          <TabsContent value="thoughts">
            <ThoughtInterruptor 
              onComplete={() => handleActivityComplete('thoughts')}
            />
          </TabsContent>
        </Tabs>

        {/* Progress encouragement */}
        {completedActivities.length > 0 && (
          <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Amazing progress! 🎉
              </h3>
              <p className="text-green-700">
                You've completed {completedActivities.length} wellness {completedActivities.length === 1 ? 'activity' : 'activities'} today. 
                Every step you take toward managing stress and overthinking is a victory worth celebrating!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Daily AI-powered wellness tip */}
        <DailyWellnessTip />
      </div>
    </div>
  );
}