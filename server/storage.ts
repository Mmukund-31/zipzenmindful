import { 
  users, 
  moodEntries, 
  memories, 
  chatMessages,
  type User, 
  type InsertUser,
  type MoodEntry,
  type InsertMoodEntry,
  type Memory,
  type InsertMemory,
  type ChatMessage,
  type InsertChatMessage
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry>;
  getMoodEntriesByUser(userId: number): Promise<MoodEntry[]>;
  getRecentMoodEntry(userId: number): Promise<MoodEntry | undefined>;
  
  createMemory(memory: InsertMemory): Promise<Memory>;
  getMemoriesByUser(userId: number): Promise<Memory[]>;
  getMemoriesByCategory(userId: number, category: string): Promise<Memory[]>;
  updateMemoryFavorite(id: number, isFavorite: boolean): Promise<Memory | undefined>;
  
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByUser(userId: number): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private moodEntries: Map<number, MoodEntry>;
  private memories: Map<number, Memory>;
  private chatMessages: Map<number, ChatMessage>;
  private currentUserId: number;
  private currentMoodId: number;
  private currentMemoryId: number;
  private currentChatId: number;

  constructor() {
    this.users = new Map();
    this.moodEntries = new Map();
    this.memories = new Map();
    this.chatMessages = new Map();
    this.currentUserId = 1;
    this.currentMoodId = 1;
    this.currentMemoryId = 1;
    this.currentChatId = 1;

    // Create a default user for demo purposes
    this.createUser({ username: "sarah", password: "password" });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createMoodEntry(insertMoodEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = this.currentMoodId++;
    const moodEntry: MoodEntry = { 
      ...insertMoodEntry, 
      id, 
      timestamp: new Date()
    };
    this.moodEntries.set(id, moodEntry);
    return moodEntry;
  }

  async getMoodEntriesByUser(userId: number): Promise<MoodEntry[]> {
    return Array.from(this.moodEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getRecentMoodEntry(userId: number): Promise<MoodEntry | undefined> {
    const entries = await this.getMoodEntriesByUser(userId);
    return entries[0];
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    const id = this.currentMemoryId++;
    const memory: Memory = { 
      ...insertMemory, 
      id, 
      timestamp: new Date()
    };
    this.memories.set(id, memory);
    return memory;
  }

  async getMemoriesByUser(userId: number): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter(memory => memory.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getMemoriesByCategory(userId: number, category: string): Promise<Memory[]> {
    const userMemories = await this.getMemoriesByUser(userId);
    return userMemories.filter(memory => memory.category === category);
  }

  async updateMemoryFavorite(id: number, isFavorite: boolean): Promise<Memory | undefined> {
    const memory = this.memories.get(id);
    if (memory) {
      const updatedMemory = { ...memory, isFavorite };
      this.memories.set(id, updatedMemory);
      return updatedMemory;
    }
    return undefined;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatId++;
    const message: ChatMessage = { 
      ...insertMessage, 
      id, 
      timestamp: new Date()
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessagesByUser(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export const storage = new MemStorage();
