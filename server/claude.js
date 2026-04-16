import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-opus-4-6";
const MAX_TOKENS = 1024;

// ─── Tool schemas for structured output ────────────────────────────────────

const EVALUATION_TOOL = {
  name: "evaluation_result",
  description: "Return the message evaluation result",
  input_schema: {
    type: "object",
    properties: {
      shouldCreateAction: {
        type: "boolean",
        description: "Whether this message warrants a new action for the pro",
      },
      actionType: {
        type: "string",
        enum: [
          "invoice_question",
          "invoice_summary",
          "payment_followup",
          "payment_plan",
          "invoice_request",
          "none",
        ],
        description: "Type of action to create",
      },
      actionTitle: {
        type: "string",
        description: "Short title for the action card (5-8 words)",
      },
      actionSubtitle: {
        type: "string",
        description: "One-sentence detail about the action",
      },
      actionPriority: {
        type: "string",
        enum: ["high", "medium", "low"],
        description: "Priority level",
      },
      hasSufficientContext: {
        type: "boolean",
        description:
          "Whether there is enough context to generate a confident AI draft",
      },
      customerMemoryUpdate: {
        type: "string",
        description:
          "Updated markdown content for customer memory file, or empty string if no update needed",
      },
      reasoning: {
        type: "string",
        description: "1-2 sentences explaining the decision",
      },
    },
    required: ["shouldCreateAction", "reasoning"],
  },
};

const DRAFT_TOOL = {
  name: "draft_result",
  description: "Return the generated draft message",
  input_schema: {
    type: "object",
    properties: {
      draft: {
        type: "string",
        description:
          'The message text to send to the customer (2-5 sentences, conversational, signed "- Sandro")',
      },
      reasoning: {
        type: "string",
        description: "Why this response is appropriate",
      },
      sourceMessageIds: {
        type: "array",
        items: { type: "string" },
        description:
          'IDs of customer messages that triggered this action (e.g., ["msg_3_10"])',
      },
      memorySources: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            source: { type: "string" },
          },
          required: ["text", "source"],
        },
        description: "Memory/FAQ entries that informed the draft",
      },
      confidence: {
        type: "number",
        description: "Confidence score between 0.0 and 1.0",
      },
    },
    required: ["draft", "reasoning", "sourceMessageIds", "confidence"],
  },
};

const MEMORY_TOOL = {
  name: "customer_memory",
  description: "Generate the customer memory file content",
  input_schema: {
    type: "object",
    properties: {
      memory: {
        type: "string",
        description: "Full markdown content for the customer memory file",
      },
    },
    required: ["memory"],
  },
};

// ─── Prompt helpers ────────────────────────────────────────────────────────

function formatConversationHistory(conversation) {
  return conversation.messages
    .map((m) => {
      const from = m.isFromCustomer
        ? conversation.customer.name
        : "Sandro (Pro)";
      const time = new Date(m.timestamp).toLocaleString();
      if (m.type === "invoice") {
        return `[${time}] SYSTEM: ${m.text}`;
      }
      return `[${time}] ${from} (${m.id}): ${m.text}`;
    })
    .join("\n");
}

function formatInvoiceDetails(invoice) {
  if (!invoice) return "No invoice associated with this conversation.";
  const lineItemsText = invoice.lineItems
    .map((li) => `  - ${li.description}: $${li.amount}`)
    .join("\n");
  return `INVOICE #${invoice.number}:
  Status: ${invoice.status}
  Total: $${invoice.total}
  Sent: ${new Date(invoice.sentDate).toLocaleDateString()}
  Due: ${new Date(invoice.dueDate).toLocaleDateString()}
  Line Items:
${lineItemsText}`;
}

// ─── System prompts ────────────────────────────────────────────────────────

