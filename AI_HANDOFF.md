# Grooming OS - Project Handoff Document

This document is designed to provide context, architectural overview, and rules for AI coding assistants (like GitHub Copilot, Claude Code, or Cursor) working on the Grooming OS project.

## 1. Project Overview
**Grooming OS** is an AI-powered personal stylist web application. It digitizes a user's wardrobe, analyzes their body/face profiles, and generates personalized styling and grooming recommendations in seconds. The platform leverages Generative AI to understand fashion context, and relies on a durable execution engine for long-running AI workflows.

## 2. Technology Stack & Key Dependencies
- **Core Framework**: Next.js (Version 16.2.6) using the **App Router**. React 19.
- **Language**: TypeScript (`tsconfig.json` enabled).
- **Database & Authentication**: Supabase (PostgreSQL). Employs Row Level Security (RLS), and pgvector for AI embeddings.
- **AI & Orchestration**: 
  - OpenAI (for reasoning, parsing, and styling suggestions)
  - Replicate (for image processing/generation workflows)
  - Temporal (for robust, durable workflow orchestration of AI tasks)
  - Vercel AI SDK (`ai`, `@ai-sdk/openai`)
- **Styling**: Vanilla CSS & CSS Modules (`.module.css`). *Note: TailwindCSS is not used.*
- **Utilities**: `zod` for schema validation, `sonner` for toast notifications, `react-easy-crop` for image handling.

## 3. Directory Structure
The repository is located at `e:\grooming-os` (Windows). Key directories include:
- `src/app/`: The Next.js App Router structure.
  - `(auth)/`: Authentication and onboarding flows.
  - `(dashboard)/`: The main authenticated app surface (includes `/home`, `/wardrobe`, `/groom`, `/style`, `/profile`).
  - `api/`: Backend API routes for webhooks and initiating analysis tasks (e.g., `/api/analyze`, `/api/groom`, `/api/style`).
- `src/components/`: Reusable React components, organized by feature domains (`grooming/`, `styling/`, `shared/`).
- `src/temporal/`: Contains the Temporal background execution logic (`activities.ts`, `workflows.ts`, `worker.ts`).
- `supabase/migrations/`: SQL migration files defining the schema, RLS policies, triggers, and vector tables.
- `public/`: Static assets (fonts, icons, etc).

## 4. Key Architectural Patterns
- **Database Schema**: 
  - `users`, `body_profiles`, `face_profiles`, `style_preferences` (User Data).
  - `wardrobe_items`, `outfits`, `outfit_items` (Clothing & Styling).
  - `marketplace_items`, `marketplace_recommendations` (Commerce Integrations).
  - Data access is heavily protected by Supabase RLS.
- **Background Jobs**: Heavy AI tasks (like processing images, tagging wardrobe items, generating looks) are offloaded to Temporal to prevent HTTP timeouts on Next.js edge/serverless functions.

## 5. Critical Directives for AI Agents
When contributing code to this project, adhere to the following rules:

> [!WARNING]
> **Next.js Conventions**
> This project uses Next.js 16 (App Router). Be aware of the distinction between Server Components and Client Components (`"use client"`). Follow modern Next.js caching and data fetching best practices.

> [!IMPORTANT]
> **Styling & Aesthetics**
> We use standard CSS and CSS Modules. **Do NOT use TailwindCSS**. The design must be premium, using modern typography, glassmorphism, dynamic animations, and vibrant but curated color palettes. Ensure new components look highly professional.

> [!NOTE]
> **Iconography**
> The project is currently migrating from emoji-based icons to professional, vector-based icons (e.g., `lucide-react` or similar SVG libraries). Avoid adding new emojis for core UI elements; use vector icons instead.

## 6. Scripts & Environment
- **Development Server**: `npm run dev`
- **Temporal Worker**: `npm run worker` (runs `tsx src/temporal/worker.ts`)
- **Linting**: `npm run lint`

**Required Environment Variables (`.env.local`)**:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`, `REPLICATE_API_TOKEN`
- `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, `TEMPORAL_API_KEY`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
