# AI Smart Inbox for Invoice Collection — Product Requirements Document

## 1. Problem Framing

### The Pain Point

**After an invoice is sent, customer messages about payments — questions, promises, concerns — get buried in a busy Pro's inbox. Pros miss critical follow-ups because they can't distinguish high-priority payment conversations from routine scheduling chatter.**

This isn't a payment methods problem (Housecall Pro already supports cards, ACH, financing, BNPL, tap-to-pay). It's a **communication and follow-through problem.** The tools to pay exist. The conversation that gets customers to pay does not.

### Why This Problem

- **60% of small business owners avoid confronting customers** about delinquent bills for fear of damaging the relationship (Old National Bank, 2025).
- **56% of small businesses are owed money** from unpaid invoices, averaging **$17,500 per business** (QuickBooks 2025 Late Payments Report).
- Invoices at **30 days past due have 94% collection probability**; at **90 days, only 74%**; at **6 months, 50%** (Commercial Collection Agency Association). Every day of silence costs money.
- **SMS-delivered invoices are paid 32-40% faster** than email-only (Podium/Broadly data), yet HCP's automated reminders are email-only.
- **One reminder increases payment likelihood by ~50%** (Xero). AI-generated reminders get paid **5 days faster** (QuickBooks 2025).
- Dispute over work scope/pricing is the **#1 reason for non-payment** in home services (SCORE/SBA).

### Target Personas

#### Persona 1: "Mike" — The Solo Plumber
- **Profile**: 38, one-man plumbing business, 4-6 jobs/day, ~$180K/year revenue.
- **Day-to-day**: On job sites all day. Does "office work" (invoicing, messages) from his kitchen table at night.
- **Invoice struggle**: Has ~$12K in unpaid invoices. Sends one manual follow-up, then drops it. Hates feeling like a bill collector. Turned off automated reminders after a good customer got annoyed.
- **Message overload**: Gets 15-20 customer texts/day through HCP. Payment-related messages get lost in scheduling chatter. A customer saying "I'll pay Friday" at 2pm gets buried under appointment confirmations.

#### Persona 2: "Maria" — The Growing Cleaning Company Owner
- **Profile**: 42, 12-employee cleaning company, ~$450K/year revenue.
- **Day-to-day**: Splits time between field and office. Office helper sends invoices and handles basic admin.
- **Invoice struggle**: 80-120 jobs/month, 15-25% of invoices overdue at any time (~$8K-15K). Office helper can't answer billing questions — escalates to Maria, who's busy. Property manager clients need specific formatting, kick back invoices, creating limbo.
- **Message overload**: Multiple team members see inbox messages but nobody "owns" the follow-up. Customer questions sit unanswered for days because everyone assumes someone else handled it.

#### Persona 3: "Jesse" — The HVAC Technician-Owner
- **Profile**: 51, 4-person HVAC company, ~$600K/year revenue. High-ticket jobs ($2K-8K).
- **Day-to-day**: Still does installs himself. Does estimates evenings, invoices on weekends.
- **Invoice struggle**: $35K in outstanding receivables. Customers hesitate on big invoices, ask questions about pricing differences from estimates. Only Jesse can explain the technical work — he becomes the bottleneck. Financing (Wisetack) exists but isn't re-offered when a customer is overdue and struggling to pay.
- **Message overload**: Critical questions like "why is this $800 more than the estimate?" sit for 2-3 days because Jesse is on a roof. By the time he responds, the customer's frustration has hardened.

### What "Good" Looks Like

- Pro opens their inbox and **immediately sees the 2-3 most important payment-related actions** — no hunting.
- Each action has an **AI-drafted message ready to send**, grounded in actual conversation context and invoice details.
- Pro can **see WHY** the AI recommended this action (source messages, reasoning chain).
- Pro can **send as-is or edit** the draft — they stay in control.
- Customers get **timely, helpful responses** about their invoices within hours, not days.
- Average days-to-payment **decreases**. The aging invoice tail **shortens**.
- Pro never has to make an uncomfortable "where's my money?" phone call.

### What Failure Looks Like

