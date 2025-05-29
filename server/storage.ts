import {
  users,
  moodEntries,
  memories,
  chatMessages,
  gratitudeEntries,
  challenges,
  challengeProgress,
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
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
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

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createMoodEntry(insertMoodEntry: InsertMoodEntry): Promise<MoodEntry> {
    const [moodEntry] = await db
      .insert(moodEntries)
      .values({
        ...insertMoodEntry,
        note: insertMoodEntry.note || null,
      })
      .returning();
    return moodEntry;
  }

  async getMoodEntriesByUser(userId: string): Promise<MoodEntry[]> {
    return await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(moodEntries.timestamp);
  }

  async getRecentMoodEntry(userId: string): Promise<MoodEntry | undefined> {
    const [entry] = await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(moodEntries.timestamp)
      .limit(1);
    return entry;
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    const [memory] = await db
      .insert(memories)
      .values({
        ...insertMemory,
        description: insertMemory.description || null,
        isFavorite: insertMemory.isFavorite || false,
      })
      .returning();
    return memory;
  }

  async getMemoriesByUser(userId: string): Promise<Memory[]> {
    return await db
      .select()
      .from(memories)
      .where(eq(memories.userId, userId))
      .orderBy(memories.timestamp);
  }

  async getMemoriesByCategory(userId: string, category: string): Promise<Memory[]> {
    return await db
      .select()
      .from(memories)
      .where(and(eq(memories.userId, userId), eq(memories.category, category)))
      .orderBy(memories.timestamp);
  }

  async updateMemoryFavorite(id: number, isFavorite: boolean): Promise<Memory | undefined> {
    const [memory] = await db
      .update(memories)
      .set({ isFavorite })
      .where(eq(memories.id, id))
      .returning();
    return memory;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getChatMessagesByUser(userId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.timestamp);
  }

  async createGratitudeEntry(insertEntry: InsertGratitudeEntry): Promise<GratitudeEntry> {
    const [entry] = await db
      .insert(gratitudeEntries)
      .values(insertEntry)
      .returning();
    return entry;
  }

  async getGratitudeEntriesByUser(userId: string): Promise<GratitudeEntry[]> {
    return await db
      .select()
      .from(gratitudeEntries)
      .where(eq(gratitudeEntries.userId, userId))
      .orderBy(gratitudeEntries.date);
  }

  async getActiveChallengesByUser(userId: string): Promise<Challenge[]> {
    // Return empty array for now - challenges are managed client-side with predefined data
    return [];
  }

  async getAvailableChallenges(userId: string): Promise<Challenge[]> {
    // Return empty array for now - challenges are managed client-side with predefined data
    return [];
  }

  async getCompletedChallengesByUser(userId: string): Promise<Challenge[]> {
    // Return empty array for now - challenges are managed client-side with predefined data
    return [];
  }

  async joinChallenge(userId: string, challengeId: string): Promise<ChallengeProgress> {
    // Create a mock progress entry for now
    return {
      id: Math.floor(Math.random() * 1000),
      challengeId,
      userId,
      completed: 0,
      startDate: new Date(),
      lastActivityDate: null,
      timestamp: new Date(),
    };
  }

  async updateChallengeProgress(userId: string, challengeId: string, completed: boolean, date?: string): Promise<ChallengeProgress> {
    // Return a mock updated progress entry
    return {
      id: Math.floor(Math.random() * 1000),
      challengeId,
      userId,
      completed: completed ? 1 : 0,
      startDate: new Date(),
      lastActivityDate: new Date(date || new Date()),
      timestamp: new Date(),
    };
  }
}

export const storage = new DatabaseStorage();
