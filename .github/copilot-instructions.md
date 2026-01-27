# Copilot Instructions for Job Manager

This is a Next.js 15 application for managing and displaying job listings, built with React 19, TypeScript, and MongoDB.

## Project Overview

Job Manager is a web application that scrapes, stores, and displays job listings. It provides a search interface for users to find jobs and uses OpenAI's API for intelligent filtering and matching.

## Project Structure

```
Note: node_modules folders are excluded from this listing.

/.github/ — GitHub configuration and automation for this repository.
  /.github/copilot-instructions.md — Repository-specific guidance for GitHub Copilot.
  /.github/prompts/ — Placeholder directory for GitHub prompts (currently empty).
  /.github/workflows/ — GitHub Actions workflows used for CI/CD automation.
    /.github/workflows/playwright.yml — Runs Playwright tests in CI.

/.vscode/ — VS Code workspace configuration for consistent local tooling.
  /.vscode/launch.json — Debugger launch configurations for VS Code.
  /.vscode/mcp.json — MCP server configuration used by editor tooling.
  /.vscode/settings.json — Workspace settings for VS Code.

/.git/ — Local Git metadata for the working copy (contents not enumerated).
/.gitattributes — Git attribute rules for normalization and tooling behavior.
/.gitignore — Ignore rules for generated files and local developer artifacts.
/.DS_Store — macOS Finder metadata file (should not be committed).
/.env — Local environment variables for development (typically uncommitted).
/.env.example — Example environment variable template for developers.

/.next/ — Next.js build output directory created during development/build.

/app/ — Next.js App Router pages, layouts, and route handlers.
  /app/favicon.ico — Site favicon served by Next.js.
  /app/globals.css — Global CSS and Tailwind base styles.
  /app/layout.tsx — Root layout shared across all routes.
  /app/page.tsx — Home page route component.
  /app/api/ — Next.js route handlers for server-side APIs.
    /app/api/.DS_Store — macOS Finder metadata file inside API routes (should not be committed).
    /app/api/jobs/ — Job-related API routes.
      /app/api/jobs/.DS_Store — macOS Finder metadata file inside the jobs API folder (should not be committed).
      /app/api/jobs/route.ts — Collection-level jobs API endpoint (listing/filtering).
      /app/api/jobs/scrape/ — Job scraping API endpoint(s).
        /app/api/jobs/scrape/route.ts — Triggers or manages job scraping into storage.
      /app/api/jobs/[id]/ — Per-job API endpoints keyed by job id.
        /app/api/jobs/[id]/.DS_Store — macOS Finder metadata file inside the job-id API folder (should not be committed).
        /app/api/jobs/[id]/route.ts — Job detail API endpoint for a specific id.
        /app/api/jobs/[id]/apply/ — API endpoint(s) for applying to a job.
          /app/api/jobs/[id]/apply/route.ts — Handles job application actions for a specific id.
        /app/api/jobs/[id]/artifacts/ — API endpoint(s) for job-related artifacts.
          /app/api/jobs/[id]/artifacts/route.ts — Handles artifact storage/retrieval for a job id.
    /app/api/personal/ — Personal profile-related API routes.
      /app/api/personal/route.ts — CRUD API endpoint for personal profile data.
  /app/jobs/ — Job pages and nested job flows.
    /app/jobs/[id]/ — Job detail pages keyed by job id.
      /app/jobs/[id]/page.tsx — Job details page component.
      /app/jobs/[id]/write/ — Job application writing flows for a specific job.
        /app/jobs/[id]/write/cover/ — Cover letter writing route.
          /app/jobs/[id]/write/cover/page.tsx — Cover letter editor page for a job.
        /app/jobs/[id]/write/cv/ — CV tailoring route.
          /app/jobs/[id]/write/cv/page.tsx — CV editor page for a job.
  /app/personal/ — UI routes for personal data and profile management.
    /app/personal/AppPersonalPage.tsx — Main personal page component used by the personal route.
    /app/personal/layout.tsx — Layout wrapper for personal pages.
    /app/personal/page.tsx — Personal page route component.
  /app/playground/ — Local playground routes for experimenting in the app.
    /app/playground/page.tsx — Playground page component.
  /app/search/ — Search UI routes for browsing and filtering jobs.
    /app/search/layout.tsx — Layout wrapper for the search experience.
    /app/search/page.tsx — Search page route component.

/components/ — Shared React components used across routes and features.
  /components/agents/ — Agent-related components and helpers (currently empty).
  /components/ui/ — Reusable UI components (largely shadcn/ui-style building blocks).
    /components/ui/AppCvEditor/ — CV editor feature components.
      /components/ui/AppCvEditor/AppCvEditor.tsx — Main CV editor component.
      /components/ui/AppCvEditor/appCvEditorPalette.tsx — Palette UI for selecting CV blocks/options.
      /components/ui/AppCvEditor/appCvEditorPreview.tsx — Preview rendering for CV output.
      /components/ui/AppCvEditor/appCvEditorSlot.tsx — Slot component for arranging CV sections.
      /components/ui/AppCvEditor/appCvEditorToolbar.tsx — Toolbar actions for the CV editor.
      /components/ui/AppCvEditor/index.tsx — Barrel export for CV editor components.
      /components/ui/AppCvEditor/types.d.ts — Local type declarations for the CV editor.
    /components/ui/AppEligibilityEditor/ — Eligibility and work authorization editor components.
      /components/ui/AppEligibilityEditor/appEligibilityEditor.tsx — Editor UI for eligibility details.
      /components/ui/AppEligibilityEditor/appWorkAuthorizationList.tsx — UI list for work authorization entries.
      /components/ui/AppEligibilityEditor/index.ts — Barrel export for eligibility editor components.
    /components/ui/AppExclusionsEditor/ — Editor UI for exclusions/constraints in matching.
      /components/ui/AppExclusionsEditor/appExclusionsEditor.tsx — Exclusions editor component.
      /components/ui/AppExclusionsEditor/index.ts — Barrel export for exclusions editor components.
    /components/ui/appItemEditor/ — Generic item editor primitives with undo support.
      /components/ui/appItemEditor/AppItemEditor.tsx — Main generic item editor component.
      /components/ui/appItemEditor/AppItemUndoBanner.tsx — Undo banner UI for item edits.
      /components/ui/appItemEditor/appAddItemButton.tsx — Button component for adding items.
      /components/ui/appItemEditor/appEditableCard.tsx — Editable card wrapper for item forms.
      /components/ui/appItemEditor/appGenericCard.tsx — Generic card UI for item display.
      /components/ui/appItemEditor/appGenericCardContainer.tsx — Container layout for generic item cards.
      /components/ui/appItemEditor/appGenericItemForm.tsx — Form scaffold for editing generic items.
      /components/ui/appItemEditor/index.ts — Barrel export for item editor modules.
      /components/ui/appItemEditor/types.ts — Shared types for the item editor feature.
      /components/ui/appItemEditor/useItemEditor.ts — Hook for managing item editor state.
      /components/ui/appItemEditor/useUndo.ts — Hook for undo/redo behavior in editors.
    /components/ui/appRightPanel/ — Right-side panel layout and state management.
      /components/ui/appRightPanel/appRightPanel.tsx — Right panel UI component.
      /components/ui/appRightPanel/index.ts — Barrel export for right panel modules.
      /components/ui/appRightPanel/useAppRightPanel.tsx — Hook for controlling right panel behavior.
    /components/ui/appSidebar/ — App sidebar UI and state management.
      /components/ui/appSidebar/appMobileHeader.tsx — Mobile header UI paired with the sidebar.
      /components/ui/appSidebar/appSidebar.tsx — Sidebar component for navigation/layout.
      /components/ui/appSidebar/appSidebarContentProvider.tsx — Context provider for sidebar content.
      /components/ui/appSidebar/index.ts — Barrel export for sidebar modules.
      /components/ui/appSidebar/useAppSidebarContent.tsx — Hook for generating sidebar content.
    /components/ui/appApplicantFields.tsx — Form fields for applicant/personal data entry.
    /components/ui/appCareerGoalsEditor.tsx — Editor UI for capturing career goals.
    /components/ui/appCategoryCombobox.tsx — Category selection combobox component.
    /components/ui/appCertificationEditor.tsx — Editor UI for certifications.
    /components/ui/appCollapsibleCard.tsx — Collapsible card container component.
    /components/ui/appCoverLetterForm.tsx — Form UI for generating/editing cover letters.
    /components/ui/appDatePicker.tsx — Date picker component used in forms.
    /components/ui/appEducationEditor.tsx — Editor UI for education history.
    /components/ui/appExperienceEditor.tsx — Editor UI for work experience history.
    /components/ui/appHome.tsx — Home screen UI composition component.
    /components/ui/appJobArtifactEditor.tsx — Editor UI for job-related artifacts.
    /components/ui/appJobsTable.tsx — Jobs table component for listing and sorting jobs.
    /components/ui/appLanguagesEditor.tsx — Editor UI for language skills.
    /components/ui/appMonthYearPicker.tsx — Month/year picker for date-range inputs.
    /components/ui/appMotivationsEditor.tsx — Editor UI for motivations/preferences.
    /components/ui/avatar.tsx — Avatar UI primitive.
    /components/ui/badge.tsx — Badge UI primitive.
    /components/ui/badgeInput.tsx — Input component for managing badge-like values.
    /components/ui/button.tsx — Button UI primitive.
    /components/ui/calendar.tsx — Calendar UI primitive.
    /components/ui/card.tsx — Card UI primitive.
    /components/ui/checkbox.tsx — Checkbox UI primitive.
    /components/ui/command.tsx — Command palette UI primitive.
    /components/ui/dropdownMenu.tsx — Dropdown menu UI primitive.
    /components/ui/input.tsx — Text input UI primitive.
    /components/ui/inputGroup.tsx — Grouped input wrapper for consistent layouts.
    /components/ui/label.tsx — Label UI primitive for form fields.
    /components/ui/pagination.tsx — Pagination UI controls.
    /components/ui/popover.tsx — Popover UI primitive.
    /components/ui/select.tsx — Select UI primitive.
    /components/ui/separator.tsx — Separator UI primitive.
    /components/ui/sheet.tsx — Sheet/drawer UI primitive.
    /components/ui/sidebar.tsx — Sidebar primitives used by the app sidebar feature.
    /components/ui/skeleton.tsx — Skeleton/loading placeholder components.
    /components/ui/textarea.tsx — Textarea UI primitive.
    /components/ui/tooltip.tsx — Tooltip UI primitive.

/hooks/ — Reusable React hooks shared across the app.
  /hooks/use-mobile.ts — Hook for detecting mobile breakpoints/layout behavior.
  /hooks/useDebounce.ts — Hook for debouncing rapidly changing values.
  /hooks/useFilterTableColumns.tsx — Hook for managing filterable table column state.
  /hooks/useLoadJob.tsx — Hook for loading a job by id and managing loading state.
  /hooks/usePersonal.ts — Hook for loading and updating personal profile data.
  /hooks/useSidebarBack.tsx — Hook for managing sidebar back navigation behavior.
  /hooks/useToUrl.ts — Hook for building URL query strings and navigation targets.
  /hooks/useUniqueColor.ts — Hook for generating stable unique colors for UI elements.

/lib/ — Shared utilities, data access, and server-side helpers.
  /lib/api.ts — API response helpers (standardized JSON errors).
  /lib/constants.ts — Shared constants used across features.
  /lib/cors.ts — CORS header helpers for API routes.
  /lib/countries.ts — Country lookup utilities and related helpers.
  /lib/cvModel.ts — CV domain model helpers and transformations.
  /lib/date.ts — Date formatting/parsing helpers.
  /lib/errors.ts — Custom error types and error classification helpers.
  /lib/mongodb.ts — MongoDB connection singleton and database access utilities.
  /lib/personal.ts — Personal profile model helpers and persistence logic.
  /lib/utils.ts — General utility functions (including cn() class merging).
  /lib/data/ — Static JSON datasets used by the app.
    /lib/data/countries.en.json — English country dataset used for selects/autocomplete.

/public/ — Static public assets served from the site root.
  /public/file.svg — Static icon asset used by the UI.
  /public/globe.svg — Static icon asset used by the UI.
  /public/next.svg — Static Next.js logo asset.
  /public/vercel.svg — Static Vercel logo asset.
  /public/window.svg — Static icon asset used by the UI.

/tests/ — Playwright tests and shared test helpers.
  /tests/helpers.ts — Shared helpers/utilities for Playwright tests.
  /tests/contract/ — Contract/API-level Playwright tests for backend routes.
    /tests/contract/personal.api.contract.spec.ts — Contract tests for the personal API endpoint.
    /tests/contract/scrape.api.contract.spec.ts — Contract tests for the scraping/jobs APIs.
  /tests/e2e/ — End-to-end Playwright tests for the UI.
    /tests/e2e/personal.e2e.spec.ts — E2E coverage for the personal profile flow.

/playwright-report/ — Generated Playwright HTML report output.
  /playwright-report/index.html — Entry point for the last generated Playwright report.

/playwright-reporters/ — Custom Playwright reporter implementations.
  /playwright-reporters/disableHtmlHintReporter.ts — Reporter that tweaks HTML reporter output behavior.

/test-results/ — Output directory for Playwright test artifacts (currently empty).

/components.json — shadcn/ui component configuration for code generation.
/eslint.config.mjs — ESLint configuration for the project.
/next-env.d.ts — Next.js TypeScript environment declarations (auto-managed).
/next.config.ts — Next.js configuration for builds and runtime behavior.
/package-lock.json — NPM lockfile pinning exact dependency versions.
/package.json — NPM package manifest with scripts and dependencies.
/playwright.config.ts — Playwright config for end-to-end tests.
/playwright.contract.config.ts — Playwright config for API contract tests.
/postcss.config.mjs — PostCSS configuration for Tailwind/CSS processing.
/README.md — Project readme with basic setup and Next.js links.
/tsconfig.json — TypeScript compiler configuration.
/tsconfig.tsbuildinfo — TypeScript incremental build cache (typically uncommitted).
/types.d.ts — Global TypeScript types and ambient declarations.
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

### Error Handling
- Use custom error classes from `@/lib/errors.ts`
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

- `DATABASE_NAME`: MongoDB database name

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

## Git Workflow

- Make small, focused commits
- Write clear, descriptive commit messages
- Ensure code passes linting before committing
- Test thoroughly before pushing changes

## MCP
- This project is configured to work with the MCP (Model-Controller-Platform) server for enhanced AI-assisted development features. The MCP configuration can be found in `.vscode/mcp.json`.
- Always use the OpenAI developer documentation MCP server if you need to work with the OpenAI API, ChatGPT Apps SDK, Codex, or related docs without me having to explicitly ask.
- Always use the shadcn/ui MCP server when working on UI components or anything in the `/components/ui` directory.
- Always use the Next.js Devtools MCP server when working on Next.js-specific code.