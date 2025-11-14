// Minimal shared types for server/storage and other utilities.
// Replace with Drizzle $inferSelect/$inferInsert once we wire the DB.

export type User = {
  id: string;
  email: string;
  name?: string | null;
  createdAt?: string; // ISO string when present
};

export type InsertUser = {
  email: string;
  name?: string | null;
};