function buildEvaluationSystemPrompt(proMemory) {
  return `You are an AI assistant for Sandro Rauen, owner of Rauen Flooring, a flooring company based in Fort Myers, Florida. Your job is to evaluate incoming customer messages and determine if they require an action from Sandro.

PRO MEMORY (business context and FAQ):
${proMemory}

SUPPORTED ACTION TYPES:
1. invoice_question — Customer is questioning, confused about, or disputing a specific charge or line item on an invoice they received. Examples: "What's the float charge for?", "Why am I being charged for staining separately?"
2. invoice_summary — An invoice was recently sent but no friendly breakdown was provided to the customer. The pro should proactively explain the charges. Examples: invoice just sent with multiple line items, customer hasn't seen a summary yet.
3. payment_followup — Customer promised to pay by a certain time but hasn't. A friendly nudge is appropriate. Examples: "I'll pay by Friday" (and it's now Monday), "Sending payment today" (but nothing received).
4. payment_plan — Customer is expressing difficulty paying the full amount and wants to split payments. Examples: "Can I break this up?", "I can't afford this all at once", "$5,800 is a lot."
5. invoice_request — Customer is asking for an invoice to be created or sent, but none exists yet. Examples: "Can you send me an invoice?", "When will I get the bill?"

DO NOT create actions for:
- Scheduling confirmations or appointment requests
- Thank-you messages with no further ask
- Invoices that are already paid
- Warranty questions that don't involve invoicing
- Estimate requests when no invoice exists
- General service questions not tied to a specific invoice
- Simple acknowledgments like "OK", "Sounds good", "Thanks"

CUSTOMER MEMORY UPDATES:
When evaluating, also determine if the customer memory file should be updated. Extract and include:
- Customer location or address if mentioned
- Preferences (communication style, flooring preferences, scheduling preferences)
- Job details (type of flooring, room, square footage)
- Relationship notes (repeat customer, referral source, satisfaction level)
Return an empty string for customerMemoryUpdate if no new information should be recorded.
IMPORTANT: In customerMemoryUpdate, use relative time references (e.g., "recent job", "upcoming appointment") rather than absolute dates. The memory should stay useful over time.

PRIORITY GUIDELINES:
- high: Customer is upset, disputing a charge, or payment is overdue
- medium: Customer has a question or request that needs attention
- low: Proactive actions like invoice summaries`;
}

function buildProMessageSystemPrompt(proMemory) {
  return `You are an AI assistant for Sandro Rauen, owner of Rauen Flooring, a flooring company based in Fort Myers, Florida. You are evaluating a message sent BY the pro (Sandro), not a customer message.

PRO MEMORY (business context):
${proMemory}

YOUR ONLY JOB: Determine if the customer memory file should be updated based on what Sandro said. Look for:
- Job details Sandro mentioned (measurements, materials, findings about subfloor condition)
- Pricing or quotes Sandro provided
- Scheduling (appointment dates, job start dates, estimated duration)
- Job status updates (completed, in progress, issues found)
- Any other factual information about the customer's project

IMPORTANT: Set shouldCreateAction to FALSE. Pro messages never create actions. Actions are only created when customers need a response.
IMPORTANT: In customerMemoryUpdate, use relative time references (e.g., "recent job", "upcoming appointment") rather than absolute dates.
Return an empty string for customerMemoryUpdate if the pro message contains no new noteworthy information (e.g., "OK", "Sounds good", "On my way").`;
}

