# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cliamax is a medical transcription app for Czech healthcare providers. It captures doctor-patient conversations via real-time speech-to-text (Deepgram), applies AI-powered transcript correction (OpenRouter/GPT), and generates clinical notes in standard formats (SOAP, progress notes, prescriptions, H&P). The entire UI and all LLM prompts are in Czech.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Shadcn/ui (base-nova style), Motion
- **Backend:** Convex (real-time database, queries, mutations, actions)
- **Auth:** Clerk (currently using plain `ConvexProvider`, not `ConvexProviderWithAuth`)
- **External services:** Deepgram (STT), OpenRouter (LLM), Cartesia (TTS)

## Commands

```bash
npm run dev          # Starts Next.js + Convex dev server in parallel
npm run dev:next     # Next.js only (localhost:3000)
npm run dev:convex   # Convex only (localhost:3210)
npm run build        # Production build
npm run lint         # ESLint
```

No test runner is currently configured.

## Architecture

### State Flow

`SessionContainer` is the central orchestrator. It manages a state machine:
**idle** → **recording** → **review** (with a **list** view for saved sessions)

During recording, transcript entries are buffered in React state and flushed to Convex every 5 seconds via `appendTranscript`.

### Key Directories

- `src/components/` — UI components. `SessionContainer.tsx` is the main entry point; `IdleScreen`, `RecordingView`, `ReviewScreen` are the three primary views.
- `src/hooks/` — `use-deepgram.ts` (WebSocket streaming STT), `use-audio-recorder.ts` (Web Audio capture), `use-transcript-correction.ts` (LLM correction batching).
- `src/lib/` — `openrouter.ts` (LLM client), `templates.ts` (clinical note templates with system prompts), `export-docx.ts` (Word doc generation), `vykony-data.ts` (billing codes).
- `src/app/api/` — Next.js route handlers for AI endpoints (`correct-transcript`, `generate-note`, `summarize`, `prescription`), Cartesia token, and billing code search.
- `convex/` — `schema.ts` (single `sessions` table), `sessions.ts` (all CRUD mutations/queries).

### Dual-Layer Transcript Correction

1. **Deepgram** provides word-level confidence scores
2. **LLM** (via `/api/ai/correct-transcript`) batch-corrects low-confidence entries using Czech medical terminology prompts

### Data Model

Single Convex table `sessions` with transcript stored as an array field of `{id, speaker, text, timestamp}` entries. Note: this array pattern may hit Convex's 1MB document limit for very long sessions.

## Convex Development

**Always read `convex/_generated/ai/guidelines.md` before writing Convex code.** Key rules:
- Always include argument validators on all Convex functions
- Use `withIndex()` instead of `.filter()` on queries
- Use `.take(n)` instead of `.collect()` to bound results
- Use `ctx.db.patch()` for partial updates
- Never use `ctx.db` inside actions
- Use `internalQuery`/`internalMutation`/`internalAction` for private functions
- Never add `"use node"` to files that export queries or mutations
- Convex agent skills can be installed via `npx convex ai-files install`

## Next.js Notes

This project uses **Next.js 16** which has breaking changes from earlier versions. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.

## Environment Variables

Required in `.env.local`: `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `OPENROUTER_API_KEY`, `DEEPGRAM_API_KEY`, `CARTESIA_API_KEY`.

## Path Alias

`@/*` resolves to `./src/*` (configured in tsconfig.json).
