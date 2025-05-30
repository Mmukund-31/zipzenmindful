import {
  type User,
  type UpsertUser,
  type MoodEntry,
  type InsertMoodEntry,
  type Memory,
  type InsertMemory,
  type ChatMessage,
  type InsertChatMessage,
  type GratitudeEntry,
  type InsertGratitudeEntry,
  type Challenge,
  type ChallengeProgress
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations (simplified for demo)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  createMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry>;
  getMoodEntriesByUser(userId: string): Promise<MoodEntry[]>;
  getRecentMoodEntry(userId: string): Promise<MoodEntry | undefined>;
  
  createMemory(memory: InsertMemory): Promise<Memory>;
  getMemoriesByUser(userId: string): Promise<Memory[]>;
  getMemoriesByCategory(userId: string, category: string): Promise<Memory[]>;
  updateMemoryFavorite(id: number, isFavorite: boolean): Promise<Memory | undefined>;
  
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByUser(userId: string): Promise<ChatMessage[]>;
  
  createGratitudeEntry(entry: InsertGratitudeEntry): Promise<GratitudeEntry>;
  getGratitudeEntriesByUser(userId: string): Promise<GratitudeEntry[]>;
  
  getActiveChallengesByUser(userId: string): Promise<Challenge[]>;
  getAvailableChallenges(userId: string): Promise<Challenge[]>;
  getCompletedChallengesByUser(userId: string): Promise<Challenge[]>;
  joinChallenge(userId: string, challengeId: string): Promise<ChallengeProgress>;
  updateChallengeProgress(userId: string, challengeId: string, completed: boolean, date?: string): Promise<ChallengeProgress>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private moodEntries: MoodEntry[] = [];
  private memories: Memory[] = [];
  private chatMessages: ChatMessage[] = [];
  private gratitudeEntries: GratitudeEntry[] = [];
  private challengeProgress: ChallengeProgress[] = [];
  private nextId = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    const user: User = {
      ...userData,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  async createMoodEntry(insertMoodEntry: InsertMoodEntry): Promise<MoodEntry> {
    const moodEntry: MoodEntry = {
      id: this.nextId++,
      ...insertMoodEntry,
      createdAt: new Date(),
    };
    this.moodEntries.push(moodEntry);
    return moodEntry;
  }

  async getMoodEntriesByUser(userId: string): Promise<MoodEntry[]> {
    return this.moodEntries
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentMoodEntry(userId: string): Promise<MoodEntry | undefined> {
    const entries = await this.getMoodEntriesByUser(userId);
    return entries[0];
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    const memory: Memory = {
      id: this.nextId++,
      ...insertMemory,
      isFavorite: false,
      createdAt: new Date(),
    };
    this.memories.push(memory);
    return memory;
  }

  async getMemoriesByUser(userId: string): Promise<Memory[]> {
    return this.memories
      .filter(memory => memory.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getMemoriesByCategory(userId: string, category: string): Promise<Memory[]> {
    return this.memories
      .filter(memory => memory.userId === userId && memory.category === category)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateMemoryFavorite(id: number, isFavorite: boolean): Promise<Memory | undefined> {
    const memory = this.memories.find(m => m.id === id);
    if (memory) {
      memory.isFavorite = isFavorite;
    }
    return memory;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: this.nextId++,
      ...insertMessage,
      createdAt: new Date(),
    };
    this.chatMessages.push(message);
    return message;
  }

  async getChatMessagesByUser(userId: string): Promise<ChatMessage[]> {
    return this.chatMessages
      .filter(message => message.userId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createGratitudeEntry(insertEntry: InsertGratitudeEntry): Promise<GratitudeEntry> {
    const entry: GratitudeEntry = {
      id: this.nextId++,
      ...insertEntry,
      createdAt: new Date(),
    };
    this.gratitudeEntries.push(entry);
    return entry;
  }

  async getGratitudeEntriesByUser(userId: string): Promise<GratitudeEntry[]> {
    return this.gratitudeEntries
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getActiveChallengesByUser(userId: string): Promise<any[]> {
    const userProgress = this.challengeProgress.filter(p => p.userId === userId && !p.completed);
    return userProgress.map(progress => ({
      ...this.getPredefinedChallengeInfo(progress.challengeId),
      progress: progress.progress,
      streak: progress.streak,
      startDate: progress.startDate,
    }));
  }

  async getAvailableChallenges(userId: string): Promise<any[]> {
    const userChallengeIds = new Set(this.challengeProgress
      .filter(p => p.userId === userId)
      .map(p => p.challengeId));
    
    return this.getAllPredefinedChallenges()
      .filter(challenge => !userChallengeIds.has(challenge.id));
  }

  async getCompletedChallengesByUser(userId: string): Promise<any[]> {
    const userProgress = this.challengeProgress.filter(p => p.userId === userId && p.completed);
    return userProgress.map(progress => ({
      ...this.getPredefinedChallengeInfo(progress.challengeId),
      completedAt: progress.updatedAt,
      streak: progress.streak,
    }));
  }

  async joinChallenge(userId: string, challengeId: string): Promise<ChallengeProgress> {
    const progress: ChallengeProgress = {
      id: this.nextId++,
      userId,
      challengeId,
      progress: 0,
      completed: false,
      streak: 0,
      startDate: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.challengeProgress.push(progress);
    return progress;
  }

  async updateChallengeProgress(userId: string, challengeId: string, completed: boolean, date?: string): Promise<ChallengeProgress> {
    let progress = this.challengeProgress.find(p => p.userId === userId && p.challengeId === challengeId);
    
    if (!progress) {
      progress = await this.joinChallenge(userId, challengeId);
    }

    progress.progress += 1;
    progress.completed = completed;
    if (!completed) {
      progress.streak += 1;
    }
    progress.updatedAt = new Date();

    return progress;
  }

  private getPredefinedChallengeInfo(challengeId: string) {
    const challenges = {
      'gratitude-week': {
        id: 'gratitude-week',
        title: 'Daily Gratitude',
        description: 'Write 3 things you\'re grateful for every day',
        category: 'gratitude',
        duration: 7,
        target: 7,
      },
      'mindful-week': {
        id: 'mindful-week',
        title: 'Mindful Minutes',
        description: 'Practice 5 minutes of mindfulness daily',
        category: 'mindfulness',
        duration: 7,
        target: 7,
      },
      'mood-tracker': {
        id: 'mood-tracker',
        title: 'Mood Awareness',
        description: 'Track your mood twice daily for a week',
        category: 'awareness',
        duration: 7,
        target: 14,
      },
    };
    return challenges[challengeId] || null;
  }

  private getAllPredefinedChallenges() {
    return [
      {
        id: 'gratitude-week',
        title: 'Daily Gratitude',
        description: 'Write 3 things you\'re grateful for every day',
        category: 'gratitude',
        duration: 7,
        target: 7,
      },
      {
        id: 'mindful-week',
        title: 'Mindful Minutes',
        description: 'Practice 5 minutes of mindfulness daily',
        category: 'mindfulness',
        duration: 7,
        target: 7,
      },
      {
        id: 'mood-tracker',
        title: 'Mood Awareness',
        description: 'Track your mood twice daily for a week',
        category: 'awareness',
        duration: 7,
        target: 14,
      },
    ];
  }
}

export const storage = new MemStorage();