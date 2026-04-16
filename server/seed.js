// Seed script — message-by-message pipeline processing
// Processes every customer message through evaluateMessage() to build memories
// incrementally, then generates FAQ from conversation patterns, then generates
// drafts with full context.
//
// Run: node server/seed.js  or  npm run seed

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  evaluateMessage,
  generateDraft,
  generateFAQ,
} from "./claude.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "src", "data");

// ─── Load data ─────────────────────────────────────────────────────────────

const { initialConversations } = await import(
  path.join(DATA_DIR, "mockData.js")
);

// Read pro memory WITHOUT FAQ (FAQ placeholder only at this point)
let proMemory = fs.readFileSync(path.join(DATA_DIR, "proMemory.md"), "utf-8");

const ACCENT_COLORS = { high: "#FF3B30", medium: "#007AFF", low: "#34C759" };

// ─── Provenance tracking ───────────────────────────────────────────────────

const provenance = {
  messageEvaluations: [],
  customerQuestions: [],
  actionsCreated: [],
  faqSources: [],
  testResults: [],
};

// ─── Phase B: Message-by-message processing ────────────────────────────────

async function processConversations() {
  console.log("=== PHASE B: Message-by-message pipeline processing ===\n");

  const actions = [];
  const customerMemories = {};
  let totalEvals = 0;

  for (const conv of initialConversations) {
    console.log(`\n--- ${conv.customer.name} (${conv.id}) ---`);
    let customerMemory = "";
    let latestAction = null;

    const customerMessages = conv.messages.filter(
      (m) => m.isFromCustomer && m.type === "text"
    );
    console.log(`  ${customerMessages.length} customer messages to process`);

    for (const msg of customerMessages) {
      // Build conversation snapshot up to and including this message
      const msgIndex = conv.messages.indexOf(msg);
      const messagesUpTo = conv.messages.slice(0, msgIndex + 1);
      const snapshot = { ...conv, messages: messagesUpTo };

      console.log(`  [${msg.id}] "${msg.text.substring(0, 60)}${msg.text.length > 60 ? '...' : ''}"`);

      const result = await evaluateMessage(
        snapshot,
        msg,
        proMemory,
        customerMemory
      );
      totalEvals++;

      // Track provenance
      provenance.messageEvaluations.push({
        convId: conv.id,
        messageId: msg.id,
        shouldCreateAction: result.shouldCreateAction,
        actionType: result.actionType,
        reasoning: result.reasoning,
      });

      // Collect customer questions for FAQ generation
      if (
        msg.text.includes("?") ||
        msg.text.toLowerCase().includes("what") ||
        msg.text.toLowerCase().includes("why") ||
        msg.text.toLowerCase().includes("how")
      ) {
        provenance.customerQuestions.push({
          convId: conv.id,
          messageId: msg.id,
          text: msg.text,
        });
      }

      // Accumulate customer memory
      if (result.customerMemoryUpdate && result.customerMemoryUpdate.trim()) {
        customerMemory = result.customerMemoryUpdate;
        console.log(`    → Memory updated`);
      }

      // Track latest action (may change as conversation evolves)
      if (result.shouldCreateAction) {
        latestAction = { ...result, triggerMessageId: msg.id };
        console.log(
          `    → Action: ${result.actionType} (${result.actionPriority})`
        );
      } else if (latestAction) {
        // Conversation state resolved — action no longer needed
        latestAction = null;
        console.log(`    → Previous action cleared`);
      }
    }

    // Save final customer memory
    if (customerMemory) {
      customerMemories[conv.id] = customerMemory;
      console.log(`  ✓ Final memory saved (${customerMemory.length} chars)`);
    } else {
      // Guarantee baseline memory
      const baseline = `# ${conv.customer.name}\n\n## Customer Profile\n- Customer of Rauen Flooring\n`;
      customerMemories[conv.id] = baseline;
      console.log(`  ✓ Baseline memory created`);
    }

    // Save final action
    if (latestAction) {
      const actionId = `action_${actions.length + 1}`;
      const priority = latestAction.actionPriority || "medium";
      actions.push({
        id: actionId,
        conversationId: conv.id,
        type: latestAction.actionType,
        title: latestAction.actionTitle || `Action for ${conv.customer.name}`,
        subtitle: latestAction.actionSubtitle || "",
        customerName: conv.customer.name,
        priority,
        accentColor: ACCENT_COLORS[priority] || ACCENT_COLORS.medium,
        hasDraft: false, // Will be updated after draft generation
        triggerMessageId: latestAction.triggerMessageId,
      });
      provenance.actionsCreated.push({
        actionId,
        convId: conv.id,
        type: latestAction.actionType,
        triggerMessageId: latestAction.triggerMessageId,
        reasoning: latestAction.reasoning,
      });
      console.log(`  ✓ Action: ${latestAction.actionType} (${priority})`);
    } else {
      console.log(`  ✓ No action needed`);
    }
  }

  console.log(`\n  Total evaluations: ${totalEvals}`);
  return { actions, customerMemories };
}

