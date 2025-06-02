import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import session from "express-session";
import { storage } from "./storage";
import { insertMoodEntrySchema, insertMemorySchema, insertChatMessageSchema, insertGratitudeEntrySchema } from "@shared/schema";
import { generateAIResponse, analyzeMoodFromText, generateMoodInsights, generateMemeText, analyzeImageForMemory, generateMemoryGalleryTitle } from "./lib/openai";
// Authentication middleware
const getCurrentUserId = (req: any): string => {
  // Get user ID from session or JWT token
  const userId = req.session?.userId || req.headers['x-user-id'];
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
};

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

// Store OTP codes temporarily (in production, use Redis or database)
const otpStore = new Map<string, { code: string; expires: number; userId?: string }>();

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'mindease-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    // Create a demo user session if none exists
    const userId = req.session?.userId || 'demo_user_' + Math.random().toString(36).substr(2, 9);
    req.session.userId = userId;
    req.userId = userId;
    next();
  };

  const getCurrentUserId = (req: any): string => {
    return req.userId || req.session?.userId;
  };

  // Onboarding data endpoint
  app.post('/api/onboarding/complete', async (req: any, res) => {
    try {
      const { name, age, wellnessGoals, preferredTime, motivation } = req.body;
      const userId = req.headers['x-user-id'] || getCurrentUserId(req);
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      // Create or update user with onboarding data
      const user = await storage.upsertUser({
        id: userId,
        name,
        age,
        wellnessGoals: JSON.stringify(wellnessGoals),
        preferredTime,
        motivation
      });
      
      res.json({ success: true, user });
    } catch (error) {
      console.error('Onboarding completion error:', error);
      res.status(500).json({ error: 'Failed to save onboarding data' });
    }
  });

  // Firebase authentication sync endpoint
  app.post('/api/auth/sync', async (req: any, res) => {
    try {
      const { uid, email, firstName, lastName, profileImageUrl, phoneNumber } = req.body;
      
      if (!uid) {
        return res.status(400).json({ error: 'Firebase UID is required' });
      }
      
      // Create or update user in our database
      const user = await storage.upsertUser({
        id: uid,
        email,
        firstName,
        lastName,
        profileImageUrl,
        phoneNumber
      });
      
      // Set session
      req.session.userId = uid;
      
      res.json({ success: true, user });
    } catch (error) {
      console.error('Firebase sync error:', error);
      res.status(500).json({ error: 'Failed to sync user data' });
    }
  });

  // Legacy authentication routes (keeping for backward compatibility)
  app.post('/api/auth/email-login', async (req: any, res) => {
    try {
      const { email, password, isSignUp } = req.body;
      
      if (isSignUp) {
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          // User already exists, just log them in
          req.session.userId = existingUser.id;
          res.json({ 
            success: true, 
            user: existingUser,
            message: `Welcome back ${existingUser.firstName}!`
          });
          return;
        }
        
        // Create new personalized user
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Generate personalized user details
        const userNames = [
          { first: 'Alex', last: 'Johnson' },
          { first: 'Sam', last: 'Chen' },
          { first: 'Jordan', last: 'Smith' },
          { first: 'Casey', last: 'Davis' },
          { first: 'Taylor', last: 'Wilson' },
          { first: 'Morgan', last: 'Brown' },
          { first: 'Riley', last: 'Garcia' },
          { first: 'Avery', last: 'Miller' }
        ];
        
        const randomName = userNames[Math.floor(Math.random() * userNames.length)];
        
        const user = await storage.upsertUser({
          id: userId,
          email,
          firstName: randomName.first,
          lastName: randomName.last,
          profileImageUrl: null
        });
        req.session.userId = userId;
        res.json({ 
          success: true, 
          user,
          message: `Welcome ${randomName.first}! Your wellness journey begins now.`
        });
      } else {
        // Find existing user by email
        const existingUser = await storage.getUserByEmail(email);
        if (!existingUser) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.userId = existingUser.id;
        res.json({ success: true, user: existingUser });
      }
    } catch (error) {
      console.error('Email auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  app.post('/api/auth/phone-send-otp', async (req: any, res) => {
    try {
      const { phoneNumber } = req.body;
      const otp = generateOTP();
      const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
      
      otpStore.set(phoneNumber, { code: otp, expires });
      
      // In production, send actual SMS here
      console.log(`OTP for ${phoneNumber}: ${otp}`);
      
      res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
      console.error('OTP send error:', error);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  });

  app.post('/api/auth/phone-verify-otp', async (req: any, res) => {
    try {
      const { phoneNumber, otp } = req.body;
      const stored = otpStore.get(phoneNumber);
      
      if (!stored || stored.expires < Date.now()) {
        return res.status(401).json({ error: 'OTP expired or invalid' });
      }
      
      if (stored.code !== otp) {
        return res.status(401).json({ error: 'Invalid OTP' });
      }
      
      // Create or find user
      let user = await storage.getUserByPhone(phoneNumber);
      if (!user) {
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Generate personalized user details
        const userNames = [
          { first: 'Alex', last: 'Johnson' },
          { first: 'Sam', last: 'Chen' },
          { first: 'Jordan', last: 'Smith' },
          { first: 'Casey', last: 'Davis' },
          { first: 'Taylor', last: 'Wilson' },
          { first: 'Morgan', last: 'Brown' },
          { first: 'Riley', last: 'Garcia' },
          { first: 'Avery', last: 'Miller' }
        ];
        
        const randomName = userNames[Math.floor(Math.random() * userNames.length)];
        
        user = await storage.upsertUser({
          id: userId,
          phoneNumber,
          firstName: randomName.first,
          lastName: randomName.last,
          profileImageUrl: null
        });
      }
      
      req.session.userId = user.id;
      otpStore.delete(phoneNumber);
      
      res.json({ success: true, user });
    } catch (error) {
      console.error('OTP verify error:', error);
      res.status(500).json({ error: 'OTP verification failed' });
    }
  });

  app.post('/api/auth/google-login', async (req: any, res) => {
    try {
      const { googleToken, profile } = req.body;
      
      // In production, verify the Google token here
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const user = await storage.upsertUser({
        id: userId,
        email: profile.email,
        firstName: profile.given_name,
        lastName: profile.family_name,
        profileImageUrl: profile.picture,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      req.session.userId = userId;
      res.json({ success: true, user });
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({ error: 'Google authentication failed' });
    }
  });

  app.post('/api/auth/logout', async (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  // Personalized Quick Start endpoint for unique user experiences
  app.post('/api/auth/quick-start', async (req: any, res) => {
    try {
      const { deviceId } = req.body;
      
      // Create unique user ID based on device and timestamp
      const userId = `user_${deviceId}_${Date.now()}`;
      
      // Generate personalized user details
      const userNames = [
        { first: 'Alex', last: 'Johnson' },
        { first: 'Sam', last: 'Chen' },
        { first: 'Jordan', last: 'Smith' },
        { first: 'Casey', last: 'Davis' },
        { first: 'Taylor', last: 'Wilson' },
        { first: 'Morgan', last: 'Brown' },
        { first: 'Riley', last: 'Garcia' },
        { first: 'Avery', last: 'Miller' }
      ];
      
      const randomName = userNames[Math.floor(Math.random() * userNames.length)];
      
      // Create personalized user in database
      const user = await storage.upsertUser({
        id: userId,
        email: `${userId}@mindease.app`,
        firstName: randomName.first,
        lastName: randomName.last,
        profileImageUrl: null
      });
      
      // Create session for this personalized user
      req.session.userId = userId;
      
      res.json({ 
        success: true, 
        user,
        deviceId,
        message: `Welcome ${randomName.first}! Your personalized wellness journey begins now.`
      });
    } catch (error) {
      console.error('Quick start error:', error);
      res.status(500).json({ error: 'Failed to create personalized session' });
    }
  });

  // Check authentication status
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check if user has valid session
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = getCurrentUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Mood tracking endpoints
  app.post("/api/mood", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const moodData = insertMoodEntrySchema.parse({ ...req.body, userId });
      const moodEntry = await storage.createMoodEntry(moodData);
      res.json(moodEntry);
    } catch (error) {
      res.status(400).json({ error: "Invalid mood data" });
    }
  });

  app.get("/api/mood", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const entries = await storage.getMoodEntriesByUser(userId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mood entries" });
    }
  });

  app.get("/api/mood/recent", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const entry = await storage.getRecentMoodEntry(userId);
      res.json(entry || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent mood" });
    }
  });

  // Chat endpoints
  app.post("/api/chat", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
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
      
      // Generate AI response
      const aiResponse = await generateAIResponse(message, currentMood?.mood);
      
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

  app.get("/api/chat", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const messages = await storage.getChatMessagesByUser(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  // Memory endpoints
  app.post("/api/memories", requireAuth, upload.single('image'), async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
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

  app.get("/api/memories", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
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

  app.post("/api/memories/analyze-image", async (req: any, res) => {
    try {
      const { base64Image } = req.body;
      
      if (!base64Image) {
        return res.status(400).json({ error: "Base64 image is required" });
      }

      const analysis = await analyzeImageForMemory(base64Image);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  app.post("/api/memories/gallery-title", async (req: any, res) => {
    try {
      const { memories } = req.body;
      
      if (!memories || !Array.isArray(memories)) {
        return res.status(400).json({ error: "Memories array is required" });
      }

      const title = await generateMemoryGalleryTitle(memories);
      res.json({ title });
    } catch (error) {
      console.error("Error generating gallery title:", error);
      res.status(500).json({ error: "Failed to generate gallery title" });
    }
  });

  // Insights endpoint
  app.get("/api/insights", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
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
      const { generateDailyWellnessTip } = await import("./lib/openai");
      const tip = await generateDailyWellnessTip();
      res.json({ tip });
    } catch (error) {
      console.error("Daily tip generation error:", error);
      res.status(500).json({ error: "Failed to generate daily tip" });
    }
  });

  // Gratitude entries routes
  app.post("/api/gratitude", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
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

  app.get("/api/gratitude", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const gratitudeEntries = await storage.getGratitudeEntriesByUser(userId);
      res.json(gratitudeEntries);
    } catch (error) {
      console.error("Gratitude entries fetch error:", error);
      res.status(500).json({ error: "Failed to fetch gratitude entries" });
    }
  });

  app.get("/api/gratitude/insights", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
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
  app.get("/api/challenges/active", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const activeChallenges = await storage.getActiveChallengesByUser(userId);
      res.json(activeChallenges);
    } catch (error) {
      console.error("Active challenges fetch error:", error);
      res.status(500).json({ error: "Failed to fetch active challenges" });
    }
  });

  app.get("/api/challenges/available", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const availableChallenges = await storage.getAvailableChallenges(userId);
      res.json(availableChallenges);
    } catch (error) {
      console.error("Available challenges fetch error:", error);
      res.status(500).json({ error: "Failed to fetch available challenges" });
    }
  });

  app.get("/api/challenges/completed", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const completedChallenges = await storage.getCompletedChallengesByUser(userId);
      res.json(completedChallenges);
    } catch (error) {
      console.error("Completed challenges fetch error:", error);
      res.status(500).json({ error: "Failed to fetch completed challenges" });
    }
  });

  app.post("/api/challenges/join", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
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

  app.post("/api/challenges/progress", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
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
