import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { evaluateMessage, generateDraft } from "./claude.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── POST /api/pipeline ────────────────────────────────────────────────────
// Evaluates a message via the Claude AI pipeline.
// Body: { conversation, message, proMemory?, customerMemory?, sender? }
app.post("/api/pipeline", async (req, res) => {
  const { conversation, message, proMemory, customerMemory, sender } = req.body;

  if (!conversation || !message) {
    return res
      .status(400)
      .json({ error: "conversation and message are required" });
  }

  try {
    const result = await evaluateMessage(
      conversation,
      message,
      proMemory || "",
      customerMemory || "",
      sender || "customer"
    );
    res.json(result);
  } catch (err) {
    console.error("Pipeline evaluation error:", err);
    // Return safe fallback — never crash
    res.json({
      shouldCreateAction: false,
      actionType: "none",
      actionTitle: "",
      actionSubtitle: "",
      actionPriority: "low",
      hasSufficientContext: false,
      customerMemoryUpdate: "",
      reasoning: "Pipeline error — fallback response",
    });
  }
});

// ─── POST /api/draft ───────────────────────────────────────────────────────
// Generates an AI draft message via Claude.
// Body: { conversation, actionType, proMemory?, customerMemory? }
app.post("/api/draft", async (req, res) => {
  const { conversation, actionType, proMemory, customerMemory } = req.body;

  if (!conversation || !actionType) {
    return res
      .status(400)
      .json({ error: "conversation and actionType are required" });
  }

  // invoice_request actions never have drafts
  if (actionType === "invoice_request") {
    return res.status(400).json({
      error: "no_draft_available",
      message: "This action type does not support AI drafts",
    });
  }

  try {
    const draft = await generateDraft(
      conversation,
      actionType,
      proMemory || "",
      customerMemory || ""
    );

    if (!draft) {
      return res.status(400).json({
        error: "no_draft_available",
        message: "Insufficient context to generate draft",
      });
    }

    res.json(draft);
  } catch (err) {
    console.error("Draft generation error:", err);
    res.status(500).json({ error: "Draft generation failed" });
  }
});

// ─── Start server ───────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
