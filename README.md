# Pathshala Saathi — School Management System

A full-stack school management system for administrators, teachers, and students. Built with React, Express.js, PostgreSQL, and TypeScript.

## Features

- **Multi-role Authentication** — Admin, Teacher, and Student roles with bcrypt-hashed passwords and session-based auth
- **Student Management** — Add, edit, delete, view student records with PDF/CSV export
- **Teacher Management** — Manage teacher profiles and assignments
- **Course Management** — Create courses, assign teachers, manage enrollments
- **Marks & Rankings** — Record marks, calculate GPA, rank students with QuickSort/MergeSort
- **Attendance Tracking** — Mark and track student attendance per course
- **Analytics Dashboard** — Performance metrics, subject toppers, attendance statistics
- **Assignment System** — Create assignments, track submissions, grade students
- **Notification System** — In-app notifications with read/unread status
- **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Express.js, TypeScript, Node.js |
| Database | PostgreSQL with Drizzle ORM |
| Auth | bcryptjs, express-session |
| State | TanStack React Query |
| Routing | Wouter |

## Prerequisites

- **Node.js** v18+ — [download](https://nodejs.org/)
- **PostgreSQL** 15+ — [download](https://www.postgresql.org/download/) or use Docker

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url> pathshala-saathi
cd pathshala-saathi
npm install
```

### 2. Database Setup

**Option A — Docker (recommended):**
```bash
docker run --name pathshala-db \
  -e POSTGRES_PASSWORD=root \
  -e POSTGRES_DB=pathshala \
  -e POSTGRES_USER=postgres \
  -p 5432:5432 \
  -d postgres:15
```

**Option B — Local PostgreSQL:**
```sql
CREATE DATABASE pathshala;
```

### 3. Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:root@localhost:5432/pathshala
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=root
PGDATABASE=pathshala
NODE_ENV=development
PORT=5000
SESSION_SECRET=<generate-a-random-64-char-string>
```

> **Important:** In production, always set a strong `SESSION_SECRET`.

### 4. Migrate & Seed

```bash
npm run db:push     # Create/update tables
npm run db:seed     # Create demo users
```

### 5. Run

```bash
npm run dev         # Start development server at http://localhost:5000
```

### Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Teacher | `teacher` | `teacher123` |
| Student | `student` | `student123` |

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push schema changes to database |
| `npm run db:generate` | Generate migration SQL files |
| `npm run db:seed` | Seed database with demo users |
| `npm test` | Run unit tests |
| `npm run test:run` | Run tests once |

## Project Structure

```
pathshala-saathi/
├── client/                    # React frontend (Vite)
│   ├── index.html
│   └── src/
│       ├── components/
│       │   ├── auth/          # Login & signup forms
│       │   ├── forms/         # Entity forms (student, teacher, etc.)
│       │   ├── layout/        # Sidebar, header
│       │   ├── notifications/ # Notification dropdown
│       │   └── ui/            # shadcn/ui component library
│       ├── hooks/             # useAuth, useToast, useMobile
│       ├── lib/               # queryClient, ranking algorithms, utils
│       └── pages/             # Route pages
├── server/                    # Express backend
│   ├── auth.ts               # Auth middleware (requireAuth, requireRole)
│   ├── config.ts             # Environment configuration validation
│   ├── db.ts                  # Database connection (pg + Drizzle)
│   ├── index.ts               # Server entry point
│   ├── logger.ts              # Structured logging utility
│   ├── routes.ts              # API route handlers
│   ├── seed.ts                # Database seeding script
│   ├── storage.ts             # Data access layer
│   └── vite.ts                # Vite dev server integration
├── shared/                    # Shared code between client/server
│   └── schema.ts              # Drizzle schema + Zod validation + types
├── tests/                     # Unit tests
│   ├── logger.test.ts
│   └── routing.test.ts
├── .env.example               # Environment template
├── drizzle.config.ts          # Drizzle Kit configuration
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts          # Test configuration
```

## API Endpoints

All endpoints (except auth) require authentication via session cookie.

### Auth
- `POST /api/auth/login` — Login with username/password
- `POST /api/auth/signup` — Register new account
- `POST /api/auth/logout` — Destroy session
- `GET /api/auth/me` — Get current user

### CRUD Resources
- `GET/POST /api/students` — List / Create
- `GET/PUT/DELETE /api/students/:id` — Read / Update / Delete
- `GET/POST /api/teachers`
- `GET/PUT/DELETE /api/teachers/:id`
- `GET/POST /api/courses`
- `GET/PUT/DELETE /api/courses/:id`
- `GET/POST /api/marks`
- `PUT/DELETE /api/marks/:id`
- `GET/POST /api/attendance`
- `PUT /api/attendance/:id`
- `GET/POST /api/enrollments`
- `GET/POST /api/assignments`
- `PUT/DELETE /api/assignments/:id`

### Analytics
- `GET /api/analytics/dashboard-stats`
- `GET /api/analytics/students-gpa`
- `GET /api/analytics/subject-toppers`
- `GET /api/analytics/attendance-stats`

## Production Deployment

1. Set environment variables (especially `SESSION_SECRET`, `NODE_ENV=production`)
2. Build: `npm run build`
3. Start: `npm start`
4. Use a process manager like PM2: `pm2 start dist/index.js`

## Security

- Passwords hashed with bcrypt (12 rounds)
- Session-based authentication with httpOnly cookies
- Rate limiting on auth endpoints (20 req/15 min)
- API rate limiting (100 req/min)
- Role-based access control on all write operations
- Zod input validation on every endpoint
- No secrets in client bundle
- Production: Session secret validation (minimum 32 characters required)
- Production: Application fails to start if critical env vars missing

## Performance

- Optimized database queries (bulk fetching instead of N+1 queries)
- Efficient analytics aggregation using SQL
- React Query with proper caching configuration

## Testing

Run unit tests with:
```bash
npm test          # Watch mode
npm run test:run # Single run
```

## License

MIT
