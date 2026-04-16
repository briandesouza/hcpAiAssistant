// Hardcoded AI draft responses — no server or API key needed.

export function getFallbackDraft(conversation, actionType) {
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