function buildEvaluateConversationSystemPrompt(proMemory) {
  return `You are an AI assistant for Sandro Rauen, owner of Rauen Flooring, a flooring company based in Fort Myers, Florida. Your job is to evaluate the current state of this conversation and determine if it requires an action from Sandro.

Look at the FULL conversation — not just the last message. Consider the overall state: Was an invoice sent without a summary? Did a customer promise to pay and not follow through? Is there an unanswered question?

PRO MEMORY (business context and FAQ):
${proMemory}

SUPPORTED ACTION TYPES:
1. invoice_question — Customer is questioning, confused about, or disputing a specific charge or line item on an invoice they received. Examples: "What's the float charge for?", "Why am I being charged for staining separately?"
2. invoice_summary — An invoice was recently sent but no friendly breakdown was provided to the customer. The pro should proactively explain the charges. This can be detected even if the customer didn't ask — look for invoices sent without a follow-up summary message.
3. payment_followup — Customer promised to pay by a certain time but hasn't. A friendly nudge is appropriate. Examples: "I'll pay by Friday" (and it's now Monday), "Sending payment today" (but nothing received).
4. payment_plan — Customer is expressing difficulty paying the full amount and wants to split payments. Examples: "Can I break this up?", "I can't afford this all at once."
5. invoice_request — Customer is asking for an invoice to be created or sent, but none exists yet. Examples: "Can you send me an invoice?", "When will I get the bill?"

DO NOT create actions for:
- Scheduling confirmations or appointment requests
- Thank-you messages with no further ask
- Invoices that are already paid
- Warranty questions that don't involve invoicing
- Estimate requests when no invoice exists
- General service questions not tied to a specific invoice
- Simple acknowledgments like "OK", "Sounds good", "Thanks"
- Conversations where the customer's last message is just a scheduling question

CUSTOMER MEMORY UPDATES:
When evaluating, also determine if the customer memory file should be updated. Extract and include:
- Customer location or address if mentioned
- Preferences (communication style, flooring preferences, scheduling preferences)
- Job details (type of flooring, room, square footage)
- Relationship notes (repeat customer, referral source, satisfaction level)
Return an empty string for customerMemoryUpdate if no new information should be recorded.
IMPORTANT: In customerMemoryUpdate, use relative time references (e.g., "recent job", "upcoming appointment") rather than absolute dates. The memory should stay useful over time.

PRIORITY GUIDELINES:
- high: Customer is upset, disputing a charge, or payment is overdue
- medium: Customer has a question or request that needs attention
- low: Proactive actions like invoice summaries`;
}

