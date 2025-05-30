import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { insertMoodEntrySchema, insertMemorySchema, insertChatMessageSchema, insertGratitudeEntrySchema } from "@shared/schema";
import { generateAIResponse, analyzeMoodFromText, generateMoodInsights, generateMemeText } from "./lib/openai";

// Local wellness response function
function generateLocalWellnessResponse(message: string, mood?: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Mood-based responses
  if (mood) {
    switch (mood.toLowerCase()) {
      case 'anxious':
      case 'stressed':
        if (lowerMessage.includes('help') || lowerMessage.includes('anxious')) {
          return "I understand you're feeling anxious. Try taking three deep breaths with me: breathe in for 4 counts, hold for 4, and breathe out for 4. Remember, this feeling is temporary and you have the strength to get through this.";
        }
        break;
      case 'sad':
      case 'lonely':
        if (lowerMessage.includes('sad') || lowerMessage.includes('lonely')) {
          return "I hear that you're going through a difficult time. It's okay to feel sad - your emotions are valid. Consider reaching out to someone you trust, or try doing one small thing that usually brings you comfort.";
        }
        break;
      case 'excited':
      case 'happy':
        return "I love hearing the positive energy in your message! This is a wonderful moment to appreciate. What's bringing you the most joy right now?";
    }
  }
  
  // Keyword-based responses
  if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
    return "Anxiety can feel overwhelming, but you're not alone. Try the 5-4-3-2-1 grounding technique: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.";
  }
  
  if (lowerMessage.includes('sad') || lowerMessage.includes('depressed')) {
    return "I'm sorry you're feeling this way. Your feelings are important and valid. Small steps can make a big difference - maybe try going for a short walk, listening to music you enjoy, or calling someone who cares about you.";
  }
  
  if (lowerMessage.includes('motivation') || lowerMessage.includes('motivated')) {
    return "You're already taking a positive step by reaching out! Remember that progress isn't always linear. Set one small, achievable goal for today and celebrate when you complete it.";
  }
  
  if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed')) {
    return "When feeling overwhelmed, try breaking things down into smaller, manageable pieces. Focus on just the next step you need to take, not the entire mountain you're climbing.";
  }
  
  if (lowerMessage.includes('sleep') || lowerMessage.includes('tired')) {
    return "Good sleep is crucial for mental wellness. Try creating a calming bedtime routine: dim the lights, put devices away, and consider some gentle stretching or meditation before bed.";
  }
  
  if (lowerMessage.includes('grateful') || lowerMessage.includes('thankful')) {
    return "Gratitude is such a powerful practice! It's wonderful that you're focusing on the positive aspects of your life. This mindset can really help improve overall well-being.";
  }
  
  if (lowerMessage.includes('joke') || lowerMessage.includes('funny')) {
    return "Here's a gentle smile for you: Why don't scientists trust atoms? Because they make up everything! Laughter really can be good medicine for the soul.";
  }
  
  if (lowerMessage.includes('relax') || lowerMessage.includes('calm')) {
    return "Let's find some calm together. Try this: sit comfortably, close your eyes, and imagine a peaceful place where you feel safe and relaxed. Take slow, deep breaths and stay in that peaceful space for a few moments.";
  }
  
  // Default supportive responses
  const defaultResponses = [
    "I'm here to support you on your wellness journey. How are you feeling right now?",
    "Thank you for sharing with me. Your mental wellness matters, and taking time to check in with yourself is important.",
    "I'm listening. Sometimes just expressing what's on your mind can be helpful. What would you like to talk about?",
    "Every step you take toward better mental health is meaningful. How can I support you today?",
    "It's great that you're being mindful of your mental wellness. What's been on your mind lately?"
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Local wellness tip generator
function generateLocalWellnessTip(): string {
  const tips = [
    "Start your day with three deep breaths. This simple practice can help center your mind and reduce anxiety.",
    "Practice the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.",
    "Take a 5-minute walk, even if it's just around your home. Movement can significantly boost your mood and energy.",
    "Write down three things you're grateful for today. Gratitude practice has been shown to improve mental well-being.",
    "Set a gentle boundary today. It's okay to say no to things that drain your energy.",
    "Connect with someone you care about, even if it's just a quick text message. Social connection is vital for mental health.",
    "Practice progressive muscle relaxation: tense and then relax each muscle group from your toes to your head.",
    "Spend a few minutes in nature, whether it's looking out a window or stepping outside. Nature has calming effects.",
    "Try the 4-7-8 breathing technique: breathe in for 4, hold for 7, exhale for 8. This can help reduce stress.",
    "Practice self-compassion today. Speak to yourself with the same kindness you'd show a good friend.",
    "Create a small ritual that brings you joy, like making your favorite tea or listening to a meaningful song.",
    "Remember that it's okay to have difficult emotions. They're temporary and part of the human experience.",
    "Take breaks from screens and social media. Give your mind time to rest and process.",
    "Focus on one task at a time rather than multitasking. This can reduce overwhelm and improve focus.",
    "Practice mindful eating with one meal today. Pay attention to the flavors, textures, and experience.",
    "Set a realistic goal for today and celebrate when you achieve it, no matter how small.",
    "Try gentle stretching or yoga. Physical movement can help release emotional tension.",
    "Create a calming bedtime routine to improve sleep quality. Good sleep is crucial for mental health.",
    "Practice saying 'I am enough' to yourself. Self-acceptance is a foundation of mental wellness.",
    "Remember that seeking help is a sign of strength, not weakness. You don't have to face challenges alone."
  ];
  
  return tips[Math.floor(Math.random() * tips.length)];
}
// Removed complex auth - using simple demo auth instead

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple demo auth - use fixed user ID for now
  const getCurrentUserId = () => "demo_user_1";

  // Auth routes  
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      let user = await storage.getUser(userId);
      
      // Create demo user if doesn't exist
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email: "demo@mindease.app",
          firstName: "Demo",
          lastName: "User",
          profileImageUrl: null
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Mood tracking endpoints
  app.post("/api/mood", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const moodData = insertMoodEntrySchema.parse({ ...req.body, userId });
      const moodEntry = await storage.createMoodEntry(moodData);
      res.json(moodEntry);
    } catch (error) {
      res.status(400).json({ error: "Invalid mood data" });
    }
  });

  app.get("/api/mood", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const entries = await storage.getMoodEntriesByUser(userId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mood entries" });
    }
  });

  app.get("/api/mood/recent", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const entry = await storage.getRecentMoodEntry(userId);
      res.json(entry || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent mood" });
    }
  });

  // Chat endpoints
  app.post("/api/chat", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      // Save user message
      await storage.createChatMessage({
        userId,
        message,
        isFromUser: true
      });

      // Get current mood for context
      const currentMood = await storage.getRecentMoodEntry(userId);
      
      // Generate local wellness response
      const aiResponse = generateLocalWellnessResponse(message, currentMood?.mood);
      
      // Save AI response
      const aiMessage = await storage.createChatMessage({
        userId,
        message: aiResponse,
        isFromUser: false
      });

      res.json({ response: aiResponse, messageId: aiMessage.id });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  app.get("/api/chat", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const messages = await storage.getChatMessagesByUser(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  // Memory endpoints
  app.post("/api/memories", upload.single('image'), async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      const { title, description, category } = req.body;
      
      // Convert image to base64 for storage (in a real app, you'd upload to cloud storage)
      const imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      const memoryData = insertMemorySchema.parse({
        userId,
        title: title || 'Untitled Memory',
        description: description || '',
        imageUrl,
        category: category || 'other',
        isFavorite: false
      });

      const memory = await storage.createMemory(memoryData);
      res.json(memory);
    } catch (error) {
      console.error("Memory creation error:", error);
      res.status(500).json({ error: "Failed to create memory" });
    }
  });

  app.get("/api/memories", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const { category } = req.query;
      let memories;
      
      if (category && typeof category === 'string') {
        memories = await storage.getMemoriesByCategory(userId, category);
      } else {
        memories = await storage.getMemoriesByUser(userId);
      }
      
      res.json(memories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memories" });
    }
  });

  app.patch("/api/memories/:id/favorite", async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isFavorite } = req.body;
      
      const memory = await storage.updateMemoryFavorite(parseInt(id), isFavorite);
      if (!memory) {
        return res.status(404).json({ error: "Memory not found" });
      }
      
      res.json(memory);
    } catch (error) {
      res.status(500).json({ error: "Failed to update memory" });
    }
  });

  // Insights endpoint
  app.get("/api/insights", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const moodEntries = await storage.getMoodEntriesByUser(userId);
      const insights = await generateMoodInsights(moodEntries);
      
      // Calculate mood distribution
      const moodCounts = moodEntries.reduce((acc: Record<string, number>, entry: any) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = moodEntries.length || 1;
      const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({
        mood,
        percentage: Math.round((count as number / total) * 100)
      }));

      res.json({
        insights,
        moodDistribution,
        totalEntries: moodEntries.length,
        weeklyData: moodEntries.slice(0, 7).reverse()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  // Analyze mood from text
  app.post("/api/mood/analyze", async (req: any, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required" });
      }

      const analysis = await analyzeMoodFromText(text);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze mood" });
    }
  });

  // Generate meme text
  app.post("/api/meme/generate-text", async (req: any, res) => {
    try {
      const { memoryTitle, memoryCategory, style } = req.body;
      
      const memeText = await generateMemeText(memoryTitle, memoryCategory, style);
      res.json(memeText);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate meme text" });
    }
  });

  // Generate daily wellness tip
  app.post("/api/wellness/daily-tip", async (req: any, res) => {
    try {
      const tip = generateLocalWellnessTip();
      res.json({ tip });
    } catch (error) {
      console.error("Daily tip generation error:", error);
      res.status(500).json({ error: "Failed to generate daily tip" });
    }
  });

  // Gratitude entries routes
  app.post("/api/gratitude", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const { content, date } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Content is required" });
      }

      const gratitudeData = insertGratitudeEntrySchema.parse({
        userId,
        content: content.trim(),
        date: date ? new Date(date) : new Date()
      });

      const gratitudeEntry = await storage.createGratitudeEntry(gratitudeData);
      res.json(gratitudeEntry);
    } catch (error) {
      console.error("Gratitude entry creation error:", error);
      res.status(500).json({ error: "Failed to create gratitude entry" });
    }
  });

  app.get("/api/gratitude", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const gratitudeEntries = await storage.getGratitudeEntriesByUser(userId);
      res.json(gratitudeEntries);
    } catch (error) {
      console.error("Gratitude entries fetch error:", error);
      res.status(500).json({ error: "Failed to fetch gratitude entries" });
    }
  });

  app.get("/api/gratitude/insights", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const gratitudeEntries = await storage.getGratitudeEntriesByUser(userId);
      
      if (gratitudeEntries.length === 0) {
        return res.json({ patterns: [] });
      }

      // Simple insights without AI for now
      const insights = {
        patterns: [
          `You've recorded ${gratitudeEntries.length} gratitude entries`,
          "Keep tracking your gratitude to discover patterns in what brings you joy"
        ]
      };
      
      res.json(insights);
    } catch (error) {
      console.error("Gratitude insights error:", error);
      res.status(500).json({ error: "Failed to generate gratitude insights" });
    }
  });

  // Challenges routes
  app.get("/api/challenges/active", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const activeChallenges = await storage.getActiveChallengesByUser(userId);
      res.json(activeChallenges);
    } catch (error) {
      console.error("Active challenges fetch error:", error);
      res.status(500).json({ error: "Failed to fetch active challenges" });
    }
  });

  app.get("/api/challenges/available", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const availableChallenges = await storage.getAvailableChallenges(userId);
      res.json(availableChallenges);
    } catch (error) {
      console.error("Available challenges fetch error:", error);
      res.status(500).json({ error: "Failed to fetch available challenges" });
    }
  });

  app.get("/api/challenges/completed", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const completedChallenges = await storage.getCompletedChallengesByUser(userId);
      res.json(completedChallenges);
    } catch (error) {
      console.error("Completed challenges fetch error:", error);
      res.status(500).json({ error: "Failed to fetch completed challenges" });
    }
  });

  app.post("/api/challenges/join", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const { challengeId } = req.body;
      
      if (!challengeId) {
        return res.status(400).json({ error: "Challenge ID is required" });
      }

      const challenge = await storage.joinChallenge(userId, challengeId);
      res.json(challenge);
    } catch (error) {
      console.error("Challenge join error:", error);
      res.status(500).json({ error: "Failed to join challenge" });
    }
  });

  app.post("/api/challenges/progress", async (req: any, res) => {
    try {
      const userId = getCurrentUserId();
      const { challengeId, completed, date } = req.body;
      
      if (!challengeId || typeof completed !== 'boolean') {
        return res.status(400).json({ error: "Challenge ID and completed status are required" });
      }

      const progress = await storage.updateChallengeProgress(userId, challengeId, completed, date);
      res.json(progress);
    } catch (error) {
      console.error("Challenge progress error:", error);
      res.status(500).json({ error: "Failed to update challenge progress" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
