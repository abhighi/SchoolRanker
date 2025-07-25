# School Management System

## Overview

This is a full-stack school management system built with React, Express.js, and PostgreSQL. The application provides comprehensive functionality for managing students, teachers, courses, attendance, and academic performance with real-time analytics and ranking capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Monorepo Structure
- **Frontend**: React with TypeScript, Vite for bundling
- **Backend**: Express.js REST API with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing

### Project Structure
```
├── client/           # React frontend application
├── server/           # Express.js backend API
├── shared/           # Shared TypeScript schemas and types
├── migrations/       # Database migration files
└── dist/            # Production build output
```

## Key Components

### Frontend Architecture
- **Component Library**: Custom UI components built on Radix UI primitives
- **Styling System**: Tailwind CSS with CSS variables for theming
- **Form Management**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query with custom API client
- **Responsive Design**: Mobile-first approach with adaptive layouts

### Backend Architecture
- **REST API**: Express.js with TypeScript
- **Database Layer**: Drizzle ORM with type-safe queries
- **Schema Validation**: Zod schemas shared between client and server
- **Error Handling**: Centralized error middleware
- **Database Provider**: Neon serverless PostgreSQL

### Database Schema
The system manages five core entities:
- **Students**: Personal info, academic details, enrollment status
- **Teachers**: Professional info, subjects, qualifications
- **Courses**: Subject details, grade levels, teacher assignments
- **Marks**: Academic performance tracking with exam types
- **Attendance**: Daily attendance records with status tracking
- **Course Enrollments**: Student-course relationships

## Data Flow

### Client-Server Communication
1. **React components** make API requests using TanStack Query
2. **Custom API client** handles HTTP requests with error handling
3. **Express routes** validate requests using Zod schemas
4. **Storage layer** executes database operations via Drizzle ORM
5. **Responses** are typed and validated before sending to client

### Form Handling Pattern
1. React Hook Form manages form state and validation
2. Zod schemas validate input on both client and server
3. Mutations update server state and invalidate relevant queries
4. UI provides real-time feedback via toast notifications

### Analytics Pipeline
1. Raw data aggregated from multiple tables
2. Client-side algorithms for performance calculations (GPA, rankings)
3. Quick Sort and Merge Sort implementations for student rankings
4. Real-time dashboard updates via query invalidation

## External Dependencies

### Core Frontend Libraries
- **React 18**: Component framework with modern hooks
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management
- **Wouter**: Lightweight client-side routing
- **Tailwind CSS**: Utility-first CSS framework

### UI Component System
- **Radix UI**: Headless component primitives
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variant management

### Backend Stack
- **Express.js**: Web application framework
- **Drizzle ORM**: Type-safe database toolkit
- **Neon Database**: Serverless PostgreSQL provider
- **Zod**: Runtime type validation
- **ESBuild**: Fast JavaScript bundler for production

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Static type checking
- **PostCSS**: CSS processing with Tailwind
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite compiles React app to static assets
2. **Backend Build**: ESBuild bundles Node.js application
3. **Database Migrations**: Drizzle Kit manages schema changes
4. **Type Safety**: Shared schemas ensure consistency

### Production Setup
- Frontend assets served from `dist/public`
- Backend runs as Node.js server
- Database hosted on Neon serverless platform
- Environment variables manage database connections

### Development Workflow
- Hot module replacement via Vite in development
- Shared TypeScript configuration across packages
- Database schema changes via `npm run db:push`
- Type checking with `npm run check`

### Key Architectural Decisions

1. **Monorepo Structure**: Simplifies shared type definitions and reduces code duplication
2. **Drizzle ORM**: Provides type safety without heavy abstraction overhead
3. **TanStack Query**: Handles caching, synchronization, and error states automatically
4. **Zod Validation**: Ensures data consistency between client and server
5. **Component Composition**: Radix UI primitives allow for flexible, accessible components
6. **PostgreSQL**: Relational database fits the structured nature of school data
7. **Serverless Database**: Neon provides scalability without infrastructure management