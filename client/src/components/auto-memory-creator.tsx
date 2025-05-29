import { useState } from "react";
import { Sparkles, Calendar, Users, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AutoMemoryCreatorProps {
  memories: Array<{
    id: number;
    title: string;
    imageUrl: string;
    category: string;
    createdAt: string;
  }>;
  onCreateMemory: (photos: any[], title: string) => void;
}

export default function AutoMemoryCreator({ memories, onCreateMemory }: AutoMemoryCreatorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const createRandomMemory = () => {
    if (memories.length < 3) return;
    
    setIsGenerating(true);
    
    setTimeout(() => {
      const shuffledMemories = shuffleArray(memories);
      const selectedPhotos = shuffledMemories.slice(0, Math.min(8, memories.length));
      
      const memoryTitles = [
        "Cherished Moments",
        "Beautiful Memories",
        "Happy Times",
        "Special Moments",
        "Wonderful Days",
        "Precious Times",
        "Golden Memories",
        "Sweet Moments"
      ];
      
      const randomTitle = memoryTitles[Math.floor(Math.random() * memoryTitles.length)];
      onCreateMemory(selectedPhotos, randomTitle);
      setIsGenerating(false);
    }, 1000);
  };

  const createCategoryMemory = (category: string) => {
    const categoryPhotos = memories.filter(m => m.category === category);
    if (categoryPhotos.length < 2) return;
    
    setIsGenerating(true);
    
    setTimeout(() => {
      const shuffledPhotos = shuffleArray(categoryPhotos);
      const selectedPhotos = shuffledPhotos.slice(0, Math.min(6, categoryPhotos.length));
      
      const categoryTitles = {
        family: "Family Moments",
        friends: "Time with Friends",
        pets: "Pet Adventures",
        other: "Special Times"
      };
      
      const title = categoryTitles[category as keyof typeof categoryTitles] || "Memory Collection";
      onCreateMemory(selectedPhotos, title);
      setIsGenerating(false);
    }, 1000);
  };

  const createRecentMemory = () => {
    const recentPhotos = memories
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, Math.min(5, memories.length));
    
    if (recentPhotos.length < 2) return;
    
    setIsGenerating(true);
    
    setTimeout(() => {
      onCreateMemory(recentPhotos, "Recent Highlights");
      setIsGenerating(false);
    }, 1000);
  };

  const getAvailableCategories = () => {
    const categoryCounts = memories.reduce((acc, memory) => {
      acc[memory.category] = (acc[memory.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categoryCounts).filter(([_, count]) => count >= 2);
  };

  if (memories.length < 2) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Create Your First Memory Gallery</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload at least 2 photos to automatically create beautiful memory collections
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Auto Memory Creator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={createRandomMemory}
            disabled={isGenerating || memories.length < 3}
            className="h-auto p-4 flex flex-col items-center gap-2"
            variant="outline"
          >
            <Sparkles className="w-5 h-5" />
            <div className="text-center">
              <div className="font-medium">Random Mix</div>
              <div className="text-xs text-muted-foreground">
                {Math.min(8, memories.length)} photos
              </div>
            </div>
          </Button>

          <Button
            onClick={createRecentMemory}
            disabled={isGenerating || memories.length < 2}
            className="h-auto p-4 flex flex-col items-center gap-2"
            variant="outline"
          >
            <Calendar className="w-5 h-5" />
            <div className="text-center">
              <div className="font-medium">Recent Highlights</div>
              <div className="text-xs text-muted-foreground">
                Latest {Math.min(5, memories.length)} photos
              </div>
            </div>
          </Button>
        </div>

        {getAvailableCategories().length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Category Collections</h4>
            <div className="flex flex-wrap gap-2">
              {getAvailableCategories().map(([category, count]) => (
                <Button
                  key={category}
                  onClick={() => createCategoryMemory(category)}
                  disabled={isGenerating}
                  size="sm"
                  variant="outline"
                  className="h-auto p-2"
                >
                  <div className="flex items-center gap-1">
                    {category === 'family' && <Users className="w-3 h-3" />}
                    {category === 'friends' && <Heart className="w-3 h-3" />}
                    {category === 'pets' && <span className="text-xs">🐾</span>}
                    {category === 'other' && <Sparkles className="w-3 h-3" />}
                    <span className="capitalize text-xs">{category}</span>
                    <Badge variant="secondary" className="ml-1 h-4 text-xs">
                      {count}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Creating your memory...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}