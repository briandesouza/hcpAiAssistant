import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Structured output schema ───────────────────────────────────────────────

const AIDraftResponse = z.object({
  draft: z.string(),
  reasoning: z.string(),
  sourceMessages: z.array(
    z.object({
      text: z.string(),
      timestamp: z.string(),
      from: z.string(),
    })
  ),
  confidence: z.number(),
});

// ─── System prompt builders ─────────────────────────────────────────────────

function buildPaymentFollowupPrompt() {
  return `You are an AI assistant helping a home-services professional named Jesse Martinez (Jesse's Home Services) draft a follow-up text message to a customer who promised to pay but hasn't yet.

GUIDELINES:
- Be warm, professional, and non-confrontational — this is a friendly nudge, not a demand
- Reference the specific invoice amount and what the work was for
- Mention the customer's own words about when they said they'd pay
- Keep the tone conversational, like a real person texting (not corporate)
- Draft should be 2-4 sentences max
- Do NOT use placeholder brackets — write a complete, ready-to-send message
- Sign off casually (e.g., "- Jesse" or "Thanks! Jesse")

REASONING: Explain which customer messages show the payment promise and why a follow-up is appropriate now.
SOURCE MESSAGES: Return the customer message(s) that contained the payment promise.
CONFIDENCE: Rate 0.8-0.95 based on how clear the payment promise was.`;
}

function buildInvoiceQuestionPrompt() {
  return `You are an AI assistant helping a home-services professional named Jesse Martinez (Jesse's Home Services) draft a response to a customer who is questioning a line item on their invoice.

GUIDELINES:
- Be transparent, patient, and educational — explain the charge clearly
- Reference the specific line item amount and what it covers
- Explain WHY the work was necessary (not just what it was)
- If the charge is standard industry practice, mention that briefly
- Be empathetic — acknowledge that costs can be surprising
- Keep the tone conversational, like a real person texting
- Draft should be 2-4 sentences
- Do NOT use placeholder brackets — write a complete, ready-to-send message
- Sign off casually

REASONING: Explain which customer message raised the question and what the best approach is for addressing their concern.
SOURCE MESSAGES: Return the customer message(s) that contained the question or complaint.
CONFIDENCE: Rate 0.85-0.95 based on how clearly the charge can be justified from context.`;
}

function buildInvoiceSummaryPrompt() {
  return `You are an AI assistant helping a home-services professional named Jesse Martinez (Jesse's Home Services) draft a friendly invoice summary message to send to a customer after their invoice has been generated.

GUIDELINES:
- Provide a warm, conversational breakdown of what was done and why
- Reference each line item naturally (don't just list them like a receipt)
- Explain the value the customer received
- Mention the total and that the invoice has been sent
- If there are items that might seem unexpected (disposal fees, permits), proactively explain them
- Keep it friendly and appreciative — thank the customer
- Draft should be 3-5 sentences
- Do NOT use placeholder brackets — write a complete, ready-to-send message
- Sign off casually

REASONING: Explain why a proactive summary is helpful for this particular invoice (e.g., multiple line items, potential confusion).
SOURCE MESSAGES: Return the most relevant customer messages that provide context for the job.
CONFIDENCE: Rate 0.85-0.95. Higher if the invoice items are straightforward.`;
}

function buildPaymentPlanPrompt() {
  return `You are an AI assistant helping a home-services professional named Jesse Martinez (Jesse's Home Services) draft a response to a customer who has asked about splitting up a large payment.

GUIDELINES:
- Be understanding and accommodating — large bills can be stressful
- Offer a specific payment plan suggestion (e.g., 2-3 installments)
- Reference the total amount and suggest reasonable split amounts
- Keep it simple — don't overcomplicate with interest rates or formal terms
- Make the customer feel valued, not judged
- Mention that you're happy to work something out
- Draft should be 3-4 sentences
- Do NOT use placeholder brackets — write a complete, ready-to-send message
- Sign off casually

REASONING: Explain which customer message indicates financial strain and why offering a payment plan is the best approach.
SOURCE MESSAGES: Return the customer message(s) where they mentioned difficulty paying.
CONFIDENCE: Rate 0.85-0.9. Payment plans involve judgment calls, so slightly lower confidence is appropriate.`;
}

const PROMPT_BUILDERS = {
  payment_followup: buildPaymentFollowupPrompt,
  invoice_question: buildInvoiceQuestionPrompt,
  invoice_summary: buildInvoiceSummaryPrompt,
  payment_plan: buildPaymentPlanPrompt,
};

// ─── Fallback drafts ────────────────────────────────────────────────────────

