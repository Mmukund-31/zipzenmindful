import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import session from "express-session";
import { storage } from "./storage";
import { insertMoodEntrySchema, insertMemorySchema, insertChatMessageSchema, insertGratitudeEntrySchema, users, moodEntries, memories, chatMessages, gratitudeEntries, challengeProgress } from "@shared/schema";
import { generateAIResponse, analyzeMoodFromText, generateMoodInsights, generateMemeText, analyzeImageForMemory, generateMemoryGalleryTitle, analyzeImageAndGenerateMeme } from "./lib/openai";
import { db } from "./db";
import { desc, eq, inArray } from "drizzle-orm";
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
    // Only create new session if no existing session and no user header provided
    if (!req.session.userId && !req.headers['x-user-id']) {
      // Create a consistent user ID that persists across sessions
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      req.session.userId = `user_${timestamp}_${randomId}`;
    }
    // Prefer user header over session for authenticated users
    req.userId = req.headers['x-user-id'] || req.session.userId;
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
      
      if (!userId || userId === 'undefined') {
        return res.status(400).json({ error: 'Valid user ID is required' });
      }
      
      // Update existing user with onboarding data, preserving their actual name
      const user = await storage.upsertUser({
        id: userId,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
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
        
        // Create minimal user profile - actual name will be set during onboarding
        user = await storage.upsertUser({
          id: userId,
          phoneNumber,
          firstName: 'New User',
          lastName: '',
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

  // Device-based login endpoint for persistent user identity
  app.post('/api/auth/device-login', async (req: any, res) => {
    try {
      const { deviceId } = req.body;
      
      if (!deviceId) {
        return res.status(400).json({ error: 'Device ID is required' });
      }
      
      // Look for existing user with this device fingerprint
      let existingUser = null;
      const allUsers = await db.select().from(users);
      
      // Check if any user has this device fingerprint in their email or ID
      existingUser = allUsers.find(user => 
        user.email?.includes(deviceId.split('_')[2]) || 
        user.id.includes(deviceId.split('_')[2])
      );
      
      if (existingUser) {
        // Return existing user
        req.session.userId = existingUser.id;
        res.json({ 
          success: true, 
          user: existingUser,
          sessionId: existingUser.id,
          message: `Welcome back! Your data has been restored.`
        });
      } else {
        // Create new user with device fingerprint
        const userId = deviceId;
        const user = await storage.upsertUser({
          id: userId,
          email: `${userId}@mindease.app`,
          firstName: 'New User',
          lastName: '',
          profileImageUrl: null
        });
        
        req.session.userId = userId;
        res.json({ 
          success: true, 
          user,
          sessionId: userId,
          message: `Welcome! Your personalized wellness journey begins now.`
        });
      }
    } catch (error) {
      console.error('Device login error:', error);
      res.status(500).json({ error: 'Failed to authenticate device' });
    }
  });

  // Personalized Quick Start endpoint for unique user experiences
  app.post('/api/auth/quick-start', async (req: any, res) => {
    try {
      const { deviceId } = req.body;
      
      // Create unique user ID based on device and timestamp
      const userId = `user_${deviceId}_${Date.now()}`;
      
      // Create minimal user profile - actual name will be set during onboarding
      const user = await storage.upsertUser({
        id: userId,
        email: `${userId}@mindease.app`,
        firstName: 'New User',
        lastName: '',
        profileImageUrl: null
      });
      
      // Create session for this personalized user
      req.session.userId = userId;
      
      res.json({ 
        success: true, 
        user,
        deviceId,
        message: `Welcome! Your personalized wellness journey begins now.`
      });
    } catch (error) {
      console.error('Quick start error:', error);
      res.status(500).json({ error: 'Failed to create personalized session' });
    }
  });

  // Initialize session for new users
  app.post('/api/auth/init', async (req: any, res) => {
    try {
      const { sessionId } = req.body;
      
      // Priority order: provided sessionId > existing session > create new
      let userId: string;
      
      if (sessionId && sessionId !== 'undefined') {
        // Use provided sessionId and update session
        userId = sessionId;
        req.session.userId = userId;
      } else if (req.session.userId && req.session.userId !== 'undefined') {
        // Use existing session
        userId = req.session.userId;
      } else {
        // Create new session only as last resort
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        userId = `user_${timestamp}_${randomId}`;
        req.session.userId = userId;
      }
      
      // Check if user exists in database
      let user = await storage.getUser(userId);
      if (!user && userId !== 'undefined') {
        // Create minimal user profile - actual name will be set during onboarding
        user = await storage.upsertUser({
          id: userId,
          email: `${userId}@mindease.app`,
          firstName: 'New User',
          lastName: '',
          profileImageUrl: null
        });
      } else if (!user) {
        // Handle undefined case by creating a new valid user
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        const newUserId = `user_${timestamp}_${randomId}`;
        req.session.userId = newUserId;
        
        user = await storage.upsertUser({
          id: newUserId,
          email: `${newUserId}@mindease.app`,
          firstName: 'New User',
          lastName: '',
          profileImageUrl: null
        });
        
        userId = newUserId;
      }
      
      res.json({ success: true, user, sessionId: userId });
    } catch (error) {
      console.error('Session init error:', error);
      res.status(500).json({ error: 'Failed to initialize session' });
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

  // AI-powered meme generator endpoint
  app.post("/api/meme/analyze-and-generate", upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }

      const { style = 'funny' } = req.body;
      
      // Analyze image and generate funny meme text using AI
      const memeData = await analyzeImageAndGenerateMeme(req.file.buffer, style);
      
      res.json(memeData);
    } catch (error) {
      console.error("Meme generation error:", error);
      res.status(500).json({ error: "Failed to generate meme. Please try again." });
    }
  });

  // Get all user data endpoint for comprehensive dashboard
  app.get("/api/user/dashboard", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      
      // Get all user data in real-time
      const [
        user,
        moodEntries,
        recentMood,
        memories,
        chatMessages,
        gratitudeEntries,
        activeChallenges,
        completedChallenges
      ] = await Promise.all([
        storage.getUser(userId),
        storage.getMoodEntriesByUser(userId),
        storage.getRecentMoodEntry(userId),
        storage.getMemoriesByUser(userId),
        storage.getChatMessagesByUser(userId),
        storage.getGratitudeEntriesByUser(userId),
        storage.getActiveChallengesByUser(userId),
        storage.getCompletedChallengesByUser(userId)
      ]);

      // Calculate statistics
      const stats = {
        totalMoods: moodEntries.length,
        totalMemories: memories.length,
        totalGratitude: gratitudeEntries.length,
        activeChallengesCount: activeChallenges.length,
        completedChallengesCount: completedChallenges.length,
        recentActivity: moodEntries.slice(0, 10), // Last 10 mood entries
        favoriteMemories: memories.filter(m => m.isFavorite)
      };

      res.json({
        user,
        moodEntries: moodEntries.slice(0, 100), // Latest 100 entries
        recentMood,
        memories: memories.slice(0, 50), // Latest 50 memories
        chatMessages: chatMessages.slice(-20), // Last 20 messages
        gratitudeEntries: gratitudeEntries.slice(0, 30), // Latest 30 entries
        activeChallenges,
        completedChallenges,
        stats
      });
    } catch (error) {
      console.error("Dashboard data error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
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
      
      // Get all user data for personalized insights
      const [moodEntries, memories, chatMessages, gratitudeEntries, userProfile] = await Promise.all([
        storage.getMoodEntriesByUser(userId),
        storage.getMemoriesByUser(userId),
        storage.getChatMessagesByUser(userId),
        storage.getGratitudeEntriesByUser(userId),
        storage.getUser(userId)
      ]);

      // Generate personalized insights based on user profile and activity
      const { generatePersonalizedInsights } = await import("./lib/openai");
      const personalizedInsights = await generatePersonalizedInsights({
        moodEntries,
        memories,
        chatMessages,
        gratitudeEntries,
        userProfile
      });
      
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

      // Group mood entries by day and get the most recent mood for each day
      const dailyMoods = new Map<string, any>();
      moodEntries.forEach((entry: any) => {
        const dateKey = new Date(entry.timestamp).toDateString();
        if (!dailyMoods.has(dateKey) || new Date(entry.timestamp) > new Date(dailyMoods.get(dateKey).timestamp)) {
          dailyMoods.set(dateKey, entry);
        }
      });

      const weeklyData = Array.from(dailyMoods.values())
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-7);

      res.json({
        insights: personalizedInsights,
        moodDistribution,
        totalEntries: moodEntries.length,
        dailyEntries: dailyMoods.size,
        weeklyData
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
  app.post("/api/wellness/daily-tip", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const [user, recentMoods] = await Promise.all([
        storage.getUser(userId),
        storage.getMoodEntriesByUser(userId)
      ]);

      const { generateDailyWellnessTip } = await import("./lib/openai");
      
      // Provide context for personalized tips
      const userContext = {
        wellnessGoals: user?.wellnessGoals || [],
        preferredTime: user?.preferredTime,
        recentMoods: recentMoods.slice(-3).map(m => ({ mood: m.mood, rating: m.rating }))
      };
      
      const tip = await generateDailyWellnessTip(userContext);
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
      const [user, completedChallenges, recentMoods] = await Promise.all([
        storage.getUser(userId),
        storage.getCompletedChallengesByUser(userId),
        storage.getMoodEntriesByUser(userId)
      ]);
      
      const completedIds = completedChallenges.map(c => c.challengeId);
      
      // Get standard challenges
      const standardChallenges = await storage.getAvailableChallenges(userId);
      
      // Generate AI-powered personalized challenges based on user profile and mood patterns
      let personalizedChallenges = [];
      if (user) {
        try {
          const { generatePersonalizedChallenges } = await import("./lib/openai");
          
          // Enhanced user profile with mood context for better personalization
          const enhancedProfile = {
            ...user,
            recentMoodPatterns: recentMoods.slice(-7).map(m => ({ mood: m.mood, rating: m.rating })),
            moodTrend: recentMoods.length > 0 ? 
              recentMoods.slice(-3).reduce((sum, m) => sum + m.rating, 0) / Math.min(3, recentMoods.length) : 3
          };
          
          personalizedChallenges = await generatePersonalizedChallenges(enhancedProfile, completedIds);
        } catch (error) {
          console.error("Error generating personalized challenges:", error);
        }
      }
      
      res.json([...standardChallenges, ...personalizedChallenges]);
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

  // Public admin dashboard with basic auth
  app.get("/admin", (req, res) => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MindEase Admin Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
        .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
        .data-section { margin-bottom: 30px; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; }
        .data-table th { background: #f8f9fa; font-weight: 600; }
        .refresh-btn { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        .refresh-btn:hover { background: #1d4ed8; }
        .truncate { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MindEase Admin Dashboard</h1>
            <p>Real-time database overview and user activity</p>
            <button class="refresh-btn" onclick="loadData()">Refresh Data</button>
        </div>
        <div id="content">Loading...</div>
    </div>

    <script>
        async function loadData() {
            try {
                const response = await fetch('/api/admin/database');
                const data = await response.json();
                
                document.getElementById('content').innerHTML = \`
                    <div class="stats">
                        <div class="stat-card">
                            <div class="stat-number">\${data.totalUsers}</div>
                            <div class="stat-label">Total Users</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">\${data.totalMoodEntries}</div>
                            <div class="stat-label">Mood Entries</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">\${data.totalMemories}</div>
                            <div class="stat-label">Memories</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">\${data.totalChatMessages}</div>
                            <div class="stat-label">Chat Messages</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">\${data.totalGratitudeEntries}</div>
                            <div class="stat-label">Gratitude Entries</div>
                        </div>
                    </div>

                    <div class="data-section">
                        <h3>All Users (\${data.users.length} total)</h3>
                        <div style="max-height: 400px; overflow-y: auto; border: 1px solid #eee; border-radius: 6px;">
                            <table class="data-table">
                                <thead style="position: sticky; top: 0; background: white; z-index: 1;">
                                    <tr>
                                        <th>User ID</th>
                                        <th>Email</th>
                                        <th>Name</th>
                                        <th>Created</th>
                                        <th>Last Updated</th>
                                        <th>Moods</th>
                                        <th>Memories</th>
                                        <th>Chats</th>
                                        <th>Gratitude</th>
                                        <th>Total Activity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    \${data.users.map(user => \`
                                        <tr>
                                            <td class="truncate" title="\${user.id}">\${user.id}</td>
                                            <td>\${user.email || 'N/A'}</td>
                                            <td>\${(user.firstName || '') + ' ' + (user.lastName || '')}</td>
                                            <td>\${new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td>\${new Date(user.updatedAt).toLocaleDateString()}</td>
                                            <td style="text-align: center;">\${user.moodEntries?.length || 0}</td>
                                            <td style="text-align: center;">\${user.memories?.length || 0}</td>
                                            <td style="text-align: center;">\${user.chatMessages?.length || 0}</td>
                                            <td style="text-align: center;">\${user.gratitudeEntries?.length || 0}</td>
                                            <td style="text-align: center; font-weight: bold;">\${(user.moodEntries?.length || 0) + (user.memories?.length || 0) + (user.chatMessages?.length || 0) + (user.gratitudeEntries?.length || 0)}</td>
                                        </tr>
                                    \`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="data-section">
                        <h3>All Recent Activity (Latest 50 entries)</h3>
                        <div style="max-height: 400px; overflow-y: auto; border: 1px solid #eee; border-radius: 6px;">
                            <table class="data-table">
                                <thead style="position: sticky; top: 0; background: white; z-index: 1;">
                                    <tr>
                                        <th>Type</th>
                                        <th>User ID</th>
                                        <th>Content</th>
                                        <th>Details</th>
                                        <th>Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    \${data.recentActivity.recentMoods?.slice(0, 20).map(mood => \`
                                        <tr>
                                            <td><span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">MOOD</span></td>
                                            <td class="truncate" title="\${mood.userId}">\${mood.userId}</td>
                                            <td>\${mood.mood}</td>
                                            <td>Rating: \${mood.rating}/5 | Notes: \${mood.notes || 'None'}</td>
                                            <td>\${new Date(mood.timestamp).toLocaleString()}</td>
                                        </tr>
                                    \`).join('') || ''}
                                    \${data.recentActivity.recentMemories?.slice(0, 15).map(memory => \`
                                        <tr>
                                            <td><span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">MEMORY</span></td>
                                            <td class="truncate" title="\${memory.userId}">\${memory.userId}</td>
                                            <td class="truncate">\${memory.title}</td>
                                            <td>Category: \${memory.category} | Favorite: \${memory.isFavorite ? 'Yes' : 'No'}</td>
                                            <td>\${new Date(memory.timestamp).toLocaleString()}</td>
                                        </tr>
                                    \`).join('') || ''}
                                    \${data.recentActivity.recentChat?.slice(0, 15).map(chat => \`
                                        <tr>
                                            <td><span style="background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">CHAT</span></td>
                                            <td class="truncate" title="\${chat.userId}">\${chat.userId}</td>
                                            <td class="truncate">\${chat.message}</td>
                                            <td>AI Response: \${chat.aiResponse ? 'Yes' : 'No'}</td>
                                            <td>\${new Date(chat.timestamp).toLocaleString()}</td>
                                        </tr>
                                    \`).join('') || ''}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="data-section">
                        <h3>User Engagement Analysis</h3>
                        <div class="stats">
                            <div class="stat-card">
                                <div class="stat-number">\${data.users.filter(u => (u.moodEntries?.length || 0) > 0).length}</div>
                                <div class="stat-label">Users with Mood Data</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">\${data.users.filter(u => (u.memories?.length || 0) > 0).length}</div>
                                <div class="stat-label">Users with Memories</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">\${data.users.filter(u => (u.chatMessages?.length || 0) > 0).length}</div>
                                <div class="stat-label">Users with Chats</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">\${data.users.filter(u => (u.gratitudeEntries?.length || 0) > 0).length}</div>
                                <div class="stat-label">Users with Gratitude</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">\${Math.round(data.users.reduce((sum, u) => sum + ((u.moodEntries?.length || 0) + (u.memories?.length || 0) + (u.chatMessages?.length || 0) + (u.gratitudeEntries?.length || 0)), 0) / data.users.length)}</div>
                                <div class="stat-label">Avg Activities per User</div>
                            </div>
                        </div>
                    </div>
                \`;
            } catch (error) {
                document.getElementById('content').innerHTML = '<p>Error loading data: ' + error.message + '</p>';
            }
        }
        
        // Load data on page load
        loadData();
        
        // Auto-refresh every 30 seconds
        setInterval(loadData, 30000);
    </script>
</body>
</html>`;
    
    res.send(htmlContent);
  });

  // Database admin endpoint for viewing all user data
  app.get("/api/admin/database", async (req: any, res) => {
    try {
      // Get all data from database
      const [
        allUsers,
        allMoodEntries,
        allMemories,
        allChatMessages,
        allGratitudeEntries
      ] = await Promise.all([
        db.select().from(users),
        db.select().from(moodEntries).orderBy(desc(moodEntries.timestamp)),
        db.select().from(memories).orderBy(desc(memories.timestamp)),
        db.select().from(chatMessages).orderBy(desc(chatMessages.timestamp)),
        db.select().from(gratitudeEntries).orderBy(desc(gratitudeEntries.timestamp))
      ]);

      // Helper function to identify real vs demo users
      const isRealUser = (user: any) => {
        // Real users are the session-based users (current system behavior)
        // Demo users are those with authentication credentials
        
        // Real users have session-based IDs or undefined IDs
        const hasSessionId = user.id === 'undefined' || (user.id && user.id.startsWith('user_'));
        
        // Real users typically don't have email/phone authentication in current system
        const hasNoAuth = !user.email && !user.phoneNumber;
        
        // Users with authentication are actually demo/test accounts
        const hasAuth = (user.email && user.email.includes('@')) || 
                       (user.phoneNumber && user.phoneNumber.length >= 10);
        
        // Real users: session-based without authentication OR with session ID
        // Demo users: those with email/phone authentication
        return hasSessionId || (hasNoAuth && !hasAuth);
      };

      // Separate real and demo users
      const realUsers = allUsers.filter(isRealUser);
      const demoUsers = allUsers.filter(user => !isRealUser(user));

      // Group data by user for easier viewing
      const userDataMap = new Map();
      
      allUsers.forEach(user => {
        userDataMap.set(user.id, {
          user: {
            ...user,
            isRealUser: isRealUser(user)
          },
          moodEntries: [],
          memories: [],
          chatMessages: [],
          gratitudeEntries: []
        });
      });

      // Add mood entries
      allMoodEntries.forEach(entry => {
        if (userDataMap.has(entry.userId)) {
          userDataMap.get(entry.userId).moodEntries.push(entry);
        }
      });

      // Add memories
      allMemories.forEach(memory => {
        if (userDataMap.has(memory.userId)) {
          userDataMap.get(memory.userId).memories.push(memory);
        }
      });

      // Add chat messages
      allChatMessages.forEach(message => {
        if (userDataMap.has(message.userId)) {
          userDataMap.get(message.userId).chatMessages.push(message);
        }
      });

      // Add gratitude entries
      allGratitudeEntries.forEach(entry => {
        if (userDataMap.has(entry.userId)) {
          userDataMap.get(entry.userId).gratitudeEntries.push(entry);
        }
      });

      const usersWithData = Array.from(userDataMap.values());

      // Get counts for real users only
      const realUserData = usersWithData.filter(userData => userData.user.isRealUser);
      const realUserMoodEntries = allMoodEntries.filter(entry => {
        const userData = userDataMap.get(entry.userId);
        return userData && userData.user.isRealUser;
      });
      const realUserMemories = allMemories.filter(memory => {
        const userData = userDataMap.get(memory.userId);
        return userData && userData.user.isRealUser;
      });
      const realUserChatMessages = allChatMessages.filter(message => {
        const userData = userDataMap.get(message.userId);
        return userData && userData.user.isRealUser;
      });
      const realUserGratitudeEntries = allGratitudeEntries.filter(entry => {
        const userData = userDataMap.get(entry.userId);
        return userData && userData.user.isRealUser;
      });

      res.json({
        // Real user counts
        totalUsers: realUsers.length,
        totalMoodEntries: realUserMoodEntries.length,
        totalMemories: realUserMemories.length,
        totalChatMessages: realUserChatMessages.length,
        totalGratitudeEntries: realUserGratitudeEntries.length,
        
        // Demo user counts (for comparison)
        demoStats: {
          totalDemoUsers: demoUsers.length,
          totalDemoMoodEntries: allMoodEntries.length - realUserMoodEntries.length,
          totalDemoMemories: allMemories.length - realUserMemories.length,
          totalDemoChatMessages: allChatMessages.length - realUserChatMessages.length,
          totalDemoGratitudeEntries: allGratitudeEntries.length - realUserGratitudeEntries.length
        },
        
        users: usersWithData,
        recentActivity: {
          recentMoods: allMoodEntries.slice(0, 20),
          recentMemories: allMemories.slice(0, 10),
          recentChat: allChatMessages.slice(0, 10)
        }
      });
    } catch (error) {
      console.error("Database admin error:", error);
      res.status(500).json({ error: "Failed to fetch database data" });
    }
  });

  // Database cleanup endpoint - remove last N users
  app.delete("/api/admin/cleanup-users/:count", async (req: any, res) => {
    try {
      const count = parseInt(req.params.count);
      
      if (!count || count <= 0 || count > 50) {
        return res.status(400).json({ error: "Count must be between 1 and 50" });
      }

      // Get the last N users ordered by creation date
      const usersToDelete = await db
        .select({ id: users.id })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(count);

      if (usersToDelete.length === 0) {
        return res.json({ message: "No users found to delete", deletedCount: 0 });
      }

      const userIds = usersToDelete.map(user => user.id);

      // Delete related data first (foreign key constraints)
      await Promise.all([
        db.delete(moodEntries).where(inArray(moodEntries.userId, userIds)),
        db.delete(memories).where(inArray(memories.userId, userIds)),
        db.delete(chatMessages).where(inArray(chatMessages.userId, userIds)),
        db.delete(gratitudeEntries).where(inArray(gratitudeEntries.userId, userIds)),
        db.delete(challengeProgress).where(inArray(challengeProgress.userId, userIds))
      ]);

      // Delete the users
      await db.delete(users).where(inArray(users.id, userIds));

      res.json({ 
        message: `Successfully deleted ${userIds.length} users and their associated data`,
        deletedCount: userIds.length,
        deletedUserIds: userIds
      });
    } catch (error) {
      console.error("Database cleanup error:", error);
      res.status(500).json({ error: "Failed to cleanup database" });
    }
  });

  // AI-powered thought interruption techniques
  app.get("/api/wellness/thought-interruption", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const user = await storage.getUser(userId);
      const recentMoods = await storage.getMoodEntriesByUser(userId);
      
      const { generatePersonalizedThoughtInterruption } = await import("./lib/openai");
      const techniques = await generatePersonalizedThoughtInterruption(user, recentMoods.slice(-5));
      res.json({ techniques });
    } catch (error) {
      console.error("Thought interruption techniques error:", error);
      res.status(500).json({ error: "Failed to generate techniques" });
    }
  });

  // AI-powered personalized insights
  app.get("/api/insights/personalized", requireAuth, async (req: any, res) => {
    try {
      const userId = getCurrentUserId(req);
      const user = await storage.getUser(userId);
      const moodEntries = await storage.getMoodEntriesByUser(userId);
      const memories = await storage.getMemoriesByUser(userId);
      const chatMessages = await storage.getChatMessagesByUser(userId);
      const gratitudeEntries = await storage.getGratitudeEntriesByUser(userId);

      const { generatePersonalizedInsights } = await import("./lib/openai");
      const insights = await generatePersonalizedInsights({
        moodEntries,
        memories,
        chatMessages,
        gratitudeEntries,
        userProfile: user
      });
      
      res.json({ insights });
    } catch (error) {
      console.error("Personalized insights error:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
