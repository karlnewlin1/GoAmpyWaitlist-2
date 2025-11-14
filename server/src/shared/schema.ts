import { pgTable, uuid, text, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (t) => ({ ux_email: uniqueIndex('ux_users_email').on(t.email) }));

export const waitlistEntries = pgTable('waitlist_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  source: text('source').$type<'direct'|'referral'|'campaign'>().default('direct'),
  referrerUserId: uuid('referrer_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (t) => ({ ux_user: uniqueIndex('ux_waitlist_user').on(t.userId) }));

export const referralCodes = pgTable('referral_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  code: text('code').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  ux_user: uniqueIndex('ux_referral_user').on(t.userId),
  ux_code: uniqueIndex('ux_referral_code').on(t.code)
}));

export const referralEvents = pgTable('referral_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  referralCodeId: uuid('referral_code_id').notNull(),
  type: text('type').$type<'click'|'signup'>().notNull(),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  eventName: text('event_name').notNull(),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});