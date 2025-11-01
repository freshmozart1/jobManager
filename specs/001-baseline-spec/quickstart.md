# Quickstart: Application Manager Baseline

Date: 2025-11-01  
Branch: 001-baseline-spec

## Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)
- MongoDB connection string

## Setup

1. Install dependencies
   
   ```bash
   npm install
   ```

2. Configure environment
   
   - DATABASE_NAME
   - (Optional) OPENAI_API_KEY

3. Run the dev server
   
   ```bash
   npm run dev
   ```

4. Access the app
   
   - http://localhost:3000

## Feature Workflows

- Run filtering: POST /api/filter or use the UI action in jobs list/detail when available.
- Generate documents: open a job, trigger generation, then download artifacts.
- Mark applied & notes: update status and add notes in job detail.

## Notes

- Long-running operations are asynchronous. Check progress indicators and logs.
- Agent runs are traced with IDs; inputs/outputs and prompt versions are recorded.
