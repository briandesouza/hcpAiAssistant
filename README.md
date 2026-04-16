# HouseCall Pro AI Smart Inbox

An AI-powered smart inbox prototype for home service professionals. Surfaces payment-related customer conversations with AI-drafted responses, rendered inside an iPhone mockup frame.

Built as an MVP to demonstrate how AI can help small businesses (like flooring contractors) manage invoices, payment follow-ups, and customer questions faster.

## Tech Stack

- **Frontend**: React 18 + Vite — single-page app with iOS-inspired design
- **Backend**: Express — REST API with in-memory mock data
- **AI**: OpenAI GPT via structured output (Zod schemas) with per-action-type system prompts, plus Anthropic Claude integration

## Getting Started

```bash
# Install dependencies
npm install

# Add your OpenAI API key
cp .env.example .env  # then edit .env with your key

# Start dev server (frontend + backend)
npm run dev
```

The app runs at `http://localhost:5173` with the API on port 3001 (proxied by Vite).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run client` | Vite dev server only |
| `npm run server` | Express API server only |
| `npm run build` | Production build |

## How It Works

The inbox shows a list of customer conversations alongside horizontally scrollable **AI action cards** that flag items needing attention. Tapping into a conversation reveals the chat thread with an inline AI-drafted response that the pro can edit and send.

**AI Action Types:**
- **Payment Follow-up** — customer promised to pay but hasn't
- **Invoice Question** — customer questioning a line item
- **Invoice Summary** — proactive breakdown of a newly sent invoice
- **Payment Plan** — customer can't pay full amount at once

Each action type uses a dedicated system prompt to generate contextual, professional draft responses. An AI reasoning modal shows the draft's confidence score and source messages.

## Project Structure

```
src/                  # React frontend
  App.jsx             # All views (Inbox, Conversation, AI Reasoning Modal)
  App.css             # iOS-inspired styling with CSS variables
  components/
    PhoneFrame.jsx    # iPhone chrome wrapper
server/
  index.js            # Express API endpoints
  mockData.js         # 6 hardcoded conversations with relative timestamps
  openai.js           # OpenAI integration with structured output
docs/
  PRD.md              # Product requirements document
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI draft generation |
| `PORT` | No | API server port (default: 3001) |
