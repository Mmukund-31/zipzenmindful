import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, Mic, MicOff, Volume2, VolumeX, Bot, User, Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const multilingualQuickResponses = [
  { 
    en: "I'm feeling anxious", hi: "मैं चिंतित महसूस कर रहा हूं", 
    bn: "আমি উদ্বিগ্ন বোধ করছি", ta: "நான் கவலையாக உணர்கிறேன்", 
    te: "నేను ఆందోళనగా అనిపిస్తుంది", ml: "എനിക്ക് ഉത്കണ്ഠ തോന്നുന്നു",
    kn: "ನಾನು ಚಿಂತೆಯಿಂದ ಭಾವಿಸುತ್ತಿದ್ದೇನೆ", gu: "મને ચિંતા લાગી રહી છે",
    mr: "मला चिंता वाटत आहे", pa: "ਮੈਂ ਚਿੰਤਾ ਮਹਿਸੂਸ ਕਰ ਰਿਹਾ ਹਾਂ",
    or: "ମୁଁ ଚିନ୍ତିତ ଅନୁଭବ କରୁଛି", as: "মই দুঃচিন্তিত অনুভব কৰিছো"
  },
  { 
    en: "Need motivation", hi: "प्रेरणा चाहिए", 
    bn: "অনুপ্রেরণা দরকার", ta: "உந்துதல் தேவை", 
    te: "ప్రేరణ అవసరం", ml: "പ്രചോദനം വേണം",
    kn: "ಪ್ರೇರಣೆ ಬೇಕು", gu: "પ્રેરણાની જરૂર છે",
    mr: "प्रेरणा हवी", pa: "ਪ੍ਰੇਰਣਾ ਚਾਹੀਦੀ ਹੈ",
    or: "ପ୍ରେରଣା ଦରକାର", as: "প্ৰেৰণাৰ প্ৰয়োজন"
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
  
  // Indian Languages - North to South
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳', region: 'North India', native: 'Hindi' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳', region: 'North India', native: 'Punjabi' },
  { code: 'ur', name: 'اردو', flag: '🇮🇳', region: 'North India', native: 'Urdu' },
  { code: 'ks', name: 'कॉशुर', flag: '🇮🇳', region: 'North India', native: 'Kashmiri' },
  { code: 'bn', name: 'বাংলা', flag: '🇮🇳', region: 'East India', native: 'Bengali' },
  { code: 'as', name: 'অসমীয়া', flag: '🇮🇳', region: 'East India', native: 'Assamese' },
  { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳', region: 'East India', native: 'Odia' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳', region: 'West India', native: 'Gujarati' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳', region: 'West India', native: 'Marathi' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳', region: 'South India', native: 'Kannada' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳', region: 'South India', native: 'Telugu' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳', region: 'South India', native: 'Tamil' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳', region: 'South India', native: 'Malayalam' },
];

export default function Chat() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
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
      const response = await apiRequest("POST", "/api/chat", { 
        message: userMessage,
        preferredLanguage: selectedLanguage 
      });
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
      // Set language based on selected language with proper locale codes for Indian languages
      const languageMap: { [key: string]: string } = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'bn': 'bn-IN',
        'ta': 'ta-IN',
        'te': 'te-IN',
        'ml': 'ml-IN',
        'kn': 'kn-IN',
        'gu': 'gu-IN',
        'mr': 'mr-IN',
        'pa': 'pa-IN',
        'or': 'or-IN',
        'as': 'as-IN',
        'ur': 'ur-IN',
        'ks': 'ks-IN',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'zh': 'zh-CN',
        'ja': 'ja-JP',
        'ko': 'ko-KR',
        'ar': 'ar-SA',
        'pt': 'pt-BR'
      };
      
      recognitionRef.current.lang = languageMap[selectedLanguage] || 'en-US';

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
      
      // Load voices when they become available
      const loadVoices = () => {
        const voices = synthesisRef.current?.getVoices() || [];
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      };
      
      // Voices may load asynchronously
      if (synthesisRef.current.getVoices().length > 0) {
        loadVoices();
      } else {
        synthesisRef.current.addEventListener('voiceschanged', loadVoices);
      }
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

  const detectLanguageFromText = (text: string): string => {
    // Enhanced language detection patterns for Indian languages
    const languagePatterns = {
      'hi': /[\u0900-\u097F]/, // Hindi (Devanagari)
      'bn': /[\u0980-\u09FF]/, // Bengali
      'ta': /[\u0B80-\u0BFF]/, // Tamil
      'te': /[\u0C00-\u0C7F]/, // Telugu
      'ml': /[\u0D00-\u0D7F]/, // Malayalam
      'kn': /[\u0C80-\u0CFF]/, // Kannada
      'gu': /[\u0A80-\u0AFF]/, // Gujarati
      'mr': /[\u0900-\u097F]/, // Marathi (Devanagari, same as Hindi)
      'pa': /[\u0A00-\u0A7F]/, // Punjabi (Gurmukhi)
      'or': /[\u0B00-\u0B7F]/, // Odia
      'as': /[\u0980-\u09FF]/, // Assamese (same as Bengali)
      'ur': /[\u0600-\u06FF]/, // Urdu (Arabic script)
      'ar': /[\u0600-\u06FF]/, // Arabic
      'zh': /[\u4e00-\u9fff]/, // Chinese
      'ja': /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/, // Japanese
      'ko': /[\uac00-\ud7af]/, // Korean
    };

    // Check for specific language patterns in the text
    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    // Fallback to selected language or English
    return selectedLanguage || 'en';
  };

  const speakResponse = (text: string) => {
    if (!synthesisRef.current || !voiceEnabled) return;

    // Cancel any ongoing speech
    synthesisRef.current.cancel();

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Detect the actual language of the AI response
      const detectedLanguage = detectLanguageFromText(text);
      
      // Set language for speech synthesis based on detected language
      const speechLanguageMap: { [key: string]: string } = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'bn': 'bn-IN',
        'ta': 'ta-IN',
        'te': 'te-IN',
        'ml': 'ml-IN',
        'kn': 'kn-IN',
        'gu': 'gu-IN',
        'mr': 'mr-IN',
        'pa': 'pa-IN',
        'or': 'or-IN',
        'as': 'as-IN',
        'ur': 'ur-IN',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'zh': 'zh-CN',
        'ja': 'ja-JP',
        'ko': 'ko-KR',
        'ar': 'ar-SA',
        'pt': 'pt-BR'
      };
      
      utterance.lang = speechLanguageMap[detectedLanguage] || 'en-US';
      
      // Get fresh voices list and find the best match
      const voices = synthesisRef.current!.getVoices();
      const languagePrefix = utterance.lang.split('-')[0];
      
      // Enhanced voice selection with broader matching
      let preferredVoice = voices.find(voice => voice.lang === utterance.lang);
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => voice.lang.startsWith(languagePrefix));
      }
      if (!preferredVoice && detectedLanguage !== 'en') {
        // Try to find any voice that contains the language name
        preferredVoice = voices.find(voice => 
          voice.name.toLowerCase().includes(detectedLanguage) ||
          voice.lang.toLowerCase().includes(detectedLanguage)
        );
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
    <div className="h-screen flex flex-col pb-16 sm:pb-20 max-w-4xl mx-auto">
      {/* Enhanced Multilingual Chat Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-border p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-medium text-foreground">MindEase Assistant</h3>
            <div className="flex items-center text-xs text-green-600">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse-gentle"></span>
              Multilingual Support Active
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Enhanced Language Selector with Grouping */}
          <Select value={selectedLanguage} onValueChange={(newLang) => {
            setSelectedLanguage(newLang);
            toast({
              title: `Language changed to ${supportedLanguages.find(l => l.code === newLang)?.name}`,
              description: "Voice recognition and AI responses will now use this language",
            });
          }}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-y-auto">
              {/* Global Languages */}
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Global</div>
              {supportedLanguages.filter(lang => lang.region === 'Global').map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center space-x-1">
                    <span>{lang.flag}</span>
                    <span className="hidden sm:inline">{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
              
              {/* Indian Languages by Region */}
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">North India</div>
              {supportedLanguages.filter(lang => lang.region === 'North India').map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center space-x-1">
                    <span>{lang.flag}</span>
                    <span className="hidden sm:inline">{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
              
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">East India</div>
              {supportedLanguages.filter(lang => lang.region === 'East India').map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center space-x-1">
                    <span>{lang.flag}</span>
                    <span className="hidden sm:inline">{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
              
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">West India</div>
              {supportedLanguages.filter(lang => lang.region === 'West India').map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center space-x-1">
                    <span>{lang.flag}</span>
                    <span className="hidden sm:inline">{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
              
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">South India</div>
              {supportedLanguages.filter(lang => lang.region === 'South India').map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center space-x-1">
                    <span>{lang.flag}</span>
                    <span className="hidden sm:inline">{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVoice}
            className="w-8 h-8 sm:w-10 sm:h-10 p-0"
            title={voiceEnabled ? "Disable voice" : "Enable voice"}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-muted/30 chat-scroll">
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
      <div className="bg-white dark:bg-gray-950 border-t border-border p-3 sm:p-4">
        {/* Voice Status Indicator */}
        {(isListening || isSpeaking) && (
          <div className="mb-2 sm:mb-3 text-center">
            <div className={`inline-flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm ${
              isListening ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {isListening ? (
                <>
                  <Mic className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                  <span>Speaking...</span>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
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

        {/* Multilingual Quick Responses */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {multilingualQuickResponses.map((responseObj, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 transition-colors flex-shrink-0"
              onClick={() => handleQuickResponse(responseObj[selectedLanguage as keyof typeof responseObj] || responseObj.en)}
            >
              {responseObj[selectedLanguage as keyof typeof responseObj] || responseObj.en}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