const DRAFT_SYSTEM_PROMPTS = {
  invoice_question: `You are helping Sandro Rauen (Rauen Flooring, Fort Myers FL) reply to a customer questioning an invoice charge. Be transparent, explain WHY the charge exists, reference the FAQ if relevant. 2-4 sentences, conversational texting tone. Sign off as "- Sandro".

GUIDELINES:
- Be transparent, patient, and educational — explain the charge clearly
- Reference the specific line item amount and what it covers
- Explain WHY the work was necessary (not just what it was)
- If the charge is standard industry practice, mention that briefly
- Be empathetic — acknowledge that costs can be surprising
- Do NOT use placeholder brackets — write a complete, ready-to-send message
- Return the IDs of customer messages that raised the question in sourceMessageIds

STYLE RULES (mandatory):
- Do NOT use em-dashes (—). Use commas or periods instead.
- Do NOT use "I understand", "certainly", "I'd be happy to", "don't hesitate", or "please don't hesitate"
- Do NOT use absolute dates (e.g., "April 15, 2026"). Use relative references only ("yesterday", "earlier this week", "when we measured")
- Write like a busy flooring installer texting a customer. Short, warm, direct.`,

  invoice_summary: `You are helping Sandro Rauen (Rauen Flooring, Fort Myers FL) draft a friendly invoice summary. Break down each line item naturally, explain value, proactively address potential confusion (e.g., why staining and polyurethane are separate, what floor leveling involves). 3-5 sentences. Sign as "- Sandro".

GUIDELINES:
- Provide a warm, conversational breakdown of what was done and why
- Reference each line item naturally (don't just list them like a receipt)
- Explain the value the customer received
- Mention the total and that the invoice has been sent
- If there are items that might seem unexpected, proactively explain them
- Keep it friendly and appreciative — thank the customer
- Do NOT use placeholder brackets — write a complete, ready-to-send message
- Return the IDs of relevant customer messages in sourceMessageIds

STYLE RULES (mandatory):
- Do NOT use em-dashes (—). Use commas or periods instead.
- Do NOT use "I understand", "certainly", "I'd be happy to", "don't hesitate", or "please don't hesitate"
- Do NOT use absolute dates (e.g., "April 15, 2026"). Use relative references only ("yesterday", "earlier this week", "when we measured")
- Write like a busy flooring installer texting a customer. Short, warm, direct.`,

  payment_followup: `You are helping Sandro Rauen (Rauen Flooring, Fort Myers FL) follow up on a missed payment promise. Friendly nudge, not a demand. Reference the specific promise. 2-4 sentences. Sign as "- Sandro".

GUIDELINES:
- Be warm, professional, and non-confrontational — this is a friendly nudge
- Reference the specific invoice amount and what the work was for
- Mention the customer's own words about when they said they'd pay
- Keep the tone conversational, like a real person texting
- Do NOT use placeholder brackets — write a complete, ready-to-send message
- Return the IDs of customer messages containing the payment promise in sourceMessageIds

STYLE RULES (mandatory):
- Do NOT use em-dashes (—). Use commas or periods instead.
- Do NOT use "I understand", "certainly", "I'd be happy to", "don't hesitate", or "please don't hesitate"
- Do NOT use absolute dates (e.g., "April 15, 2026"). Use relative references only ("yesterday", "earlier this week", "when we measured")
- Write like a busy flooring installer texting a customer. Short, warm, direct.`,

  payment_plan: `You are helping Sandro Rauen (Rauen Flooring, Fort Myers FL) offer a payment plan. Understanding tone, suggest 2-3 installments, reference total. 3-4 sentences. Sign as "- Sandro".

GUIDELINES:
- Be understanding and accommodating — large bills can be stressful
- Offer a specific payment plan suggestion (e.g., 2-3 installments)
- Reference the total amount and suggest reasonable split amounts
- Keep it simple — don't overcomplicate with interest rates or formal terms
- Make the customer feel valued, not judged
- Do NOT use placeholder brackets — write a complete, ready-to-send message
- Return the IDs of customer messages where they mentioned difficulty paying in sourceMessageIds

STYLE RULES (mandatory):
- Do NOT use em-dashes (—). Use commas or periods instead.
- Do NOT use "I understand", "certainly", "I'd be happy to", "don't hesitate", or "please don't hesitate"
- Do NOT use absolute dates (e.g., "April 15, 2026"). Use relative references only ("yesterday", "earlier this week", "when we measured")
- Write like a busy flooring installer texting a customer. Short, warm, direct.`,
};

// ─── Fallbacks ─────────────────────────────────────────────────────────────

function fallbackEvaluate(conversation, message) {
  const lower = message.text.toLowerCase();

  if (lower.includes("invoice") && !conversation.invoice) {
    return {
      shouldCreateAction: true,
      actionType: "invoice_request",
      actionTitle: `${conversation.customer.name} requesting invoice`,
      actionSubtitle: "Customer is asking for an invoice to be sent",
      actionPriority: "medium",
      hasSufficientContext: false,
      customerMemoryUpdate: `# ${conversation.customer.name}\n\n## Notes\n- ${message.text}\n`,
      reasoning:
        "Customer mentioned invoice-related request (fallback detection)",
    };
  }

  if (
    (lower.includes("charge") ||
      lower.includes("fee") ||
      lower.includes("cost") ||
      lower.includes("price")) &&
    conversation.invoice
  ) {
    return {
      shouldCreateAction: true,
      actionType: "invoice_question",
      actionTitle: `${conversation.customer.name} has invoice question`,
      actionSubtitle: "Customer questioning a charge",
      actionPriority: "high",
      hasSufficientContext: true,
      customerMemoryUpdate: "",
      reasoning:
        "Customer appears to be questioning a charge (fallback detection)",
    };
  }

  if (
    (lower.includes("can't pay") ||
      lower.includes("break this up") ||
      lower.includes("split") ||
      lower.includes("payment plan") ||
      lower.includes("all at once")) &&
    conversation.invoice
  ) {
    return {
      shouldCreateAction: true,
      actionType: "payment_plan",
      actionTitle: `${conversation.customer.name} needs payment plan`,
      actionSubtitle: "Customer requesting to split payments",
      actionPriority: "high",
      hasSufficientContext: true,
      customerMemoryUpdate: "",
      reasoning:
        "Customer expressed difficulty paying full amount (fallback detection)",
    };
  }

  if (
    (lower.includes("pay") || lower.includes("send payment")) &&
    conversation.invoice &&
    conversation.invoice.status === "overdue"
  ) {
    return {
      shouldCreateAction: true,
      actionType: "payment_followup",
      actionTitle: `${conversation.customer.name} promised payment`,
      actionSubtitle: "Follow up on missed payment deadline",
      actionPriority: "high",
      hasSufficientContext: true,
      customerMemoryUpdate: "",
      reasoning:
        "Customer promised payment on overdue invoice (fallback detection)",
    };
  }

  return {
    shouldCreateAction: false,
    actionType: "none",
    actionTitle: "",
    actionSubtitle: "",
    actionPriority: "low",
    hasSufficientContext: false,
    customerMemoryUpdate: "",
    reasoning: "No invoice-related action detected (fallback)",
  };
}

