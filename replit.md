# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (`@workspace/integrations-openai-ai-server`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### Anki Card Generator (`artifacts/anki-generator`)
- React + Vite web app at `/`
- Upload files (PDF, TXT) or paste text to generate Anki flashcards via AI
- Browse and manage decks, edit cards inline, export `.apkg` for Anki import
- **Study mode** on deck detail page: flip cards, reveal answer, mark "Got It"/"Still Learning", shuffle, progress bar, completion screen with missed-card review
- PDF extraction in `src/lib/pdf-extraction.ts`: files >20MB skip client and go straight to server; smaller files try embedded text first, then server, then client OCR
- Server upload uses `FormData` multipart (avoids Replit proxy limits on raw binary bodies)
- Safari/iPad compatibility uses a `Promise.withResolvers` polyfill in `src/main.tsx` before loading the app and the legacy PDF.js build
- Direct API fetches use the Vite base path helper in `src/lib/utils.ts` so PDF extraction, explain, and `.apkg` export requests route correctly in the preview/deployed app

### API Server (`artifacts/api-server`)
- Express 5 backend at `/api`
- Routes: `/api/decks`, `/api/cards`, `/api/generate`, `/api/extract-pdf`, `/api/export-apkg`, `/api/healthz`
- AI generation uses `gpt-5.2` model via Replit AI Integrations (env vars: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`)
- The AI client is loaded lazily so missing AI configuration returns a 503 from `/api/generate` instead of crashing the server
- `/api/generate` retries transient AI rate-limit/server failures with backoff, and the frontend pauses briefly between multi-file generations while surfacing per-file error details
- Route `/api/extract-pdf` accepts both `multipart/form-data` (via multer, field name `file`) and raw `application/pdf` body; embedded text → server OCR fallback
- The server runs a safe startup schema initializer from `@workspace/db` before listening, creating/updating `decks` and `cards` if needed for fresh databases
- System dependency `util-linux` (provides `libuuid.so.1`) is required by the `canvas` npm package; installed via Nix
- `canvas` and `tesseract.js` are listed in `pnpm.onlyBuiltDependencies` in the root `package.json` so their native build scripts run

## Database Schema

- `decks` — Deck metadata (id, name, description, parentId FK self-ref, timestamps)
  - `parentId` is nullable; if set, the deck is a sub-deck of the referenced deck
- `cards` — Flashcard data (id, deckId, front, back, tags, image, sourceImage, bbox, cardType, choices, correctIndex, timestamps)
  - `cardType`: `'basic'` (default) or `'mcq'`
  - `choices`: JSON-stringified array of MCQ option strings (only when cardType='mcq')
  - `correctIndex`: 0-based index into `choices` for the correct answer

## AI Visual-Card Generation

- The visual prompt explicitly enumerates qualifying figure categories (charts, tables, radiology, flowcharts, diagrams, photomicrographs, traces, equations) and instructs the model to **skip pages with no real figure** instead of screenshotting them.
- The model must return a `figureType` tag and a TIGHT bbox (3–5% margin); it is forbidden from returning `{0,0,1,1}` or any near-full-page bbox.
- Server-side filter (`MAX_VISUAL_BBOX_AREA = 0.78`, `MAX_VISUAL_BBOX_DIM = 0.92`) drops any card whose bbox covers more than 78 % of the page area or spans >92 % in both width and height — the user does not want full-page screenshots, so those get logged and discarded.
- `cropImage` always crops to the bbox; `CROP_PADDING` is 4 % and `MIN_CROP_DIMENSION` is 12 %.

## AI Text-Card Generation

- Long text is split into ~6000-char chunks with 300-char overlap so dense PDFs are covered exhaustively (no summarising). Each chunk is processed with concurrency 3 and proportional card targets with a density floor.
- The system prompt instructs the model to (1) preserve any existing multiple-choice questions verbatim as MCQ cards (stem in `front`, options in `choices`, 0-based `correctIndex`, explanation in `back`) and (2) emit one atomic basic card per fact for the rest.
- `normalizeCard` validates and normalizes both `basic` and `mcq` card shapes; `serializeCard` parses the JSON `choices` column before sending to the client.
- Frontend Study mode renders MCQ cards as A/B/C/D options the learner can pre-select; on Show Answer the correct option turns green and a wrong selected option turns red. The card list shows an "MCQ" badge.

## Deck Hierarchy

- Decks can have a `parentId` pointing to another deck (one level deep)
- Library shows parent decks as main topics with expandable sub-decks nested below
- "New Deck" and Generate flows have a Main Topic selector to assign `parentId`
- Export uses Anki's `::` convention: sub-deck cards are tagged `Parent::Child`
- Deleting a parent nullifies `parentId` on children (they become standalone)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
