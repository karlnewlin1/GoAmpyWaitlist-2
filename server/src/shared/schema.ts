import { pgTable, uuid, text, timestamp, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  emailCi: text('email_ci').notNull(),
  name: text('name'),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  ux_email_ci: uniqueIndex('ux_users_email_ci').on(t.emailCi),
}));

export const waitlistEntries = pgTable('waitlist_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  source: text('source').$type<'direct'|'referral'|'campaign'>().default('direct'),
  referrerUserId: uuid('referrer_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  ux_user: uniqueIndex('ux_waitlist_user').on(t.userId),
  ix_referrer: index('ix_waitlist_referrer').on(t.referrerUserId),
}));

export const referralCodes = pgTable('referral_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  ux_user: uniqueIndex('ux_referral_user').on(t.userId),
  ux_code: uniqueIndex('ux_referral_code').on(t.code),
}));

export const referralEvents = pgTable('referral_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  referralCodeId: uuid('referral_code_id').notNull().references(() => referralCodes.id, { onDelete: 'cascade' }),
  type: text('type').$type<'click'|'signup'>().notNull(),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  ix_referral_code: index('ix_referral_events_code').on(t.referralCodeId),
  ix_type: index('ix_referral_events_type').on(t.type),
}));

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  eventName: text('event_name').notNull(),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (t) => ({
  ix_user: index('ix_events_user').on(t.userId),
  ix_name: index('ix_events_name').on(t.eventName),
}));