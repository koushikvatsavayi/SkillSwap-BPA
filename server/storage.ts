import { 
  users, skills, sessions, reviews,
  type User, type InsertUser, 
  type Skill, type InsertSkill,
  type Session, type InsertSession,
  type Review, type InsertReview,
  type SkillWithUser, type SessionWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and, sql, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  // Skills
  getSkill(id: string): Promise<Skill | undefined>;
  getSkillsByUserId(userId: string): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  deleteSkill(id: string): Promise<void>;
  searchSkills(query?: string, category?: string): Promise<SkillWithUser[]>;
  
  // Sessions
  getSession(id: string): Promise<Session | undefined>;
  getSessionsByUserId(userId: string): Promise<SessionWithDetails[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, data: Partial<Session>): Promise<Session | undefined>;
  
  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByUserId(userId: string): Promise<Review[]>;
  
  // Stats
  getStats(): Promise<{
    totalUsers: number;
    totalSkills: number;
    totalSessions: number;
    skillsByCategory: { name: string; value: number }[];
    sessionsByStatus: { name: string; value: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Skills
  async getSkill(id: string): Promise<Skill | undefined> {
    const [skill] = await db.select().from(skills).where(eq(skills.id, id));
    return skill || undefined;
  }

  async getSkillsByUserId(userId: string): Promise<Skill[]> {
    return db.select().from(skills).where(eq(skills.userId, userId)).orderBy(desc(skills.createdAt));
  }

  async createSkill(skill: InsertSkill): Promise<Skill> {
    const [newSkill] = await db.insert(skills).values(skill).returning();
    return newSkill;
  }

  async deleteSkill(id: string): Promise<void> {
    await db.delete(skills).where(eq(skills.id, id));
  }

  async searchSkills(query?: string, category?: string): Promise<SkillWithUser[]> {
    let baseQuery = db
      .select({
        id: skills.id,
        userId: skills.userId,
        name: skills.name,
        description: skills.description,
        category: skills.category,
        type: skills.type,
        experienceLevel: skills.experienceLevel,
        createdAt: skills.createdAt,
        user: {
          id: users.id,
          username: users.username,
          password: users.password,
          email: users.email,
          fullName: users.fullName,
          bio: users.bio,
          avatarUrl: users.avatarUrl,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
        },
      })
      .from(skills)
      .innerJoin(users, eq(skills.userId, users.id))
      .orderBy(desc(skills.createdAt));

    const results = await baseQuery;
    
    let filtered = results;
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (s) => s.name.toLowerCase().includes(lowerQuery) || 
               (s.description && s.description.toLowerCase().includes(lowerQuery))
      );
    }
    
    if (category) {
      filtered = filtered.filter((s) => s.category === category);
    }
    
    return filtered;
  }

  // Sessions
  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session || undefined;
  }

  async getSessionsByUserId(userId: string): Promise<SessionWithDetails[]> {
    const results = await db
      .select({
        session: sessions,
        requester: users,
        skill: skills,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.requesterId, users.id))
      .innerJoin(skills, eq(sessions.skillId, skills.id))
      .where(or(eq(sessions.requesterId, userId), eq(sessions.providerId, userId)))
      .orderBy(desc(sessions.createdAt));

    const sessionDetails: SessionWithDetails[] = [];
    
    for (const row of results) {
      const [provider] = await db.select().from(users).where(eq(users.id, row.session.providerId));
      sessionDetails.push({
        ...row.session,
        requester: row.requester,
        provider: provider,
        skill: row.skill,
      });
    }
    
    return sessionDetails;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(sessions).values({
      ...session,
      status: "pending",
    }).returning();
    return newSession;
  }

  async updateSession(id: string, data: Partial<Session>): Promise<Session | undefined> {
    const [session] = await db.update(sessions).set(data).where(eq(sessions.id, id)).returning();
    return session || undefined;
  }

  // Reviews
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getReviewsByUserId(userId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.revieweeId, userId)).orderBy(desc(reviews.createdAt));
  }

  // Stats
  async getStats() {
    const allUsers = await db.select().from(users);
    const allSkills = await db.select().from(skills);
    const allSessions = await db.select().from(sessions);

    const skillsByCategory: Record<string, number> = {};
    for (const skill of allSkills) {
      skillsByCategory[skill.category] = (skillsByCategory[skill.category] || 0) + 1;
    }

    const sessionsByStatus: Record<string, number> = {};
    for (const session of allSessions) {
      sessionsByStatus[session.status] = (sessionsByStatus[session.status] || 0) + 1;
    }

    return {
      totalUsers: allUsers.length,
      totalSkills: allSkills.length,
      totalSessions: allSessions.length,
      skillsByCategory: Object.entries(skillsByCategory).map(([name, value]) => ({ name, value })),
      sessionsByStatus: Object.entries(sessionsByStatus).map(([name, value]) => ({ name, value })),
    };
  }
}

export const storage = new DatabaseStorage();
