import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  size: text("size").notNull(),
  thumbnail: text("thumbnail"),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const scores = pgTable("scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").references(() => games.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  playerName: text("player_name"),
  score: integer("score").notNull(),
  gameData: jsonb("game_data"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").references(() => games.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  target: integer("target").notNull(),
  reward: integer("reward").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: integer("is_active").default(1),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const insertScoreSchema = createInsertSchema(scores).omit({
  id: true,
  createdAt: true,
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scores.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;
