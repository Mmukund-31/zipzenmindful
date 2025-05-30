import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, Mic, MicOff, Volume2, VolumeX, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const quickResponses = [
  "I'm feeling anxious",
  "Need motivation",
  "Tell me a joke",
  "Help me relax",
];

export default function Chat() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/chat"],
  });

  const { data: recentMood } = useQuery({
    queryKey: ["/api/mood/recent"],
  });

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest("POST", "/api/chat", { message: userMessage });
      return response.json();
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      setMessage("");
      setIsTyping(false);
      
      // Speak the AI response if voice is enabled
      if (voiceEnabled && data.response && synthesisRef.current) {
        speakResponse(data.response);
      }
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const speechToText = event.results[0][0].transcript;
        setMessage(speechToText);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice Error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const speakResponse = (text: string) => {
    if (!synthesisRef.current || !voiceEnabled) return;

    // Cancel any ongoing speech
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose voice based on mood
    const voices = synthesisRef.current.getVoices();
    let selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
    
    if (recentMood?.mood) {
      // Adjust voice characteristics based on mood
      switch (recentMood.mood.toLowerCase()) {
        case 'anxious':
        case 'stressed':
          utterance.rate = 0.8; // Slower, calming pace
          utterance.pitch = 0.8; // Lower, soothing pitch
          break;
        case 'excited':
        case 'happy':
          utterance.rate = 1.1; // Slightly faster
          utterance.pitch = 1.1; // Higher, more energetic
          break;
        case 'sad':
        case 'lonely':
          utterance.rate = 0.9; // Gentle pace
          utterance.pitch = 0.9; // Warm, comforting tone
          break;
        default:
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
      }
    }
  };

  const handleSendMessage = (messageText: string) => {
    if (messageText.trim() && !chatMutation.isPending) {
      chatMutation.mutate(messageText.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(message);
    }
  };

  const handleQuickResponse = (response: string) => {
    handleSendMessage(response);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col pb-20">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-border p-4 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">MindEase Assistant</h3>
          <div className="flex items-center text-xs text-green-600">
            <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></span>
            Online
          </div>
        </div>
        {recentMood && (
          <div className="ml-auto">
            <Badge variant="secondary" className="text-xs">
              {recentMood.mood} {recentMood.emoji}
            </Badge>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">
              Welcome to MindEase Assistant
            </h3>
            <p className="text-sm text-muted-foreground">
              I'm here to support your mental wellness journey. How can I help you today?
            </p>
          </div>
        )}

        {(messages as any[]).map((msg: any) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.isFromUser ? "justify-end" : ""
            }`}
          >
            {!msg.isFromUser && (
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <Card className={`max-w-xs ${msg.isFromUser ? "bg-primary text-primary-foreground" : ""}`}>
              <CardContent className="p-3">
                <p className="text-sm">{msg.message}</p>
                <span className={`text-xs mt-2 block ${msg.isFromUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </CardContent>
            </Card>

            {msg.isFromUser && (
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <Card>
              <CardContent className="p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Response Buttons */}
      <div className="px-4 py-2 bg-background border-t border-border">
        <div className="flex flex-wrap gap-2 mb-2">
          {quickResponses.map((response) => (
            <Button
              key={response}
              variant="outline"
              size="sm"
              onClick={() => handleQuickResponse(response)}
              className="text-xs"
            >
              {response}
            </Button>
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-background border-t border-border">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={handleKeyPress}
              className="w-full"
            />
          </div>
          
          <Button
            onClick={toggleListening}
            variant={isListening ? "default" : "outline"}
            size="icon"
            className={isListening ? "bg-red-500 hover:bg-red-600" : ""}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          <Button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            variant={voiceEnabled ? "default" : "outline"}
            size="icon"
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>

          <Button
            onClick={() => handleSendMessage(message)}
            disabled={!message.trim() || chatMutation.isPending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}