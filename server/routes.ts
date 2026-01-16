import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { z } from "zod";

// Session user type
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8),
  email: z.string().email(),
  fullName: z.string().min(2),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const skillSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().min(1),
  type: z.enum(["offering", "seeking"]),
  experienceLevel: z.string().optional(),
});

const sessionRequestSchema = z.object({
  skillId: z.string(),
  providerId: z.string(),
  message: z.string().optional(),
});

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "skillswap-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Error handler wrapper
  const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => 
    (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res)).catch((error) => {
        console.error("API Error:", error);
        res.status(500).json({ message: "An error occurred. Please try again." });
      });
    };

  // Auth routes
  app.post("/api/auth/register", asyncHandler(async (req, res) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid input", errors: result.error.flatten() });
    }

    const { username, password, email, fullName } = result.data;

    // Check if user exists
    const existingUsername = await storage.getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await storage.createUser({
      username,
      password: hashedPassword,
      email,
      fullName,
    });

    req.session.userId = user.id;

    res.status(201).json({ 
      user: { ...user, password: undefined }
    });
  }));

  app.post("/api/auth/login", asyncHandler(async (req, res) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const { username, password } = result.data;

    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    req.session.userId = user.id;

    res.json({ user: { ...user, password: undefined } });
  }));

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({ user: { ...user, password: undefined } });
  }));

  // Skills routes
  app.get("/api/skills/my", requireAuth, asyncHandler(async (req, res) => {
    const skills = await storage.getSkillsByUserId(req.session.userId!);
    res.json(skills);
  }));

  app.post("/api/skills", requireAuth, asyncHandler(async (req, res) => {
    const result = skillSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid input", errors: result.error.flatten() });
    }

    const skill = await storage.createSkill({
      ...result.data,
      userId: req.session.userId!,
    });

    res.status(201).json(skill);
  }));

  app.delete("/api/skills/:id", requireAuth, asyncHandler(async (req, res) => {
    const skill = await storage.getSkill(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }
    if (skill.userId !== req.session.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await storage.deleteSkill(req.params.id);
    res.json({ message: "Skill deleted" });
  }));

  // Search route
  app.get("/api/search", asyncHandler(async (req, res) => {
    const query = req.query.q as string | undefined;
    const category = req.query.category as string | undefined;
    
    const skills = await storage.searchSkills(query, category);
    res.json(skills);
  }));

  // Sessions routes
  app.get("/api/sessions/my", requireAuth, asyncHandler(async (req, res) => {
    const sessions = await storage.getSessionsByUserId(req.session.userId!);
    res.json(sessions);
  }));

  app.post("/api/sessions/request", requireAuth, asyncHandler(async (req, res) => {
    const result = sessionRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const { skillId, providerId, message } = result.data;

    // Verify skill exists and belongs to provider
    const skill = await storage.getSkill(skillId);
    if (!skill || skill.userId !== providerId) {
      return res.status(400).json({ message: "Invalid skill or provider" });
    }

    // Can't request session with yourself
    if (providerId === req.session.userId) {
      return res.status(400).json({ message: "Cannot request session with yourself" });
    }

    const session = await storage.createSession({
      requesterId: req.session.userId!,
      providerId,
      skillId,
      message,
    });

    res.status(201).json(session);
  }));

  // Admin routes
  app.get("/api/admin/users", requireAdmin, asyncHandler(async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users.map((u) => ({ ...u, password: undefined })));
  }));

  app.patch("/api/admin/users/:id", requireAdmin, asyncHandler(async (req, res) => {
    const { isAdmin } = req.body;
    
    const user = await storage.updateUser(req.params.id, { isAdmin });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ ...user, password: undefined });
  }));

  app.delete("/api/admin/users/:id", requireAdmin, asyncHandler(async (req, res) => {
    // Can't delete yourself
    if (req.params.id === req.session.userId) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    await storage.deleteUser(req.params.id);
    res.json({ message: "User deleted" });
  }));

  app.get("/api/admin/stats", requireAdmin, asyncHandler(async (req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  }));

  // Session status update
  app.patch("/api/sessions/:id", requireAuth, asyncHandler(async (req, res) => {
    const { status } = req.body;
    
    if (!["accepted", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const session = await storage.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Only provider can accept/complete, both can cancel
    if (status === "accepted" || status === "completed") {
      if (session.providerId !== req.session.userId) {
        return res.status(403).json({ message: "Only the provider can update this session" });
      }
    } else if (status === "cancelled") {
      if (session.providerId !== req.session.userId && session.requesterId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    const updated = await storage.updateSession(req.params.id, { status });
    res.json(updated);
  }));

  // Reviews routes
  app.post("/api/reviews", requireAuth, asyncHandler(async (req, res) => {
    const { sessionId, revieweeId, rating, comment } = req.body;

    if (!sessionId || !revieweeId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Invalid review data" });
    }

    const session = await storage.getSession(sessionId);
    if (!session || session.status !== "completed") {
      return res.status(400).json({ message: "Can only review completed sessions" });
    }

    // Verify the reviewer is part of this session
    if (session.requesterId !== req.session.userId && session.providerId !== req.session.userId) {
      return res.status(403).json({ message: "Not authorized to review this session" });
    }

    // Verify the reviewee is the other party
    if (revieweeId !== session.requesterId && revieweeId !== session.providerId) {
      return res.status(400).json({ message: "Invalid reviewee" });
    }

    const review = await storage.createReview({
      sessionId,
      reviewerId: req.session.userId!,
      revieweeId,
      rating,
      comment,
    });

    res.status(201).json(review);
  }));

  app.get("/api/reviews/:userId", asyncHandler(async (req, res) => {
    const reviews = await storage.getReviewsByUserId(req.params.userId);
    res.json(reviews);
  }));

  // User stats for badges
  app.get("/api/users/:id/stats", asyncHandler(async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const skills = await storage.getSkillsByUserId(req.params.id);
    const sessions = await storage.getSessionsByUserId(req.params.id);
    const reviews = await storage.getReviewsByUserId(req.params.id);

    const completedSessions = sessions.filter((s) => s.status === "completed").length;
    const offeringSkills = skills.filter((s) => s.type === "offering").length;
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    const badges = [];
    if (completedSessions >= 5) badges.push("top_tutor");
    if (offeringSkills >= 3) badges.push("skill_master");
    if (skills.length >= 1) badges.push("getting_started");
    if (averageRating >= 4.5 && reviews.length >= 3) badges.push("highly_rated");

    res.json({
      completedSessions,
      offeringSkills,
      seekingSkills: skills.filter((s) => s.type === "seeking").length,
      averageRating,
      reviewCount: reviews.length,
      badges,
    });
  }));

  return httpServer;
}
