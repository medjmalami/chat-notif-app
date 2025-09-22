import { pgTable, uuid, varchar, text, boolean, timestamp, index, unique, primaryKey } from 'drizzle-orm/pg-core';
import { eq, sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  isOnline: boolean('is_online').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Google OAuth accounts (minimal for practice)
export const oauthAccounts = pgTable('oauth_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  googleUserId: varchar('google_user_id', { length: 255 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Chats table
export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Chat members
export const chatMembers = pgTable('chat_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  joinedAt: timestamp('joined_at').defaultNow(),
}, (table) => ({
  chatIdIdx: index('idx_chat_members_chat').on(table.chatId),
  chatUserUnique: unique('chat_member_unique').on(table.chatId, table.userId),
}));

// Messages
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  chatCreatedAtIdx: index('idx_messages_chat').on(table.chatId, table.createdAt),
}));

// Notification queue
export const notificationQueue = pgTable('notification_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  chatId: uuid('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }).notNull(),
  isDelivered: boolean('is_delivered').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_notification_queue_user').on(table.userId),
}));

// User sessions
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  socketId: varchar('socket_id', { length: 255 }),
  activeChatId: uuid('active_chat_id').references(() => chats.id),
  connectedAt: timestamp('connected_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  oauthAccounts: many(oauthAccounts),
  chatMembers: many(chatMembers),
  messages: many(messages),
  notifications: many(notificationQueue),
  sessions: many(userSessions),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, { fields: [oauthAccounts.userId], references: [users.id] }),
}));

export const chatsRelations = relations(chats, ({ many }) => ({
  members: many(chatMembers),
  messages: many(messages),
  notifications: many(notificationQueue),
}));

export const chatMembersRelations = relations(chatMembers, ({ one }) => ({
  chat: one(chats, { fields: [chatMembers.chatId], references: [chats.id] }),
  user: one(users, { fields: [chatMembers.userId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  notifications: many(notificationQueue),
}));

export const notificationQueueRelations = relations(notificationQueue, ({ one }) => ({
  user: one(users, { fields: [notificationQueue.userId], references: [users.id] }),
  chat: one(chats, { fields: [notificationQueue.chatId], references: [chats.id] }),
  message: one(messages, { fields: [notificationQueue.messageId], references: [messages.id] }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, { fields: [userSessions.userId], references: [users.id] }),
  activeChat: one(chats, { fields: [userSessions.activeChatId], references: [chats.id] }),
}));