function getFallbackDraft(conversation, actionType) {
  const name = conversation.customer.name.split(" ")[0];
  const total = conversation.invoice.total;

  const fallbacks = {
    payment_followup: {
      draft: `Hey ${name}! Just checking in on invoice #${conversation.invoice.number} for $${total}. I know things get busy — just wanted to make sure it didn't slip through the cracks. Let me know if you have any questions! - Jesse`,
      reasoning:
        "The customer indicated they would pay but the payment hasn't been received yet. A friendly follow-up is appropriate.",
      sourceMessages: conversation.messages
        .filter((m) => m.isFromCustomer)
        .slice(-1)
        .map((m) => ({
          text: m.text,
          timestamp: m.timestamp,
          from: conversation.customer.name,
        })),
      confidence: 0.8,
    },
    invoice_question: {
      draft: `Hey ${name}, great question! That charge covers work that was necessary to complete the job properly. Happy to walk you through the details if you'd like to hop on a quick call. - Jesse`,
      reasoning:
        "The customer is questioning a specific line item. A clear explanation with offer for further discussion is appropriate.",
      sourceMessages: conversation.messages
        .filter((m) => m.isFromCustomer)
        .slice(-1)
        .map((m) => ({
          text: m.text,
          timestamp: m.timestamp,
          from: conversation.customer.name,
        })),
      confidence: 0.8,
    },
    invoice_summary: {
      draft: `Hey ${name}! Just sent over your invoice (#${conversation.invoice.number}) for $${total}. That covers everything from today's work. Let me know if you have any questions about the breakdown! - Jesse`,
      reasoning:
        "A new invoice was just sent. A proactive summary helps set expectations and reduces follow-up questions.",
      sourceMessages: conversation.messages
        .filter((m) => m.isFromCustomer)
        .slice(-1)
        .map((m) => ({
          text: m.text,
          timestamp: m.timestamp,
          from: conversation.customer.name,
        })),
      confidence: 0.85,
    },
    payment_plan: {
      draft: `Hey ${name}, totally understand — $${total} is a big expense. How about we split it into a couple payments? We could do half now and the rest next month. Whatever works for you, I'm happy to be flexible. - Jesse`,
      reasoning:
        "The customer expressed difficulty paying the full amount at once. Offering a reasonable split shows flexibility and builds goodwill.",
      sourceMessages: conversation.messages
        .filter((m) => m.isFromCustomer)
        .slice(-1)
        .map((m) => ({
          text: m.text,
          timestamp: m.timestamp,
          from: conversation.customer.name,
        })),
      confidence: 0.8,
    },
  };

  return fallbacks[actionType] || fallbacks.payment_followup;
}

// ─── Build user prompt with conversation context ────────────────────────────

function buildUserPrompt(conversation) {
  const inv = conversation.invoice;
  const lineItemsText = inv.lineItems
    .map((li) => `  - ${li.description}: $${li.amount}`)
    .join("\n");

  const messagesText = conversation.messages
    .map((m) => {
      const from = m.isFromCustomer ? conversation.customer.name : "Jesse (Pro)";
      const time = new Date(m.timestamp).toLocaleString();
      if (m.type === "invoice") {
        return `[${time}] SYSTEM: ${m.text}`;
      }
      return `[${time}] ${from}: ${m.text}`;
    })
    .join("\n");

  return `CUSTOMER: ${conversation.customer.name}
PHONE: ${conversation.customer.phone}

INVOICE #${inv.number}:
  Status: ${inv.status}
  Total: $${inv.total}
  Sent: ${new Date(inv.sentDate).toLocaleDateString()}
  Due: ${new Date(inv.dueDate).toLocaleDateString()}
  Line Items:
${lineItemsText}

CONVERSATION HISTORY:
${messagesText}

Based on the conversation and invoice details above, generate the appropriate draft message, reasoning, source messages, and confidence score.`;
}

// ─── Main export ────────────────────────────────────────────────────────────

export async function generateDraft(conversation, actionType) {
  const buildPrompt = PROMPT_BUILDERS[actionType];
  if (!buildPrompt) {
    return getFallbackDraft(conversation, actionType);
  }

  const systemPrompt = buildPrompt();
  const userPrompt = buildUserPrompt(conversation);

  try {
    const response = await openai.responses.parse({
      model: "gpt-5.4",
      reasoning: { effort: "medium" },
      instructions: systemPrompt,
      input: userPrompt,
      text: {
        format: zodTextFormat(AIDraftResponse, "ai_draft"),
      },
    });

    return response.output_parsed;
  } catch (error) {
    console.error("OpenAI API error, using fallback draft:", error.message);
    return getFallbackDraft(conversation, actionType);
  }
}
