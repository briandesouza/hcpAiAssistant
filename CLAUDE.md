# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

AI Smart Inbox MVP for HouseCall Pro — a prototype that helps home service professionals manage payment-related customer conversations with AI-drafted responses. Rendered inside an iPhone mockup frame. Uses in-memory mock data (no database). See `docs/PRD.md` for full product context.

## Commands

- `npm run dev` — starts both frontend (Vite, port 5173) and backend (Express, port 3001) via concurrently
- `npm run client` — Vite dev server only
- `npm run server` — Express server only
- `npm run build` — production build via Vite
- No test runner or linter is configured

## Architecture

**Frontend** (React + Vite, `src/`): Single-page app with two views managed by state in `App.jsx`:
- **InboxView** — conversation list + horizontally scrollable AI action cards
- **ConversationView** — chat thread with inline AI draft banner (editable textarea + send)
- **AIReasoningModal** — shows draft reasoning, confidence score, and source messages
- **PhoneFrame** (`src/components/PhoneFrame.jsx`) — iPhone chrome wrapper with dynamic island, status bar, and home indicator

All views are defined inline in `App.jsx` (not separate files). Styling is plain CSS in `App.css` with iOS-inspired design tokens in CSS variables.

**Backend** (Express, `server/`):
- `server/index.js` — REST API endpoints
- `server/mockData.js` — 6 hardcoded conversations with invoices and messages. Timestamps are relative to `Date.now()` so data always appears current. Conv 6 (Rachel Thompson) intentionally has no AI action to demonstrate selectivity.
- `server/openai.js` — OpenAI integration using the Responses API (`openai.responses.parse`) with GPT-5.4, Zod structured output (`AIDraftResponse` schema), and per-action-type system prompts. Falls back to hardcoded drafts on API error.

**API proxy**: Vite proxies `/api` requests to `localhost:3001` (configured in `vite.config.js`).

## Key API Endpoints

- `GET /api/conversations` — list view (messages excluded)
- `GET /api/conversations/:id` — full conversation with messages
- `GET /api/actions` — AI action cards
- `POST /api/ai/draft` — generate AI draft `{ conversationId, actionType }`
- `POST /api/messages/:conversationId` — send message `{ text }`

## AI Action Types

Four action types with dedicated system prompts in `server/openai.js`:
- `payment_followup` — customer promised to pay but hasn't
- `invoice_question` — customer questioning a line item
- `invoice_summary` — proactive breakdown of a newly sent invoice
- `payment_plan` — customer can't pay full amount at once

## Environment

Requires `OPENAI_API_KEY` in `.env`. Server port defaults to 3001 (`PORT` env var).