- AI surfaces **irrelevant or low-confidence actions** — noise instead of signal.
- Drafted messages are **inaccurate** (wrong amounts, wrong customer) or **tone-deaf**.
- Pro **loses trust** and ignores the AI recommendations entirely.
- The feature **overlaps with existing HCP automated reminders**, creating confusion.
- Customers receive responses that feel **robotic or impersonal**.
- Pro feels they've **lost control** of their customer relationships.

---

## 2. Solution Design

### Approach: AI Smart Inbox

Enhance the existing HCP messaging platform with an intelligent layer that surfaces **high-priority, payment-related actions** as cards on top of the inbox. Each card represents an AI-identified opportunity to move an invoice toward payment.

### How It Works

#### Action Cards (Top of Inbox)
Horizontally scrollable cards appear above the conversation list. Each card represents a high-confidence AI recommendation based on real conversation analysis:

1. **Payment Promise Follow-ups** — Customer said "I'll pay by [date/time]" and that deadline has passed. AI drafts a friendly, specific follow-up referencing the promise. Supports granular timing: "end of day", "this Friday", "next week."

2. **Invoice Question Responses** — Customer asked about a specific charge. AI drafts an explanation using invoice line-item details, job context, and patterns from similar past questions (e.g., "What's the float charge?" is a common flooring question). Only surfaces when AI confidence is high.

3. **Invoice Summaries** — When a new invoice is generated, AI drafts a customer-friendly summary highlighting key line items, total, and payment link — warmer and more informative than the raw invoice notification.

4. **Payment Plan Suggestions** — Customer expressed financial difficulty ("I can't pay this all at once"). AI drafts a response acknowledging their concern and presenting available options (financing, installment plans).

#### In-Conversation AI Drafts
When a Pro opens a conversation that has an AI recommendation, the draft appears at the bottom of the chat thread, ready to edit or send. Only shown when AI confidence exceeds the threshold.

#### AI Reasoning ("How AI came up with this")
Every action card and in-conversation draft has a "See reasoning" button that opens a panel showing:
- The **specific messages** the AI used as context (highlighted with timestamps)
- The AI's **reasoning chain** explaining why this action was recommended
- The **confidence level** of the recommendation

This builds trust through transparency — the Pro can verify the AI "did its homework."

### What AI Does vs. What the Human Does

| AI Does | Human Does |
|---------|-----------|
| Scans conversations for payment-related signals | Decides whether to send, edit, or dismiss |
| Identifies follow-up timing based on promises | Makes judgment calls on complex disputes |
| Drafts contextual, personalized responses | Approves every outbound message |
| Surfaces invoice details relevant to questions | Negotiates payment plans |
| Ranks actions by priority and confidence | Owns the customer relationship |

**Key principle**: AI is the drafting assistant. The Pro is the decision-maker. No message is ever sent without explicit Pro approval.

### Non-AI Alternative Considered

A **rule-based follow-up system** could handle some of these cases:
- Regex patterns to detect payment promises ("pay" + date keywords)
- Template responses for common invoice questions
- Scheduled reminders based on invoice age

**Why AI is better:**
- Customer messages are **unstructured natural language**: "I'll get you that money Friday", "paying end of day", "can I settle up next week?" all mean the same thing but require NLU to parse.
- Drafting responses requires **understanding context**: the specific charge being questioned, the customer's tone, the invoice details, and similar past interactions.
- The **FAQ/embedding approach** — finding similar past questions to draft answers — is inherently a semantic search task that rule-based systems can't do.
- A rule-based system would need hundreds of rules and still miss edge cases. AI generalizes from context.

---

## 3. Trust and Failure

### When the System is Wrong or Uncertain

**Below-threshold actions are never shown.** If the AI can't confidently identify the action type, understand the customer's intent, or draft an accurate response, it stays silent. Silence is better than noise — surfacing a bad recommendation erodes trust faster than surfacing nothing.

**Every draft is reviewable before sending.** The Pro sees:
1. The drafted message text
2. A "See reasoning" button showing the AI's logic and source messages
3. Edit and Send buttons (edit always available)
4. A Dismiss button to remove the card

