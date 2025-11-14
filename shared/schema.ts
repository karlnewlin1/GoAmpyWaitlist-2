import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const waitlistEntries = pgTable("waitlist_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  position: integer("position").notNull(),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  referralCount: integer("referral_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWaitlistEntrySchema = createInsertSchema(waitlistEntries).omit({
  id: true,
  position: true,
  referralCode: true,
  referralCount: true,
  createdAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  referredBy: z.string().optional(),
});

export type InsertWaitlistEntry = z.infer<typeof insertWaitlistEntrySchema>;
export type WaitlistEntry = typeof waitlistEntries.$inferSelect;

export interface LeaderboardEntry {
  email: string;
  referralCount: number;
  position: number;
}

export interface WaitlistStats {
  totalSignups: number;
  totalReferrals: number;
  averageReferrals: number;
  topReferrer: string | null;
}
