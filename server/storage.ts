// Simple in-memory storage for demo purposes
interface DemoUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DemoMoodEntry {
  id: number;
  userId: string;
  mood: string;
  emoji: string;
  note: string | null;
  rating: number;
  timestamp: Date;
}

interface DemoMemory {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  imageUrl: string;
  category: string;
  isFavorite: boolean;
  timestamp: Date;
}

interface DemoChatMessage {
  id: number;
  userId: string;
  message: string;
  isFromUser: boolean;
  timestamp: Date;
}

interface DemoGratitudeEntry {
  id: number;
  userId: string;
  content: string;
  date: Date;
  timestamp: Date;
}

interface DemoChallengeProgress {
  id: number;
  userId: string;
  challengeId: string;
  progress: number;
  completed: boolean;
  streak: number;
  startDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStorage {
  getUser(id: string): Promise<DemoUser | undefined>;
  upsertUser(user: any): Promise<DemoUser>;
  
  createMoodEntry(moodEntry: any): Promise<DemoMoodEntry>;
  getMoodEntriesByUser(userId: string): Promise<DemoMoodEntry[]>;
  getRecentMoodEntry(userId: string): Promise<DemoMoodEntry | undefined>;
  
  createMemory(memory: any): Promise<DemoMemory>;
  getMemoriesByUser(userId: string): Promise<DemoMemory[]>;
  getMemoriesByCategory(userId: string, category: string): Promise<DemoMemory[]>;
  updateMemoryFavorite(id: number, isFavorite: boolean): Promise<DemoMemory | undefined>;
  
  createChatMessage(message: any): Promise<DemoChatMessage>;
  getChatMessagesByUser(userId: string): Promise<DemoChatMessage[]>;
  
  createGratitudeEntry(entry: any): Promise<DemoGratitudeEntry>;
  getGratitudeEntriesByUser(userId: string): Promise<DemoGratitudeEntry[]>;
  
  getActiveChallengesByUser(userId: string): Promise<any[]>;
  getAvailableChallenges(userId: string): Promise<any[]>;
  getCompletedChallengesByUser(userId: string): Promise<any[]>;
  joinChallenge(userId: string, challengeId: string): Promise<DemoChallengeProgress>;
  updateChallengeProgress(userId: string, challengeId: string, completed: boolean, date?: string): Promise<DemoChallengeProgress>;
}

export class MemStorage implements IStorage {
  private users: Map<string, DemoUser> = new Map();
  private moodEntries: DemoMoodEntry[] = [];
  private memories: DemoMemory[] = [];
  private chatMessages: DemoChatMessage[] = [];
  private gratitudeEntries: DemoGratitudeEntry[] = [];
  private challengeProgress: DemoChallengeProgress[] = [];
  private nextId = 1;

  async getUser(id: string): Promise<DemoUser | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: any): Promise<DemoUser> {
    const existingUser = this.users.get(userData.id);
    const user: DemoUser = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  async createMoodEntry(insertMoodEntry: any): Promise<DemoMoodEntry> {
    const moodEntry: DemoMoodEntry = {
      id: this.nextId++,
      userId: insertMoodEntry.userId,
      mood: insertMoodEntry.mood,
      emoji: insertMoodEntry.emoji,
      note: insertMoodEntry.notes || null,
      rating: insertMoodEntry.rating || 3,
      timestamp: new Date(),
    };
    this.moodEntries.push(moodEntry);
    return moodEntry;
  }

  async getMoodEntriesByUser(userId: string): Promise<DemoMoodEntry[]> {
    return this.moodEntries
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getRecentMoodEntry(userId: string): Promise<DemoMoodEntry | undefined> {
    const entries = await this.getMoodEntriesByUser(userId);
    return entries[0];
  }

  async createMemory(insertMemory: any): Promise<DemoMemory> {
    const memory: DemoMemory = {
      id: this.nextId++,
      userId: insertMemory.userId,
      title: insertMemory.title,
      description: insertMemory.description || null,
      imageUrl: insertMemory.imageUrl,
      category: insertMemory.category,
      isFavorite: false,
      timestamp: new Date(),
    };
    this.memories.push(memory);
    return memory;
  }

  async getMemoriesByUser(userId: string): Promise<DemoMemory[]> {
    return this.memories
      .filter(memory => memory.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getMemoriesByCategory(userId: string, category: string): Promise<DemoMemory[]> {
    return this.memories
      .filter(memory => memory.userId === userId && memory.category === category)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async updateMemoryFavorite(id: number, isFavorite: boolean): Promise<DemoMemory | undefined> {
    const memory = this.memories.find(m => m.id === id);
    if (memory) {
      memory.isFavorite = isFavorite;
    }
    return memory;
  }

  async createChatMessage(insertMessage: any): Promise<DemoChatMessage> {
    const message: DemoChatMessage = {
      id: this.nextId++,
      userId: insertMessage.userId,
      message: insertMessage.message,
      isFromUser: insertMessage.isUser || false,
      timestamp: new Date(),
    };
    this.chatMessages.push(message);
    return message;
  }

  async getChatMessagesByUser(userId: string): Promise<DemoChatMessage[]> {
    return this.chatMessages
      .filter(message => message.userId === userId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createGratitudeEntry(insertEntry: any): Promise<DemoGratitudeEntry> {
    const entry: DemoGratitudeEntry = {
      id: this.nextId++,
      userId: insertEntry.userId,
      content: insertEntry.content,
      date: insertEntry.date ? new Date(insertEntry.date) : new Date(),
      timestamp: new Date(),
    };
    this.gratitudeEntries.push(entry);
    return entry;
  }

  async getGratitudeEntriesByUser(userId: string): Promise<DemoGratitudeEntry[]> {
    return this.gratitudeEntries
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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

  async joinChallenge(userId: string, challengeId: string): Promise<DemoChallengeProgress> {
    const progress: DemoChallengeProgress = {
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

  async updateChallengeProgress(userId: string, challengeId: string, completed: boolean, date?: string): Promise<DemoChallengeProgress> {
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

  private getPredefinedChallengeInfo(challengeId: string): any {
    const challenges: Record<string, any> = {
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