// ─── Phase C: FAQ generation from customer questions ───────────────────────

async function generateFAQFromConversations() {
  console.log("\n=== PHASE C: FAQ generation ===\n");

  const questions = provenance.customerQuestions.map((q) => q.text);
  console.log(`  Found ${questions.length} customer questions:`);
  questions.forEach((q, i) => console.log(`    ${i + 1}. "${q}"`));

  if (questions.length === 0) {
    console.log("  No questions found, skipping FAQ generation");
    return "";
  }

  const faqMarkdown = await generateFAQ(questions);

  if (faqMarkdown) {
    // Update proMemory.md with generated FAQ
    const faqPlaceholder = "## Frequently Asked Questions\n\n_Generated from conversation data by the AI pipeline._";
    const newFaqSection = `## Frequently Asked Questions\n\n${faqMarkdown}`;
    proMemory = proMemory.replace(faqPlaceholder, newFaqSection);
    fs.writeFileSync(path.join(DATA_DIR, "proMemory.md"), proMemory);
    console.log(`  ✓ FAQ generated and written to proMemory.md`);

    // Track FAQ provenance
    provenance.faqSources = provenance.customerQuestions.map((q) => ({
      question: q.text,
      messageId: q.messageId,
      convId: q.convId,
    }));
  } else {
    console.log("  ✗ FAQ generation returned empty");
  }

  return faqMarkdown;
}

// ─── Phase D: Draft generation (with full proMemory) ───────────────────────

async function generateDrafts(actions, customerMemories) {
  console.log("\n=== PHASE D: Draft generation ===\n");

  // Reload proMemory (now includes FAQ)
  proMemory = fs.readFileSync(path.join(DATA_DIR, "proMemory.md"), "utf-8");
  const cachedDrafts = {};

  for (const action of actions) {
    // Skip invoice_request — these never get drafts
    if (action.type === "invoice_request") {
      console.log(`  ${action.customerName}: Skipping draft (invoice_request)`);
      continue;
    }

    const conv = initialConversations.find(
      (c) => c.id === action.conversationId
    );
    if (!conv || !conv.invoice) {
      console.log(`  ${action.customerName}: Skipping draft (no invoice)`);
      continue;
    }

    console.log(`  ${action.customerName}: Generating ${action.type} draft...`);
    const customerMem = customerMemories[action.conversationId] || "";
    const draft = await generateDraft(conv, action.type, proMemory, customerMem);

    if (draft) {
      cachedDrafts[action.conversationId] = draft;
      action.hasDraft = true;
      console.log(`    ✓ Draft generated (confidence: ${draft.confidence})`);
      console.log(`    Preview: "${draft.draft.substring(0, 100)}..."`);

      // Quality checks
      if (draft.draft.includes("—")) {
        console.warn(`    ⚠ QUALITY: Draft contains em-dash`);
      }
      if (/\b(certainly|I understand|I'd be happy to|don't hesitate)\b/i.test(draft.draft)) {
        console.warn(`    ⚠ QUALITY: Draft contains AI-sounding phrases`);
      }
      if (/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}\b/.test(draft.draft)) {
        console.warn(`    ⚠ QUALITY: Draft contains absolute dates`);
      }
    } else {
      console.log(`    ✗ Draft returned null`);
    }
  }

  return cachedDrafts;
}

