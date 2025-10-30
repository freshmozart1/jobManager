# Copilot Instructions for Job Manager

This is a Next.js 15 application for managing and displaying job listings, built with React 19, TypeScript, and MongoDB.

## Project Overview

Job Manager is a web application that scrapes, stores, and displays job listings. It provides a search interface for users to find jobs and uses OpenAI's API for intelligent filtering and matching.

## Technology Stack

- **Framework**: Next.js 15.5.5 (with Turbopack)
- **React**: 19.1.0
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 4 with Tailwind Animate CSS
- **Database**: MongoDB
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/docs) on top of Radix UI primitives (Dialog, Avatar, Separator, Slot, Tooltip)
- **Data Tables**: TanStack React Table
- **AI/ML**: OpenAI API and OpenAI Agents
- **Web Scraping**: Apify Client
- **Utilities**: clsx, class-variance-authority, tailwind-merge, lucide-react

## Project Structure

```
/app                 # Next.js App Router pages and API routes
  /api               # API endpoints
    /jobs            # Job-related endpoints
    /prompts         # AI prompt endpoints
    /filter          # Job filtering endpoints
    /mock            # Mock data endpoints
  /jobs              # Job listing pages
  /search            # Search interface
  layout.tsx         # Root layout
  page.tsx           # Home page
  globals.css        # Global styles

/components          # React components
  /ui                # Reusable UI components

/lib                 # Utility functions and configurations
  mongodb.ts         # MongoDB connection
  utils.ts           # Helper utilities
  cors.ts            # CORS configuration
  errors.ts          # Error definitions

/hooks               # Custom React hooks
/public              # Static assets
/types.d.ts          # Global type definitions
```

## Coding Standards

### TypeScript
- **Strict mode enabled**: Follow strict TypeScript practices
- Use type-safe patterns throughout the codebase
- Define types in `types.d.ts` or colocated with components
- Use `type` over `interface` for object shapes
- Avoid `any` - use `unknown` or proper types instead

### Naming Conventions
- **Files**: Use camelCase for multi-word files (e.g., `jobCard.tsx`) and add 'app' prefix (e.g., `appJobCard.tsx`) to UI components in the `/components` directory
- **Components**: Use PascalCase (e.g., `JobCard`)
- **Functions/Variables**: Use camelCase (e.g., `fetchJobs`, `jobData`)
- **Types**: Use PascalCase (e.g., `Job`, `PersonalInformationContact`)
- **Constants**: Use SCREAMING_SNAKE_CASE for true constants (e.g., `DATABASE_NAME`)

### React & Next.js
- Use functional components with hooks
- Prefer `export default function ComponentName()` for page components
- Use React Server Components by default (Next.js App Router)
- Add `'use client'` directive only when client-side features are needed
- Use Next.js built-in components: `Image`, `Link`, if there are no shadcn/ui equivalents
- Handle async operations properly in Server Components

### Styling
- Use Tailwind CSS utility classes
- Use the `cn()` utility from `@/lib/utils` for conditional class merging
- Follow mobile-first responsive design approach
- Use Tailwind's dark mode utilities for theme support

### API Routes
- Use Next.js 15 App Router conventions (`route.ts` files)
- Export named functions for HTTP methods (GET, POST, OPTIONS, etc.)
- Use `NextResponse` for API responses
- Include CORS headers using `corsHeaders()` from `@/lib/cors`
- Validate environment variables before use
- Handle errors gracefully with proper status codes

### Database
- Use MongoDB with the official driver
- Use the `mongoPromise` singleton from `@/lib/mongodb`
- Always check for `DATABASE_NAME` environment variable
- Use projections to exclude `_id` when appropriate
- Set appropriate timeouts for database operations (e.g., `timeoutMS: 3000`)
- Use the `/api/mock/*` endpoints for generating mock data during development

### Error Handling
- Use custom error classes from `@/lib/errors`
- Always add new error classes in `@/lib/errors.ts` instead of inline errors
- Return proper HTTP status codes and status text
- Handle database connection errors gracefully
- Validate input parameters before processing

## Build and Development

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Starts the development server with Turbopack at http://localhost:3000

### Build
```bash
npm run build
```
Creates optimized production build with Turbopack

### Production Server
```bash
npm start
```
Starts the production server

### Linting
```bash
npm run lint
```
Runs ESLint with Next.js TypeScript configuration

## Environment Variables

Ensure the following environment variables are configured:
- `DATABASE_NAME`: MongoDB database name
- Other environment-specific variables as needed

## Dependencies

### Key Libraries
- `@openai/agents` and `openai`: AI-powered features
- `apify-client`: Web scraping functionality
- `mongodb`: Database driver
- `@tanstack/react-table`: Advanced data tables
- `@radix-ui/*`: Accessible UI primitives
- `lucide-react`: Icon library
- `shadcn`: UI component library

### Development Dependencies
- `eslint` and `eslint-config-next`: Code linting
- `@tailwindcss/postcss`: Tailwind CSS processing
- `typescript`: Type checking
- `shadcn`: UI component library

## Special Notes

- This project uses the Next.js App Router (not Pages Router)
- The application uses Server Components by default
- MongoDB connections are pooled using a singleton pattern
- CORS is configured for cross-origin requests
- The project includes OpenAI integration for intelligent job filtering
- Web scraping is handled through Apify

## Code Quality

- Follow existing patterns in the codebase
- Write clean, readable code with meaningful variable names
- Keep functions focused and single-purpose
- Add comments only when necessary to explain complex logic
- Ensure all TypeScript types are properly defined
- Test changes in development mode before building
- Avoid ```import * as``` when possible; use ```import {}``` syntax
- Call `nextjs_docs` to confirm correct usage of Next.js features when unsure

## Git Workflow

- Make small, focused commits
- Write clear, descriptive commit messages
- Ensure code passes linting before committing
- Test thoroughly before pushing changes