function fallbackConversationEvaluate(conversation) {
  const invoice = conversation.invoice;
  const messages = conversation.messages;
  const lastCustomerMsg = [...messages]
    .reverse()
    .find((m) => m.isFromCustomer);

  if (!lastCustomerMsg) {
    // Check if invoice was sent without summary
    const invoiceMsg = messages.find((m) => m.type === "invoice");
    const hasFollowup = invoiceMsg
      ? messages.some(
          (m) =>
            !m.isFromCustomer &&
            m.type === "text" &&
            new Date(m.timestamp) > new Date(invoiceMsg.timestamp)
        )
      : false;

    if (invoice && invoiceMsg && !hasFollowup) {
      return {
        shouldCreateAction: true,
        actionType: "invoice_summary",
        actionTitle: `Send ${conversation.customer.name} invoice summary`,
        actionSubtitle: "New invoice needs a friendly breakdown",
        actionPriority: "low",
        hasSufficientContext: true,
        customerMemoryUpdate: "",
        reasoning:
          "Invoice was sent without a summary message (fallback detection)",
      };
    }

    return {
      shouldCreateAction: false,
      actionType: "none",
      actionTitle: "",
      actionSubtitle: "",
      actionPriority: "low",
      hasSufficientContext: false,
      customerMemoryUpdate: "",
      reasoning: "No actionable state detected (fallback)",
    };
  }

  // Delegate to message-level fallback using the last customer message
  return fallbackEvaluate(conversation, lastCustomerMsg);
}

function fallbackDraft(conversation, actionType) {
  const name = conversation.customer.name.split(" ")[0];
  const total = conversation.invoice.total;

  const fallbacks = {
    payment_followup: {
      draft: `Hey ${name}! Just checking in on invoice #${conversation.invoice.number} for $${total}. I know things get busy, just wanted to make sure it didn't slip through the cracks. Let me know if you have any questions!`,
      reasoning:
        "The customer indicated they would pay but the payment hasn't been received yet. A friendly follow-up is appropriate.",
      sourceMessageIds: conversation.messages
        .filter((m) => m.isFromCustomer)
        .slice(-1)
        .map((m) => m.id),
      memorySources: [],
      confidence: 0.8,
    },
    invoice_question: {
      draft: `Hey ${name}, great question! That charge covers work that was necessary to complete the job properly. Happy to walk you through the details if you'd like to hop on a quick call.`,
      reasoning:
        "The customer is questioning a specific line item. A clear explanation with offer for further discussion is appropriate.",
      sourceMessageIds: conversation.messages
        .filter((m) => m.isFromCustomer)
        .slice(-1)
        .map((m) => m.id),
      memorySources: [],
      confidence: 0.8,
    },
    invoice_summary: {
      draft: `Hey ${name}! Just sent over your invoice (#${conversation.invoice.number}) for $${total}. That covers everything from the job. Let me know if you have any questions about the breakdown!`,
      reasoning:
        "A new invoice was just sent. A proactive summary helps set expectations and reduces follow-up questions.",
      sourceMessageIds: conversation.messages
        .filter((m) => m.isFromCustomer)
        .slice(-1)
        .map((m) => m.id),
      memorySources: [],
      confidence: 0.85,
    },
    payment_plan: {
      draft: `Hey ${name}, totally understand, $${total} is a big expense. How about we split it into a couple payments? We could do half now and the rest next month. Whatever works for you, I'm happy to be flexible.`,
      reasoning:
        "The customer expressed difficulty paying the full amount at once. Offering a reasonable split shows flexibility and builds goodwill.",
      sourceMessageIds: conversation.messages
        .filter((m) => m.isFromCustomer)
        .slice(-1)
        .map((m) => m.id),
      memorySources: [],
      confidence: 0.8,
    },
  };

  return fallbacks[actionType] || fallbacks.payment_followup;
}