// ─── Phase E: Test scenarios ───────────────────────────────────────────────

async function runTestScenarios() {
  console.log("\n=== PHASE E: Test scenarios ===\n");

  const testConv = {
    id: "test_conv",
    customer: { name: "Test Customer", initials: "TC", phone: "" },
    invoice: null,
    messages: [],
  };

  const tests = [
    {
      name: "Scheduling message (should NOT create action)",
      message: {
        id: "test_1",
        text: "Can we schedule for next Tuesday morning?",
        timestamp: new Date().toISOString(),
        isFromCustomer: true,
        type: "text",
      },
      expectedAction: false,
    },
    {
      name: "Warranty question (should NOT create action)",
      message: {
        id: "test_2",
        text: "The plank near the door is lifting, is this covered by warranty?",
        timestamp: new Date().toISOString(),
        isFromCustomer: true,
        type: "text",
      },
      expectedAction: false,
    },
    {
      name: "Roberto's demo message (should create invoice_request, no draft)",
      message: {
        id: "test_3",
        text: "Hi, you haven't sent me the invoice yet for my house in Miami",
        timestamp: new Date().toISOString(),
        isFromCustomer: true,
        type: "text",
      },
      expectedAction: true,
      expectedType: "invoice_request",
      expectedHasSufficientContext: false,
    },
  ];

  let allPassed = true;

  for (const test of tests) {
    const testSnapshot = {
      ...testConv,
      messages: [test.message],
    };
    console.log(`  Test: ${test.name}`);
    const result = await evaluateMessage(
      testSnapshot,
      test.message,
      proMemory,
      ""
    );

    const passed =
      result.shouldCreateAction === test.expectedAction &&
      (!test.expectedType || result.actionType === test.expectedType) &&
      (test.expectedHasSufficientContext === undefined ||
        result.hasSufficientContext === test.expectedHasSufficientContext);

    provenance.testResults.push({
      name: test.name,
      passed,
      expected: {
        shouldCreateAction: test.expectedAction,
        actionType: test.expectedType,
      },
      actual: {
        shouldCreateAction: result.shouldCreateAction,
        actionType: result.actionType,
        hasSufficientContext: result.hasSufficientContext,
      },
      reasoning: result.reasoning,
    });

    if (passed) {
      console.log(`    ✓ PASSED (${result.reasoning})`);
    } else {
      console.log(
        `    ✗ FAILED — expected action=${test.expectedAction}${test.expectedType ? `, type=${test.expectedType}` : ""}, got action=${result.shouldCreateAction}, type=${result.actionType}`
      );
      console.log(`      Reasoning: ${result.reasoning}`);
      allPassed = false;
    }
  }

  return allPassed;
}

// ─── Phase F: Validation and output ────────────────────────────────────────

