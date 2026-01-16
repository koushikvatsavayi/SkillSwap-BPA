# SkillSwap - Student Talent Exchange Platform

## Overview

SkillSwap is a peer-to-peer learning platform where students can share and exchange skills. The application connects students who want to teach (offering skills like tutoring, coding, music lessons) with students who want to learn (seeking skills). Users can create profiles, list their skills, search for tutors, request learning sessions, and leave reviews.

Key features include:
- User registration and authentication with session management
- Skill management (offering and seeking)
- Search functionality to find tutors by skill or category
- Session booking and tracking
- Review and rating system
- Admin panel with user management and analytics
- Badge/gamification system for top contributors

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite

The frontend follows a page-based architecture with shared components:
- Pages in `client/src/pages/` (Landing, Login, Register, Dashboard, Search, Admin)
- Reusable UI components in `client/src/components/ui/` (shadcn/ui)
- Custom components in `client/src/components/` (Header, Footer, ThemeToggle)
- Authentication context in `client/src/lib/auth.tsx`

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: express-session with connect-pg-simple for session storage
- **Password Security**: bcrypt for hashing

The backend uses a modular structure:
- `server/index.ts` - Express app setup and middleware
- `server/routes.ts` - API route definitions with validation
- `server/storage.ts` - Database operations abstraction layer
- `server/db.ts` - Database connection pool
- `shared/schema.ts` - Drizzle schema definitions shared between frontend and backend

### Data Model
Four main entities with relationships:
- **Users**: Core user accounts with admin flag
- **Skills**: User skills (one-to-many with users), typed as "offering" or "seeking"
- **Sessions**: Learning sessions between requester and provider (references users and skills)
- **Reviews**: Session feedback (references sessions and users)

### API Structure
RESTful API endpoints:
- `/api/auth/*` - Authentication (login, register, logout, me)
- `/api/skills/*` - Skill CRUD operations
- `/api/search` - Skill search with filters
- `/api/session/*` - Session management
- `/api/admin/*` - Admin-only operations (protected route)

### Authentication Flow
- Session-based authentication using express-session
- Sessions stored in PostgreSQL via connect-pg-simple
- Protected routes use middleware checking `req.session.userId`
- Admin routes additionally verify `user.isAdmin` flag

## External Dependencies

### Database
- **PostgreSQL**: Primary database (connection via `DATABASE_URL` environment variable)
- **Drizzle ORM**: Type-safe database queries and migrations
- **drizzle-kit**: Database migration tooling (`npm run db:push`)

### Session Storage
- **connect-pg-simple**: PostgreSQL session store for express-session

### UI Components
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Accessible component primitives
- **Recharts**: Data visualization for admin analytics

### Development Tools
- **Vite**: Frontend bundler with HMR
- **esbuild**: Production server bundling
- **TypeScript**: Type checking across the codebase

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string (required)