**Factual grounding.** AI drafts reference specific invoice line items, amounts, and dates from structured data — not hallucinated. If the AI references a charge, the reasoning panel shows exactly which invoice line item it's referencing.

**Graceful degradation.** If the AI can't generate a helpful draft (ambiguous question, insufficient context), the action card can still surface the conversation as "needs attention" without proposing a response, letting the Pro handle it manually.

### How Trust Builds Over Time

| Phase | Behavior | Pro Experience |
|-------|----------|---------------|
| **Phase 1 (MVP)** | All drafts require manual review and send | Pro learns what the AI can do, builds confidence |
| **Phase 2** | Pro can enable "auto-send" for specific action types (e.g., invoice summaries) | Proven track record earns automation rights |
| **Phase 3** | Fully autonomous follow-ups for routine cases, with Pro notification | AI operates independently where trust is established |

The MVP (this prototype) is **Phase 1 only** — full Pro control, zero autonomy.

---

## 4. Measurement

### Outcome Metrics (Does this move the business needle?)

| Metric | Definition | Target |
|--------|-----------|--------|
| **Days-to-payment** | Average days from invoice sent → payment received | Decrease by 20%+ |
| **Response rate** | % of customer payment messages that get a Pro response within 24h | Increase from ~40% → 80%+ |
| **30-day collection rate** | % of invoices paid within 30 days of sending | Increase by 15%+ |
| **Revenue recovered** | $ amount of invoices paid after AI-assisted follow-up | Track absolute $ |
| **Pro time saved** | Minutes/week Pro spends on payment-related messaging | Decrease by 50%+ |

### AI Quality Metrics (Is the AI doing a good job?)

| Metric | Definition | Quality Bar |
|--------|-----------|-------------|
| **Draft send rate** | % of AI drafts sent (as-is or edited) vs. dismissed | > 70% |
| **Draft acceptance rate** | % of AI drafts sent without any editing | > 50% |
| **Edit rate** | % of drafts edited before sending | 20-40% (healthy range) |
| **Dismissal rate** | % of action cards dismissed without sending | < 20% |
| **Reasoning view rate** | % of actions where Pro clicks "See reasoning" | Track (expect higher early, declining as trust builds) |
| **Factual accuracy** | % of drafts with correct invoice amounts, dates, line items | 100% (hard requirement) |

### Quality Bar Before Shipping

- **Draft send rate > 70%** — most drafts are relevant enough to act on
- **Dismissal rate < 20%** — the AI isn't spamming irrelevant actions
- **Zero factual errors** — amounts, dates, and line items must always be correct
- **Pro NPS on AI feature > 30** — Pros find it genuinely helpful
- **No customer complaints** about AI-generated message quality or tone

---

## 5. Prototype Scope (MVP)

### In Scope
- Web-based prototype with iPhone mockup frame
- HCP-style messaging UI with pre-populated mock conversations
- AI action cards (payment promise follow-ups, invoice questions, invoice summaries, payment plan suggestions)
- Live AI draft generation via OpenAI API
- AI reasoning panel showing source messages and logic
- Edit and send functionality for drafts
- 6 mock customer conversations demonstrating different scenarios
- Realistic mock invoice data matching HCP invoice templates

### Out of Scope
- Actual payment processing
- Real HCP API integration
- Authentication / multi-user support
- Overdue nudge reminders (overlaps with existing HCP automated email reminders)
- Auto-sending (all drafts require Pro approval)
- Push notifications
- Persistent data / database

### Tech Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express (OpenAI API proxy)
- **AI**: OpenAI GPT-5.4 via Responses API (reasoning: medium, structured output via Zod)
- **Styling**: Plain CSS (iOS-inspired design system)
- **Data**: In-memory mock data (JSON)

### Demo Flow
1. Pro opens the app → sees inbox with 5-6 customer conversations
2. At the top: 4 AI action cards (payment follow-up, invoice question, invoice summary, payment plan)
3. Pro taps an action card → sees AI-drafted message → taps "See reasoning" → sees source messages
4. Pro edits the draft or sends as-is
5. Pro taps into a conversation → sees chat thread → AI suggested reply at bottom
6. One conversation (Rachel) has no AI suggestion → demonstrates selectivity
