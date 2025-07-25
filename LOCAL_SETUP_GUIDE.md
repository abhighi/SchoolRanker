# Pathshala Saathi - Local Setup Guide

## Prerequisites

Before setting up the project locally, ensure you have the following software installed on your machine:

### Required Software

1. **Node.js (v18 or higher)**
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **PostgreSQL Database**
   - **Option A - PostgreSQL Server:**
     - Windows: Download from https://www.postgresql.org/download/windows/
     - macOS: Use Homebrew: `brew install postgresql`
     - Linux: `sudo apt-get install postgresql postgresql-contrib`
   
   - **Option B - Docker (Recommended for easy setup):**
     - Install Docker: https://www.docker.com/get-started
     - Run PostgreSQL in container: 
       ```bash
       docker run --name pathshala-db -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=pathshala -p 5432:5432 -d postgres:15
       ```

3. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

## Step-by-Step Setup

### 1. Download the Project

```bash
# Clone or download the project from Replit
# If you have the Replit repository URL:
git clone <your-replit-repo-url> pathshala-saathi
cd pathshala-saathi

# Or download and extract the ZIP file from Replit
```

### 2. Install Dependencies

```bash
# Install all project dependencies
npm install
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL container
docker run --name pathshala-db \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=pathshala \
  -e POSTGRES_USER=postgres \
  -p 5432:5432 \
  -d postgres:15

# Wait for container to start (about 10-15 seconds)
docker logs pathshala-db
```

#### Option B: Using Local PostgreSQL
```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database and user
CREATE DATABASE pathshala;
CREATE USER pathshala_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE pathshala TO pathshala_user;
\q
```

### 4. Environment Configuration

Create a `.env` file in the project root:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file with your database configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/pathshala
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=pathshala

# Application Configuration
NODE_ENV=development
PORT=5000

# Session Configuration (generate a random string)
SESSION_SECRET=your-super-secret-session-key-here
```

### 5. Database Migration

```bash
# Push the database schema
npm run db:push

# This will create all necessary tables:
# - students, teachers, courses
# - marks, attendance, assignments
# - users, notifications, sessions
```

### 6. Start the Application

```bash
# Development mode (with hot reload)
npm run dev

# The application will start on:
# - Frontend: http://localhost:5000
# - Backend API: http://localhost:5000/api
```

### 7. Access the Application

1. Open your browser and go to: `http://localhost:5000`
2. You'll see the Pathshala Saathi login page
3. Use these demo credentials:

**Admin Login:**
- Username: `admin`
- Password: `admin123`
- Role: Admin

**Teacher Login:**
- Username: `teacher`
- Password: `teacher123`  
- Role: Teacher

**Student Login:**
- Username: `student`
- Password: `student123`
- Role: Student

## Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npm run db:push

# Generate database migrations
npm run db:generate

# Run TypeScript type checking
npm run type-check
```

## Project Structure

```
pathshala-saathi/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                # Express.js backend
│   ├── db.ts             # Database connection
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database operations
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts        # Database schema definitions
├── package.json         # Dependencies and scripts
├── drizzle.config.ts    # Database configuration
├── vite.config.ts       # Frontend build configuration
└── tsconfig.json        # TypeScript configuration
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check your DATABASE_URL in `.env`
   - Verify database credentials

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Or kill the process using the port: `lsof -i :5000` then `kill -9 <PID>`

3. **Dependencies Issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

4. **Build Errors**
   - Run `npm run type-check` to see TypeScript errors
   - Ensure all environment variables are set

### Database Reset

If you need to reset the database:

```bash
# Using Docker
docker stop pathshala-db
docker rm pathshala-db
# Then start a new container as shown in step 3

# Using Local PostgreSQL
dropdb pathshala
createdb pathshala
npm run db:push
```

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Use a production PostgreSQL database
3. Build the application: `npm run build`
4. Start with: `npm start`
5. Consider using PM2 for process management: `npm install -g pm2`

## Additional Features

- **Multi-role Authentication**: Admin, Teacher, and Student roles
- **Student Management**: Add, edit, delete, and view student records
- **Teacher Panel**: Manage assignments, attendance, and courses
- **Analytics Dashboard**: View performance metrics and statistics
- **Notification System**: Real-time notifications for users
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Support

If you encounter any issues during setup:

1. Check the console for error messages
2. Verify all prerequisites are installed correctly
3. Ensure database is running and accessible
4. Check that all environment variables are set properly

The application includes comprehensive error handling and logging to help diagnose issues.