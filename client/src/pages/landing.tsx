import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, TrendingUp, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-6">
      <div className="max-w-md mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8 mt-8">
          <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Welcome to MindEase
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Your personal wellness companion for stress relief, mood tracking, and creating beautiful memories.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">AI Chat Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Talk to our compassionate AI assistant anytime you need support
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-secondary/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Mood Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Track your emotions and get personalized insights over time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Memory Gallery</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload photos of loved ones and create lasting memories
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Smart Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Get AI-powered insights about your wellness journey
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            Start Your Wellness Journey
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Secure login powered by your trusted account
          </p>
        </div>
      </div>
    </div>
  );
}