function fallbackCustomerMemory(conversation) {
  const c = conversation.customer;
  let md = `# ${c.name}\n\n## Customer Profile\n- **Phone**: ${c.phone || "N/A"}\n\n## Job History\n`;
  if (conversation.invoice) {
    md += `- Invoice #${conversation.invoice.number}: $${conversation.invoice.total} (${conversation.invoice.status})\n`;
    if (conversation.invoice.lineItems) {
      for (const li of conversation.invoice.lineItems) {
        md += `  - ${li.description}: $${li.amount}\n`;
      }
    }
  }
  md += `\n## Notes\n- No additional notes\n`;
  return md;
}

// ─── Helper: extract tool_use result ───────────────────────────────────────

function extractToolInput(response, toolName) {
  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === toolName) {
      return block.input;
    }
  }
  return null;
}

// ─── Function 1: evaluateMessage ───────────────────────────────────────────

export async function evaluateMessage(
  conversation,
  message,
  proMemory,
  customerMemory,
  sender = "customer"
) {
  try {
    const isProMessage = sender === "pro";
    const systemPrompt = isProMessage
      ? buildProMessageSystemPrompt(proMemory)
      : buildEvaluationSystemPrompt(proMemory);

    const invoiceDetails = formatInvoiceDetails(conversation.invoice);
    const conversationHistory = formatConversationHistory(conversation);

    const senderLabel = isProMessage ? "Sandro (Pro)" : conversation.customer.name;
    const evalInstruction = isProMessage
      ? "This is a message from the pro (Sandro). Do NOT create any actions. Only evaluate whether the customer memory should be updated based on what Sandro said (job details, pricing, scheduling, findings). Set shouldCreateAction to false."
      : "Evaluate this new message. Should an action be created for Sandro? Use the evaluation_result tool to return your structured assessment.";

    const userPrompt = `CUSTOMER: ${conversation.customer.name}

${invoiceDetails}

EXISTING CUSTOMER MEMORY:
${customerMemory || "No existing customer memory."}

CONVERSATION HISTORY:
${conversationHistory}

NEW MESSAGE FROM ${isProMessage ? "PRO (SANDRO)" : "CUSTOMER"}:
[${new Date(message.timestamp).toLocaleString()}] ${senderLabel} (${message.id}): ${message.text}

${evalInstruction}`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: [EVALUATION_TOOL],
      tool_choice: { type: "tool", name: "evaluation_result" },
      messages: [{ role: "user", content: userPrompt }],
    });

    const result = extractToolInput(response, "evaluation_result");
    if (!result) {
      console.error("No evaluation_result tool_use found in response");
      return fallbackEvaluate(conversation, message);
    }

    console.log("[Pipeline] Claude returned:", JSON.stringify({ shouldCreateAction: result.shouldCreateAction, actionType: result.actionType, hasInvoice: !!conversation.invoice, sender }, null, 2));

    // Guard: pro messages NEVER create actions (hard override even if Claude suggests one)
    if (isProMessage) {
      result.shouldCreateAction = false;
      result.actionType = "none";
    }

    // Guard: if no invoice and action is not invoice_request, force no action
    if (
      !conversation.invoice &&
      result.actionType !== "invoice_request"
    ) {
      console.log("[Pipeline] Guard blocked: no invoice and actionType is", result.actionType, "(not invoice_request)");
      result.shouldCreateAction = false;
    }

    // Guard: if actionType is none, force no action
    if (result.actionType === "none") {
      result.shouldCreateAction = false;
    }

    return result;
  } catch (error) {
    console.error("Claude API error in evaluateMessage:", error.message);
    // Pro messages: return memory-only fallback (no action)
    if (isProMessage) {
      return {
        shouldCreateAction: false,
        actionType: "none",
        actionTitle: "",
        actionSubtitle: "",
        actionPriority: "low",
        hasSufficientContext: false,
        customerMemoryUpdate: "",
        reasoning: "Pro message processed (fallback, no memory extraction)",
      };
    }
    return fallbackEvaluate(conversation, message);
  }
}

