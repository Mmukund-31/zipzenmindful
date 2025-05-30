import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get recent mood for context
  const { data: recentMood } = useQuery({
    queryKey: ["/api/mood/recent"],
  });

  // Get chat messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/chat"],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          isUser: true,
        }),
      });
    },
    onSuccess: async () => {
      // Generate AI response
      await generateResponseMutation.mutateAsync(message);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Generate AI response mutation
  const generateResponseMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      return await apiRequest("/api/chat/response", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage,
          currentMood: recentMood?.mood,
        }),
      });
    },
    onSuccess: (response) => {
      // Add AI response to chat
      apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: response.response,
          isUser: false,
        }),
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="p-4 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI Wellness Chat</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Share your thoughts and get personalized support
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Bot className="w-12 h-12 mx-auto mb-3 text-blue-500" />
              <p className="text-gray-600 dark:text-gray-300">
                Hi! I'm here to support your mental wellness journey. 
                How are you feeling today?
              </p>
            </CardContent>
          </Card>
        ) : (
          messages.map((msg: any, index: number) => (
            <div
              key={index}
              className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.isUser
                    ? "bg-blue-500 text-white ml-4"
                    : "bg-white dark:bg-gray-800 shadow-sm mr-4"
                }`}
              >
                <div className="flex items-start space-x-2">
                  {!msg.isUser && (
                    <Bot className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                  )}
                  {msg.isUser && (
                    <User className="w-4 h-4 mt-0.5 text-white flex-shrink-0" />
                  )}
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                </div>
              </div>
            </div>
          ))
        )}

        {(sendMessageMutation.isPending || generateResponseMutation.isPending) && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 shadow-sm p-3 rounded-lg mr-4">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-blue-500" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share what's on your mind..."
            className="flex-1"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}