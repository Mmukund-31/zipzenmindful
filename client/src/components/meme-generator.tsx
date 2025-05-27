import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Smile, Download, Sparkles, Type, Palette, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MemeGeneratorProps {
  memories: any[];
}

const memeTemplates = [
  { id: "motivation", name: "Motivational", textTop: "WHEN YOU TRACK YOUR MOOD", textBottom: "AND SEE POSITIVE PROGRESS" },
  { id: "wholesome", name: "Wholesome", textTop: "LOOKING AT HAPPY MEMORIES", textBottom: "INSTANT MOOD BOOST" },
  { id: "success", name: "Success Kid", textTop: "TALKED TO AI THERAPIST", textBottom: "FEELING BETTER ALREADY" },
  { id: "drake", name: "Drake Format", textTop: "IGNORING MENTAL HEALTH", textBottom: "USING MINDEASE APP" },
  { id: "custom", name: "Custom Text", textTop: "", textBottom: "" },
];

const textStyles = [
  { id: "classic", name: "Classic Meme", font: "Impact", color: "#FFFFFF", stroke: "#000000", size: 32 },
  { id: "modern", name: "Modern", font: "Arial", color: "#FFFFFF", stroke: "#333333", size: 28 },
  { id: "fun", name: "Fun", font: "Comic Sans MS", color: "#FF6B6B", stroke: "#FFFFFF", size: 30 },
  { id: "elegant", name: "Elegant", font: "Georgia", color: "#2C3E50", stroke: "#FFFFFF", size: 26 },
];

export default function MemeGenerator({ memories }: MemeGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("motivation");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [textStyle, setTextStyle] = useState("classic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMeme, setGeneratedMeme] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // AI-powered text suggestions
  const generateFunnyTextMutation = useMutation({
    mutationFn: async (memory: any) => {
      return apiRequest("POST", "/api/meme/generate-text", {
        memoryTitle: memory.title,
        memoryCategory: memory.category,
        style: "funny"
      });
    },
    onSuccess: (data) => {
      setTopText(data.topText);
      setBottomText(data.bottomText);
    },
    onError: () => {
      // Fallback to template text if AI fails
      const template = memeTemplates.find(t => t.id === selectedTemplate);
      if (template) {
        setTopText(template.textTop);
        setBottomText(template.textBottom);
      }
    },
  });

  const handleMemorySelect = (memory: any) => {
    setSelectedMemory(memory);
    if (selectedTemplate !== "custom") {
      generateFunnyTextMutation.mutate(memory);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = memeTemplates.find(t => t.id === templateId);
    if (template && selectedMemory && templateId !== "custom") {
      generateFunnyTextMutation.mutate(selectedMemory);
    } else if (template) {
      setTopText(template.textTop);
      setBottomText(template.textBottom);
    }
  };

  const generateMeme = async () => {
    if (!selectedMemory || !canvasRef.current) return;

    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      // Set canvas size
      canvas.width = 400;
      canvas.height = 400;

      // Load and draw the image
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = selectedMemory.imageUrl;
      });

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Get text style
      const style = textStyles.find(s => s.id === textStyle) || textStyles[0];

      // Set text properties
      ctx.font = `bold ${style.size}px ${style.font}`;
      ctx.fillStyle = style.color;
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Draw top text
      if (topText) {
        const lines = wrapText(ctx, topText.toUpperCase(), canvas.width - 20);
        lines.forEach((line, index) => {
          const y = 20 + (index * (style.size + 5));
          ctx.strokeText(line, canvas.width / 2, y);
          ctx.fillText(line, canvas.width / 2, y);
        });
      }

      // Draw bottom text
      if (bottomText) {
        ctx.textBaseline = 'bottom';
        const lines = wrapText(ctx, bottomText.toUpperCase(), canvas.width - 20);
        lines.reverse().forEach((line, index) => {
          const y = canvas.height - 20 - (index * (style.size + 5));
          ctx.strokeText(line, canvas.width / 2, y);
          ctx.fillText(line, canvas.width / 2, y);
        });
      }

      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setGeneratedMeme(url);
          toast({
            title: "Meme created!",
            description: "Your funny meme is ready to download and share.",
          });
        }
      }, 'image/png');

    } catch (error) {
      toast({
        title: "Meme creation failed",
        description: "There was an error creating your meme. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const downloadMeme = () => {
    if (generatedMeme) {
      const a = document.createElement('a');
      a.href = generatedMeme;
      a.download = `meme-${selectedMemory?.title || 'funny'}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const randomizeText = () => {
    if (selectedMemory) {
      generateFunnyTextMutation.mutate(selectedMemory);
    }
  };

  if (memories.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Smile className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Add some memories first to create memes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Smile className="w-4 h-4 mr-2" />
          Create Funny Meme
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meme Generator</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Memory Selection */}
          <div className="space-y-2">
            <Label>Choose a Photo</Label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className={`relative cursor-pointer rounded-lg overflow-hidden ${
                    selectedMemory?.id === memory.id
                      ? 'ring-2 ring-primary'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => handleMemorySelect(memory)}
                >
                  <img
                    src={memory.imageUrl}
                    alt={memory.title}
                    className="w-full h-16 object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {selectedMemory && (
            <>
              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Meme Style</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {memeTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Text Inputs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Meme Text</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={randomizeText}
                    disabled={generateFunnyTextMutation.isPending}
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${generateFunnyTextMutation.isPending ? 'animate-spin' : ''}`} />
                    AI Suggest
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Input
                    placeholder="Top text"
                    value={topText}
                    onChange={(e) => setTopText(e.target.value)}
                  />
                  <Input
                    placeholder="Bottom text"
                    value={bottomText}
                    onChange={(e) => setBottomText(e.target.value)}
                  />
                </div>
              </div>

              {/* Text Style */}
              <div className="space-y-2">
                <Label>Text Style</Label>
                <Select value={textStyle} onValueChange={setTextStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {textStyles.map(style => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview Canvas (hidden) */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Generated Meme Preview */}
              {generatedMeme && (
                <div className="space-y-3">
                  <Label>Your Meme</Label>
                  <div className="bg-muted rounded-lg p-4">
                    <img
                      src={generatedMeme}
                      alt="Generated meme"
                      className="w-full rounded-lg border"
                    />
                    <Button onClick={downloadMeme} className="w-full mt-3">
                      <Download className="w-4 h-4 mr-2" />
                      Download Meme
                    </Button>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={generateMeme}
                disabled={isGenerating || !topText || !bottomText}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating Meme...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Meme
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}