function validate(actions, cachedDrafts, customerMemories) {
  console.log("\n=== PHASE F: Validation ===\n");
  let errors = 0;

  // Action count
  if (actions.length !== 2) {
    console.error(`  ✗ Expected 2 actions, got ${actions.length}`);
    errors++;
  } else {
    console.log(`  ✓ 2 actions created`);
  }

  // Action types and priorities
  const a1 = actions.find((a) => a.conversationId === "conv_1");
  const a2 = actions.find((a) => a.conversationId === "conv_2");

  if (!a1 || a1.type !== "invoice_question" || a1.priority !== "high") {
    console.error(
      `  ✗ conv_1 action wrong: expected invoice_question/high, got ${a1?.type}/${a1?.priority}`
    );
    errors++;
  } else {
    console.log(`  ✓ conv_1: invoice_question (high)`);
  }

  if (!a2 || a2.type !== "invoice_summary" || a2.priority !== "low") {
    console.error(
      `  ✗ conv_2 action wrong: expected invoice_summary/low, got ${a2?.type}/${a2?.priority}`
    );
    errors++;
  } else {
    console.log(`  ✓ conv_2: invoice_summary (low)`);
  }

  // No actions for conv_3-6
  for (const id of ["conv_3", "conv_4", "conv_5", "conv_6"]) {
    const stray = actions.find((a) => a.conversationId === id);
    if (stray) {
      console.error(`  ✗ ${id} should not have action, got ${stray.type}`);
      errors++;
    } else {
      console.log(`  ✓ ${id}: no action (correct)`);
    }
  }

  // Customer memories
  const memCount = Object.keys(customerMemories).length;
  if (memCount !== 6) {
    console.error(`  ✗ Expected 6 customer memories, got ${memCount}`);
    errors++;
  } else {
    console.log(`  ✓ 6 customer memories`);
  }

  // Drafts
  const draftCount = Object.keys(cachedDrafts).length;
  if (draftCount !== 2) {
    console.error(`  ✗ Expected 2 drafts, got ${draftCount}`);
    errors++;
  } else {
    console.log(`  ✓ 2 drafts generated`);
  }

  // Draft quality
  for (const [convId, draft] of Object.entries(cachedDrafts)) {
    if (draft.draft.includes("—")) {
      console.error(`  ✗ Draft for ${convId} contains em-dash`);
      errors++;
    }
    if (!draft.draft.includes("Sandro")) {
      console.error(`  ✗ Draft for ${convId} not signed by Sandro`);
      errors++;
    }
    if (!draft.sourceMessageIds || draft.sourceMessageIds.length === 0) {
      console.error(`  ✗ Draft for ${convId} has no sourceMessageIds`);
      errors++;
    }
  }

  return errors;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function seed() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Rauen Flooring AI Pipeline Seed        ║");
  console.log("╚══════════════════════════════════════════╝\n");

  // Phase B: Process messages
  const { actions, customerMemories } = await processConversations();

  // Phase C: Generate FAQ
  await generateFAQFromConversations();

  // Phase D: Generate drafts (now with FAQ in proMemory)
  const cachedDrafts = await generateDrafts(actions, customerMemories);

  // Phase E: Test scenarios
  const testsPassed = await runTestScenarios();

  // Phase F: Validate
  const errors = validate(actions, cachedDrafts, customerMemories);

  // Sort actions by priority
  const priorityWeight = { high: 0, medium: 1, low: 2 };
  actions.sort(
    (a, b) =>
      (priorityWeight[a.priority] ?? 1) - (priorityWeight[b.priority] ?? 1)
  );

  // Remove internal fields before saving
  actions.forEach((a) => delete a.triggerMessageId);

  // Write output
  const seedData = {
    generatedAt: new Date().toISOString(),
    actions,
    cachedDrafts,
    customerMemories,
  };

  const seedPath = path.join(DATA_DIR, "seedData.json");
  fs.writeFileSync(seedPath, JSON.stringify(seedData, null, 2));

  // Write provenance report
  const provenancePath = path.join(DATA_DIR, "seedProvenance.json");
  fs.writeFileSync(provenancePath, JSON.stringify(provenance, null, 2));

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   SEED RESULTS                           ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`  Conversations: ${initialConversations.length}`);
  console.log(`  Actions: ${actions.length}`);
  console.log(`  Drafts: ${Object.keys(cachedDrafts).length}`);
  console.log(`  Customer memories: ${Object.keys(customerMemories).length}`);
  console.log(`  Tests: ${testsPassed ? "ALL PASSED" : "SOME FAILED"}`);
  console.log(`  Validation errors: ${errors}`);
  console.log(`  Output: ${seedPath}`);
  console.log(`  Provenance: ${provenancePath}`);

  if (errors > 0 || !testsPassed) {
    console.error("\n✗ SEED FAILED — fix issues and re-run");
    process.exit(1);
  }

  console.log("\n✓ SEED COMPLETE — all validations passed");
}

seed().catch((err) => {
  console.error("Seed script crashed:", err);
  process.exit(1);
});