// ─── Function 2: generateDraft ─────────────────────────────────────────────

export async function generateDraft(
  conversation,
  actionType,
  proMemory,
  customerMemory
) {
  // Guard: invoice_request cannot generate a draft
  if (actionType === "invoice_request") {
    return null;
  }

  // Guard: no invoice means no draft
  if (!conversation.invoice) {
    return null;
  }

  const systemPrompt = DRAFT_SYSTEM_PROMPTS[actionType];
  if (!systemPrompt) {
    console.error(`Unknown actionType for draft generation: ${actionType}`);
    return fallbackDraft(conversation, actionType);
  }

  try {
    const invoiceDetails = formatInvoiceDetails(conversation.invoice);
    const conversationHistory = formatConversationHistory(conversation);

    const userPrompt = `PRO MEMORY (business context and FAQ):
${proMemory || "No pro memory available."}

CUSTOMER: ${conversation.customer.name}

${invoiceDetails}

CUSTOMER MEMORY:
${customerMemory || "No existing customer memory."}

CONVERSATION HISTORY:
${conversationHistory}

Generate the draft message for Sandro to send. Use the draft_result tool to return your response. Include the message IDs (e.g., "msg_3_10") of the customer messages that triggered this action in sourceMessageIds. If any FAQ or memory entries informed the draft, include them in memorySources.`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: [DRAFT_TOOL],
      tool_choice: { type: "tool", name: "draft_result" },
      messages: [{ role: "user", content: userPrompt }],
    });

    const result = extractToolInput(response, "draft_result");
    if (!result) {
      console.error("No draft_result tool_use found in response");
      return fallbackDraft(conversation, actionType);
    }

    // Ensure memorySources is always an array
    if (!result.memorySources) {
      result.memorySources = [];
    }

    return result;
  } catch (error) {
    console.error("Claude API error in generateDraft:", error.message);
    return fallbackDraft(conversation, actionType);
  }
}

// ─── Function 3: generateCustomerMemory ────────────────────────────────────

export async function generateCustomerMemory(conversation, proMemory) {
  try {
    const invoiceDetails = formatInvoiceDetails(conversation.invoice);
    const conversationHistory = formatConversationHistory(conversation);

    const systemPrompt = `Generate a customer memory file in markdown format for a customer of Rauen Flooring (Sandro Rauen, Fort Myers FL).

Include:
- Customer name as H1
- Section: Customer Profile (phone, service area if mentioned, communication style)
- Section: Job History (each job with description, cost, line items, status)
- Section: Notes (observations about the customer, preferences, outstanding issues, relationship notes)

PRO MEMORY (business context):
${proMemory || "No pro memory available."}

Keep it concise but capture all useful information from the conversation.`;

    const userPrompt = `CUSTOMER: ${conversation.customer.name}
PHONE: ${conversation.customer.phone || "N/A"}

${invoiceDetails}

CONVERSATION HISTORY:
${conversationHistory}

Generate the customer memory file. Use the customer_memory tool to return the markdown content.`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: [MEMORY_TOOL],
      tool_choice: { type: "tool", name: "customer_memory" },
      messages: [{ role: "user", content: userPrompt }],
    });

    const result = extractToolInput(response, "customer_memory");
    if (!result || !result.memory) {
      console.error("No customer_memory tool_use found in response");
      return fallbackCustomerMemory(conversation);
    }

    return result.memory;
  } catch (error) {
    console.error(
      "Claude API error in generateCustomerMemory:",
      error.message
    );
    return fallbackCustomerMemory(conversation);
  }
}

