import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Volume2, VolumeX, Send, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: number;
  message: string;
  response: string;
  isUser: boolean;
  timestamp: string;
}

const supportedLanguages = [
  // Global Languages
  { code: 'en', name: 'English', flag: '🇺🇸', region: 'Global' },
  { code: 'es', name: 'Español', flag: '🇪🇸', region: 'Global' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', region: 'Global' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', region: 'Global' },
  { code: 'zh', name: '中文', flag: '🇨🇳', region: 'Global' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', region: 'Global' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', region: 'Global' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', region: 'Global' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', region: 'Global' },
  
  // Indian Languages
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', region: 'India' },
  { code: 'bn', name: 'বাংলা', flag: '🇮🇳', region: 'India' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳', region: 'India' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳', region: 'India' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳', region: 'India' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳', region: 'India' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳', region: 'India' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳', region: 'India' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳', region: 'India' },
  { code: 'ur', name: 'اردو', flag: '🇮🇳', region: 'India' },
  { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳', region: 'India' },
  { code: 'as', name: 'অসমীয়া', flag: '🇮🇳', region: 'India' },
  { code: 'ks', name: 'कॉशुर / کٲشُر', flag: '🇮🇳', region: 'India' }
];

const quickResponses = [
  { 
    en: "How are you feeling today?", hi: "आज आप कैसा महसूस कर रहे हैं?", 
    bn: "আজ আপনি কেমন বোধ করছেন?", ta: "இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?", 
    te: "ఈరోజు మీరు ఎలా అనిపిస్తోంది?", ml: "ഇന്ന് നിങ്ങൾക്ക് എങ്ങനെ തോന്നുന്നു?",
    kn: "ಇಂದು ನೀವು ಹೇಗೆ ಅನಿಸುತ್ತಿದೆ?", gu: "આજે તમને કેવું લાગે છે?",
    mr: "आज तुम्हाला कसे वाटते?", pa: "ਅੱਜ ਤੁਸੀਂ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ?",
    or: "ଆଜି ତୁମେ କିପରି ଅନୁଭବ କରୁଛ?", as: "আজি তুমি কেনে অনুভৱ কৰিছা?"
  },
  { 
    en: "Tell me a joke", hi: "मुझे एक जोक सुनाओ", 
    bn: "আমাকে একটা জোক বলো", ta: "எனக்கு ஒரு நகைச்சுவை சொல்லுங்கள்", 
    te: "నాకు ఒక జోక్ చెప్పండి", ml: "എനിക്ക് ഒരു തമാശ പറയൂ",
    kn: "ನನಗೆ ಒಂದು ಹಾಸ್ಯ ಹೇಳಿ", gu: "મને એક મજાક કહો",
    mr: "मला एक विनोद सांगा", pa: "ਮੈਨੂੰ ਇੱਕ ਮਜ਼ਾਕ ਸੁਣਾਓ",
    or: "ମୋତେ ଏକ ରସିକତା କୁହ", as: "মোক এটা ৰসিকতা কোৱা"
  },
  { 
    en: "Help me relax", hi: "आराम करने में मदद करो", 
    bn: "আমাকে শিথিল হতে সাহায্য করো", ta: "எனக்கு ஓய்வெடுக்க உதவுங்கள்", 
    te: "నాకు విశ్రాంతి తీసుకోవడంలో సహాయం చేయండి", ml: "എന്നെ വിശ്രമിക്കാൻ സഹായിക്കൂ",
    kn: "ನನಗೆ ವಿಶ್ರಾಂತಿ ಪಡೆಯಲು ಸಹಾಯ ಮಾಡಿ", gu: "મને આરામ કરવામાં મદદ કરો",
    mr: "मला आराम करण्यात मदत करा", pa: "ਮੈਨੂੰ ਆਰਾਮ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰੋ",
    or: "ମୋତେ ଆରାମ କରିବାରେ ସାହାଯ୍ୟ କର", as: "মোক জিৰণি ল'বলৈ সহায় কৰা"
  },
];

export default function Chat() {
  const [message, setMessage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize speech synthesis and recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthesisRef.current = window.speechSynthesis;
      
      if ('webkitSpeechRecognition' in window) {
        recognitionRef.current = new (window as any).webkitSpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        recognitionRef.current.onresult = (event: any) => {
          const speechToText = event.results[0][0].transcript;
          setMessage(speechToText);
          // Auto-send voice messages
          setTimeout(() => {
            if (speechToText.trim()) {
              chatMutation.mutate(speechToText);
            }
          }, 500);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  // Fetch messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/chat"],
  });

  // Fetch recent mood for context
  const { data: recentMood } = useQuery({
    queryKey: ["/api/mood/recent"],
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      setIsTyping(true);
      
      // Get current user session
      const userId = localStorage.getItem('currentUserId') || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ 
          message: userMessage,
          preferredLanguage: selectedLanguage 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return await response.json();
    },
    onSuccess: (data: any) => {
      setMessage("");
      setIsTyping(false);
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      
      // Speak the AI response if voice is enabled
      if (voiceEnabled && data.response) {
        speakText(data.response);
      }
    },
    onError: () => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Enhanced multilingual voice synthesis with automatic language detection
  const speakText = (text: string) => {
    if (!synthesisRef.current || !voiceEnabled) return;

    // Cancel any ongoing speech
    synthesisRef.current.cancel();

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Enhanced language detection for proper voice selection
      const detectLanguageFromText = (text: string): string => {
        // Unicode ranges for different scripts
        const patterns = {
          'hi': /[\u0900-\u097F]/, // Devanagari (Hindi)
          'bn': /[\u0980-\u09FF]/, // Bengali
          'ta': /[\u0B80-\u0BFF]/, // Tamil
          'te': /[\u0C00-\u0C7F]/, // Telugu
          'ml': /[\u0D00-\u0D7F]/, // Malayalam
          'kn': /[\u0C80-\u0CFF]/, // Kannada
          'gu': /[\u0A80-\u0AFF]/, // Gujarati
          'mr': /[\u0900-\u097F]/, // Marathi (Devanagari)
          'pa': /[\u0A00-\u0A7F]/, // Punjabi (Gurmukhi)
          'or': /[\u0B00-\u0B7F]/, // Odia
          'as': /[\u0980-\u09FF]/, // Assamese (Bengali script)
          'ur': /[\u0600-\u06FF]/, // Arabic script (Urdu)
          'ar': /[\u0600-\u06FF]/, // Arabic
          'zh': /[\u4e00-\u9fff]/, // Chinese
          'ja': /[\u3040-\u309F\u30A0-\u30FF\u4e00-\u9fff]/, // Japanese
          'ko': /[\uAC00-\uD7AF]/, // Korean
        };

        for (const [lang, pattern] of Object.entries(patterns)) {
          if (pattern.test(text)) {
            return lang;
          }
        }
        
        // If no specific script detected, use selected language
        return selectedLanguage;
      };

      const detectedLanguage = detectLanguageFromText(text);
      console.log(`Detected language: ${detectedLanguage} for text: ${text.substring(0, 50)}...`);

      // Enhanced voice mapping with better fallbacks
      const voiceLanguageMap: { [key: string]: string[] } = {
        'hi': ['hi-IN', 'hi'],
        'bn': ['bn-IN', 'bn-BD', 'bn'],
        'ta': ['ta-IN', 'ta-LK', 'ta'],
        'te': ['te-IN', 'te'],
        'ml': ['ml-IN', 'ml'],
        'kn': ['kn-IN', 'kn'],
        'gu': ['gu-IN', 'gu'],
        'mr': ['mr-IN', 'mr'],
        'pa': ['pa-IN', 'pa'],
        'or': ['or-IN', 'or'],
        'as': ['as-IN', 'as'],
        'ur': ['ur-IN', 'ur-PK', 'ur'],
        'ks': ['ks-IN', 'ks'],
        'en': ['en-US', 'en-GB', 'en-AU', 'en'],
        'es': ['es-ES', 'es-US', 'es-MX', 'es'],
        'fr': ['fr-FR', 'fr-CA', 'fr'],
        'de': ['de-DE', 'de-AT', 'de'],
        'zh': ['zh-CN', 'zh-TW', 'zh-HK', 'zh'],
        'ja': ['ja-JP', 'ja'],
        'ko': ['ko-KR', 'ko'],
        'ar': ['ar-SA', 'ar-EG', 'ar'],
        'pt': ['pt-BR', 'pt-PT', 'pt']
      };

      // Set the language for the utterance
      const languageCodes = voiceLanguageMap[detectedLanguage] || ['en-US'];
      utterance.lang = languageCodes[0];

      // Get available voices and log them
      const voices = synthesisRef.current!.getVoices();
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));

      // Find the best matching voice
      let preferredVoice = null;
      for (const langCode of languageCodes) {
        preferredVoice = voices.find(voice => 
          voice.lang.toLowerCase().startsWith(langCode.toLowerCase())
        );
        if (preferredVoice) break;
      }

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log(`Using voice: ${preferredVoice.name} (${preferredVoice.lang}) for detected language: ${detectedLanguage}`);
      } else {
        console.log(`No suitable voice found for language: ${detectedLanguage}, using default with lang: ${utterance.lang}`);
      }
      
      // Adjust voice based on current mood and language
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
      } else {
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
      }

      utterance.volume = 0.8;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthesisRef.current!.speak(utterance);
    };

    // Wait for voices to load if necessary
    const voices = synthesisRef.current.getVoices();
    if (voices.length === 0) {
      // Voices haven't loaded yet, wait for them
      const handleVoicesChanged = () => {
        synthesisRef.current?.removeEventListener('voiceschanged', handleVoicesChanged);
        speak();
      };
      synthesisRef.current.addEventListener('voiceschanged', handleVoicesChanged);
      
      // Fallback timeout in case voiceschanged doesn't fire
      setTimeout(() => {
        synthesisRef.current?.removeEventListener('voiceschanged', handleVoicesChanged);
        speak();
      }, 1000);
    } else {
      speak();
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isTyping) {
      // Update recognition language dynamically when starting
      const languageMap: { [key: string]: string } = {
        'en': 'en-US', 'hi': 'hi-IN', 'bn': 'bn-IN', 'ta': 'ta-IN', 'te': 'te-IN',
        'ml': 'ml-IN', 'kn': 'kn-IN', 'gu': 'gu-IN', 'mr': 'mr-IN', 'pa': 'pa-IN',
        'or': 'or-IN', 'as': 'as-IN', 'ur': 'ur-IN', 'ks': 'ks-IN', 'es': 'es-ES',
        'fr': 'fr-FR', 'de': 'de-DE', 'zh': 'zh-CN', 'ja': 'ja-JP', 'ko': 'ko-KR',
        'ar': 'ar-SA', 'pt': 'pt-BR'
      };
      
      recognitionRef.current.lang = languageMap[selectedLanguage] || 'en-US';
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('selectedLanguage', selectedLanguage);
  }, [selectedLanguage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">AI Chat Assistant</h1>
              <p className="text-gray-600 dark:text-gray-300">Your multilingual wellness companion</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={selectedLanguage} onValueChange={(newLang) => {
                setSelectedLanguage(newLang);
                toast({
                  title: `Language changed to ${supportedLanguages.find(l => l.code === newLang)?.name}`,
                  description: "Voice recognition and AI responses will now use this language",
                });
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto z-50">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Global Languages</div>
                  {supportedLanguages.filter(lang => lang.region === 'Global').map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">Indian Languages</div>
                  {supportedLanguages.filter(lang => lang.region === 'India').map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={toggleVoice}
                className={`${voiceEnabled ? "text-blue-600 border-blue-600" : "text-gray-400"} transition-colors`}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Voice</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages && Array.isArray(messages) && messages.length > 0 ? (
              messages.map((msg: any, index: number) => (
                <div key={`conversation-${index}`} className="space-y-4">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-md shadow-sm">
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                  
                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-4 py-2 max-w-md shadow-sm border border-gray-200 dark:border-gray-600">
                      <p className="text-sm whitespace-pre-wrap">{msg.response}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-4">💬</div>
                  <p className="text-lg font-medium">Start a conversation</p>
                  <p className="text-sm">Choose a language and begin chatting</p>
                </div>
              </div>
            )}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 rounded-lg px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-600">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Responses */}
          {(!messages || !Array.isArray(messages) || messages.length === 0) && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Quick starters:</div>
              <div className="flex flex-wrap gap-2">
                {quickResponses.slice(0, 3).map((responseObj, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300 transition-colors"
                    onClick={() => handleQuickResponse(responseObj[selectedLanguage as keyof typeof responseObj] || responseObj.en)}
                  >
                    {responseObj[selectedLanguage as keyof typeof responseObj] || responseObj.en}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Type your message in ${supportedLanguages.find(l => l.code === selectedLanguage)?.name}...`}
                disabled={chatMutation.isPending || isListening}
                className="flex-1"
              />
              
              <Button
                onClick={() => isListening ? stopListening() : startListening()}
                variant={isListening ? "destructive" : "outline"}
                disabled={!recognitionRef.current || isTyping}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Button
                onClick={() => handleSendMessage()}
                disabled={!message.trim() || chatMutation.isPending || isListening}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}