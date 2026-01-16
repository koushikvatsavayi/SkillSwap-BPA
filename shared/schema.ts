import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  type: text("type").notNull(), // 'offering' or 'seeking'
  experienceLevel: text("experience_level"), // 'beginner', 'intermediate', 'advanced'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  providerId: varchar("provider_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  skillId: varchar("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'completed', 'cancelled'
  scheduledAt: timestamp("scheduled_at"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  revieweeId: varchar("reviewee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  skills: many(skills),
  sessionsAsRequester: many(sessions, { relationName: "requester" }),
  sessionsAsProvider: many(sessions, { relationName: "provider" }),
  reviewsGiven: many(reviews, { relationName: "reviewer" }),
  reviewsReceived: many(reviews, { relationName: "reviewee" }),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  user: one(users, { fields: [skills.userId], references: [users.id] }),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  requester: one(users, { fields: [sessions.requesterId], references: [users.id], relationName: "requester" }),
  provider: one(users, { fields: [sessions.providerId], references: [users.id], relationName: "provider" }),
  skill: one(skills, { fields: [sessions.skillId], references: [skills.id] }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  session: one(sessions, { fields: [reviews.sessionId], references: [sessions.id] }),
  reviewer: one(users, { fields: [reviews.reviewerId], references: [users.id], relationName: "reviewer" }),
  reviewee: one(users, { fields: [reviews.revieweeId], references: [users.id], relationName: "reviewee" }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  bio: true,
  avatarUrl: true,
});

export const insertSkillSchema = createInsertSchema(skills).pick({
  userId: true,
  name: true,
  description: true,
  category: true,
  type: true,
  experienceLevel: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  requesterId: true,
  providerId: true,
  skillId: true,
  scheduledAt: true,
  message: true,
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  sessionId: true,
  reviewerId: true,
  revieweeId: true,
  rating: true,
  comment: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// Extended types for frontend
export type UserWithSkills = User & { skills: Skill[] };
export type SkillWithUser = Skill & { user: User };
export type SessionWithDetails = Session & { 
  requester: User; 
  provider: User; 
  skill: Skill;
};