// ─── Function 4: evaluateConversation ──────────────────────────────────────

export async function evaluateConversation(conversation, proMemory) {
  try {
    const systemPrompt = buildEvaluateConversationSystemPrompt(proMemory);

    const invoiceDetails = formatInvoiceDetails(conversation.invoice);
    const conversationHistory = formatConversationHistory(conversation);

    const userPrompt = `CUSTOMER: ${conversation.customer.name}

${invoiceDetails}

CONVERSATION HISTORY:
${conversationHistory}

Evaluate the current state of this conversation. Consider ALL messages, not just the last one. Look for:
- Unanswered customer questions about charges
- Invoices sent without a summary
- Payment promises that weren't fulfilled
- Requests for payment flexibility
- Invoice requests when no invoice exists

Should an action be created for Sandro? Use the evaluation_result tool to return your structured assessment.`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: [EVALUATION_TOOL],
      tool_choice: { type: "tool", name: "evaluation_result" },
      messages: [{ role: "user", content: userPrompt }],
    });

    const result = extractToolInput(response, "evaluation_result");
    if (!result) {
      console.error("No evaluation_result tool_use found in response");
      return fallbackConversationEvaluate(conversation);
    }

    // Guard: if no invoice and action is not invoice_request, force no action
    if (
      !conversation.invoice &&
      result.actionType !== "invoice_request"
    ) {
      result.shouldCreateAction = false;
    }

    // Guard: if actionType is none, force no action
    if (result.actionType === "none") {
      result.shouldCreateAction = false;
    }

    return result;
  } catch (error) {
    console.error(
      "Claude API error in evaluateConversation:",
      error.message
    );
    return fallbackConversationEvaluate(conversation);
  }
}

// ─── Function 5: generateFAQ ─────────────────────────────────────────────

export async function generateFAQ(customerQuestions) {
  const FAQ_TOOL = {
    name: 'faq_result',
    description: 'Return generated FAQ entries',
    input_schema: {
      type: 'object',
      properties: {
        faq: { type: 'string', description: 'Markdown-formatted FAQ entries' }
      },
      required: ['faq']
    }
  };

  const systemPrompt = `You are Sandro Rauen, owner of Rauen Flooring in Fort Myers, Florida. Generate FAQ entries based ONLY on real customer questions from your conversations. Do NOT make up questions that weren't asked. Write in first person as if you're explaining to customers. Keep answers practical and specific to flooring work.

STYLE: Write naturally, as a flooring installer would explain things. No em-dashes. No corporate language.`;

  const userPrompt = `Here are real questions and concerns from my customers:\n\n${customerQuestions.map((q, i) => `${i + 1}. "${q}"`).join('\n')}\n\nGenerate FAQ entries ONLY for topics that appear in these questions. Format each as:\n### Question title?\nAnswer paragraph.\n\nIf there are only 3 distinct topics, generate 3 FAQs. Don't pad with unrelated topics.`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      tools: [FAQ_TOOL],
      tool_choice: { type: 'tool', name: 'faq_result' },
      messages: [
        { role: 'user', content: systemPrompt + '\n\n' + userPrompt }
      ],
    });
    const toolBlock = response.content.find(b => b.type === 'tool_use');
    return toolBlock?.input?.faq || '';
  } catch (err) {
    console.error('FAQ generation failed:', err.message);
    return '';
  }
}
