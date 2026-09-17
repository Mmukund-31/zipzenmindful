import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Neon's cloud databases are reached over their WebSocket proxy; any other Postgres
// (local dev, self-hosted, docker-compose) uses the standard node-postgres driver.
const isNeon = /\.neon\.tech/.test(process.env.DATABASE_URL);

export let pool: any;
export let db: any;

if (isNeon) {
  const { Pool, neonConfig } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  const ws = (await import("ws")).default;

  neonConfig.webSocketConstructor = ws;
  neonConfig.fetchConnectionCache = true;

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 10000,
  });
  db = drizzle({ client: pool, schema });
} else {
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 10000,
  });
  db = drizzle(pool, { schema });
}

pool.on("error", (err: Error) => {
  console.error("Database pool error:", err);
});
