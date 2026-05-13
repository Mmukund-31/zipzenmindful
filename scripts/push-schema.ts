import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const SQL = `
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY NOT NULL,
  email VARCHAR UNIQUE,
  phone_number VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  name VARCHAR,
  age VARCHAR,
  wellness_goals TEXT,
  preferred_time VARCHAR,
  motivation TEXT,
  preferred_language VARCHAR DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mood_entries (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  emoji TEXT NOT NULL,
  note TEXT,
  rating INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id);

CREATE TABLE IF NOT EXISTS memories (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_from_user BOOLEAN NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

CREATE TABLE IF NOT EXISTS gratitude_entries (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  date TIMESTAMP DEFAULT NOW(),
  timestamp TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user_id ON gratitude_entries(user_id);

CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  type VARCHAR NOT NULL,
  difficulty VARCHAR NOT NULL,
  points INTEGER NOT NULL,
  icon VARCHAR,
  start_date TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS challenge_progress (
  id SERIAL PRIMARY KEY,
  challenge_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed INTEGER DEFAULT 0,
  start_date TIMESTAMP DEFAULT NOW(),
  last_activity_date TIMESTAMP,
  timestamp TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_id ON challenge_progress(user_id);

CREATE TABLE IF NOT EXISTS challenge_daily_progress (
  id SERIAL PRIMARY KEY,
  challenge_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date VARCHAR NOT NULL,
  completed BOOLEAN DEFAULT false,
  timestamp TIMESTAMP DEFAULT NOW()
);
`;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  console.log("Connecting via Neon serverless (WebSocket)...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query(SQL);
    console.log("✅ Schema pushed successfully via WebSocket connection");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Schema push failed:", err);
  process.exit(1);
});
