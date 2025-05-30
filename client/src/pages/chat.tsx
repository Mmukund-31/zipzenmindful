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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsTyping(false);
    },
  });

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const speechToText = event.results[0][0].transcript;
        setMessage(speechToText);
        // Auto-send voice messages
        handleSendMessage(speechToText);
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

  const speakResponse = (text: string) => {
    if (!synthesisRef.current || !voiceEnabled) return;

    // Cancel any ongoing speech
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Adjust voice based on current mood
    const currentMood = (recentMood as any)?.mood;
    if (currentMood) {
      switch (currentMood.toLowerCase()) {
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

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isTyping) {
      setMessage("");
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (!voiceEnabled && synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = (messageText?: string) => {
    const textToSend = messageText || message;
    if (!textToSend.trim()) return;
    chatMutation.mutate(textToSend);
  };

  const handleQuickResponse = (response: string) => {
    setMessage(response);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col pb-20">
      {/* Chat Header */}
      <div className="bg-white border-b border-border p-4 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">MindEase Assistant</h3>
          <div className="flex items-center text-xs text-green-600">
            <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse-gentle"></span>
            Online
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted chat-scroll">
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

        {messages.map((msg: any) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 chat-bubble ${
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
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start space-x-3 chat-bubble">
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

      {/* Chat Input */}
      <div className="bg-white border-t border-border p-4">
        {/* Voice Status Indicator */}
        {(isListening || isSpeaking) && (
          <div className="mb-3 text-center">
            <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm ${
              isListening ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {isListening ? (
                <>
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  <span>Speaking...</span>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3 mb-3">
          {/* Voice Controls */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={chatMutation.isPending || isSpeaking}
              variant={isListening ? "destructive" : "outline"}
              size="sm"
              className={`w-10 h-10 rounded-full p-0 transition-all ${
                isListening ? 'animate-pulse' : ''
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={toggleVoice}
              variant="ghost"
              size="sm"
              className="w-8 h-8 rounded-full p-0"
              title={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
            >
              {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            </Button>
          </div>

          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Listening for your voice..." : "Type or speak your message..."}
              className="pr-12 rounded-full"
              disabled={isListening}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!message.trim() || chatMutation.isPending || isListening}
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Responses */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {quickResponses.map((response, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 transition-colors flex-shrink-0"
              onClick={() => handleQuickResponse(response)}
            >
              {response}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
